import { NextResponse } from 'next/server';

export async function GET() {
  // Sample data - replace with actual Jupiter API integration later
  return NextResponse.json({
    price: 0.25,
    lastUpdated: new Date().toISOString()
  });
} 