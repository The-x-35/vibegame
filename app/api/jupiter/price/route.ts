import { NextResponse } from 'next/server';
import { PublicKey } from "@solana/web3.js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');

  if (!tokenId) {
    return NextResponse.json(
      { error: 'Token ID is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.jup.ag/price/v2?ids=${tokenId}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch price: ${response.statusText}`);
    }

    const data = await response.json();
    const price = data.data[tokenId]?.price;

    if (!price) {
      throw new Error("Price data not available for the given token.");
    }

    return NextResponse.json({
      price: parseFloat(price),
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Price fetch failed: ${error.message}` },
      { status: 500 }
    );
  }
} 