import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { amount } = body;

  // Sample response - replace with actual Jupiter API integration later
  return NextResponse.json({
    success: true,
    transactionId: 'sample_tx_id_456',
    amount,
    timestamp: new Date().toISOString()
  });
} 