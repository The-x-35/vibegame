import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PublicKey, Connection } from "@solana/web3.js";
import { getMint } from '@solana/spl-token';
import { API_ENDPOINTS } from '@/global/constant';

async function getTokenPriceAndMarketCap(tokenId: string) {
  try {
    // Validate token ID format
    if (!tokenId || tokenId.length < 32) {
      return { price: 0, marketCap: 0 };
    }

    // Use the same Jupiter API endpoint as the working price API
    const response = await fetch(
      `https://lite-api.jup.ag/price/v3?ids=${tokenId}`,
      { 
        headers: { 'Accept': 'application/json' }
      }
    );

    if (!response.ok) {
      console.warn(`Jupiter API returned ${response.status} for token ${tokenId}`);
      return { price: 0, marketCap: 0 };
    }

    const data = await response.json();
    const tokenData = data[tokenId];

    if (!tokenData || !tokenData.usdPrice) {
      console.warn(`No price data available for token ${tokenId}`);
      return { price: 0, marketCap: 0 };
    }

    const price = tokenData.usdPrice;

    // Get token supply for market cap calculation
    try {
      const connection = new Connection(API_ENDPOINTS.SOLANA_RPC_ENDPOINT, 'confirmed');
      const mintInfo = await getMint(connection, new PublicKey(tokenId));
      const supply = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);
      const marketCap = supply * parseFloat(price);

      return { price: parseFloat(price), marketCap };
    } catch (mintError) {
      // If we can't get mint info, just return price
      console.warn(`Could not fetch mint info for ${tokenId}:`, mintError);
      return { price: parseFloat(price), marketCap: 0 };
    }
  } catch (error) {
    console.error(`Error fetching price for token ${tokenId}:`, error);
    return { price: 0, marketCap: 0 };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Validate sort parameters
    const validSortFields = ['created_at', 'views_count', 'likes_count', 'name', 'price', 'market_cap'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json({ error: 'Invalid sort field' }, { status: 400 });
    }
    
    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json({ error: 'Invalid sort order' }, { status: 400 });
    }

    // Get games from database
    const result = await query(
      `SELECT id, name, url, description, likes_count, wallet, thumbnail, ca, views_count, created_at 
       FROM projects 
       WHERE ca IS NOT NULL AND ca != '' AND type = 'game'`,
      []
    );
    
    let games = result.rows;

    // If sorting by price or market cap, fetch price data
    if (sortBy === 'price' || sortBy === 'market_cap') {
      console.log(`Fetching price data for ${games.length} games...`);
      
      // Process games sequentially to avoid overwhelming the API
      const gamesWithPrices = [];
      
      for (const game of games) {
        if (game.ca) {
          const { price, marketCap } = await getTokenPriceAndMarketCap(game.ca);
          gamesWithPrices.push({
            ...game,
            price,
            marketCap
          });
          
          // Small delay between requests to be respectful to the API
          await new Promise(resolve => setTimeout(resolve, 50));
        } else {
          gamesWithPrices.push({
            ...game,
            price: 0,
            marketCap: 0
          });
        }
      }
      
      games = gamesWithPrices;
      console.log(`Price data fetched for ${games.length} games`);
    }

    // Sort the games
    if (sortBy === 'price' || sortBy === 'market_cap') {
      games.sort((a, b) => {
        const aValue = sortBy === 'price' ? a.price : a.marketCap;
        const bValue = sortBy === 'price' ? b.price : b.marketCap;
        
        if (sortOrder === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    } else {
      // For database fields, use the existing query
      const sortedResult = await query(
        `SELECT id, name, url, description, likes_count, wallet, thumbnail, ca, views_count, created_at 
         FROM projects 
         WHERE ca IS NOT NULL AND ca != ''
         ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`,
        []
      );
      games = sortedResult.rows;
    }

    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games with prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
} 