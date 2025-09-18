import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function getTokenPriceAndMarketCap(tokenId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/jupiter/price?tokenId=${tokenId}`);
    if (!res.ok) return { price: 0, marketCap: 0 };
    const data = await res.json();
    return { price: data.price || 0, marketCap: data.marketCap || 0 };
  } catch {
    return { price: 0, marketCap: 0 };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const validSortFields = ['created_at', 'views_count', 'likes_count', 'name', 'price', 'market_cap'];
    const validSortOrders = ['asc', 'desc'];

    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json({ error: 'Invalid sort field' }, { status: 400 });
    }
    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json({ error: 'Invalid sort order' }, { status: 400 });
    }

    const result = await query(
      `SELECT id, name, url, description, likes_count, wallet, thumbnail, ca, views_count, created_at 
       FROM projects 
       WHERE type = 'waifu' AND ca IS NOT NULL AND ca != ''`,
      []
    );

    let items = result.rows;

    if (sortBy === 'price' || sortBy === 'market_cap') {
      const withPrices = [] as any[];
      for (const row of items) {
        const { price, marketCap } = await getTokenPriceAndMarketCap(row.ca);
        withPrices.push({ ...row, price, marketCap });
        await new Promise(r => setTimeout(r, 50));
      }
      items = withPrices;
    } else {
      const sorted = await query(
        `SELECT id, name, url, description, likes_count, wallet, thumbnail, ca, views_count, created_at 
         FROM projects 
         WHERE type = 'waifu' AND ca IS NOT NULL AND ca != ''
         ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`,
        []
      );
      items = sorted.rows;
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching waifus with prices:', error);
    return NextResponse.json({ error: 'Failed to fetch waifus' }, { status: 500 });
  }
}


