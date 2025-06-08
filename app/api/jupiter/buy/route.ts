import { NextResponse } from 'next/server';
import { PublicKey, Connection, VersionedTransaction } from '@solana/web3.js';
import { API_ENDPOINTS, TOKENS, JUP_ULTRA_API } from '@/global/constant';

interface JupiterUltraOrderResponse {
  requestId: string;
  transaction: string;
}

export async function POST(request: Request) {
  try {
    console.log('Starting Jupiter buy request...');
    
    const { amount, outputMint, wallet } = await request.json();
    console.log('Request params:', { amount, outputMint, wallet });
    
    if (!amount || !outputMint || !wallet) {
      console.log('Missing required parameters');
      return NextResponse.json({ error: 'Amount, outputMint, and wallet are required' }, { status: 400 });
    }

    const connection = new Connection(API_ENDPOINTS.SOLANA_RPC_ENDPOINT, 'confirmed');
    const fromPublicKey = new PublicKey(wallet);
    const inputMint = TOKENS.SOL;
    const inputDecimals = 9;
    const scaledAmount = amount * Math.pow(10, inputDecimals);

    console.log('Swap parameters:', {
      inputMint: inputMint.toString(),
      outputMint,
      amount: scaledAmount,
      taker: fromPublicKey.toString()
    });

    // Get Jupiter swap quote
    const orderUrl = `${JUP_ULTRA_API}/order?` +
      `inputMint=${inputMint.toString()}` +
      `&outputMint=${outputMint}` +
      `&amount=${scaledAmount}` +
      `&taker=${fromPublicKey.toString()}`;
    
    console.log('Fetching Jupiter order:', orderUrl);
    
    const orderResponse = await fetch(orderUrl);
    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Jupiter order failed:', errorText);
      throw new Error(`Jupiter order failed: ${errorText}`);
    }

    const orderData: JupiterUltraOrderResponse = await orderResponse.json();
    console.log('Jupiter order response:', orderData);

    const requestId = orderData.requestId;
    const transactionBase64 = orderData.transaction;

    // Convert base64 transaction to hex for signing
    const transactionBuffer = Buffer.from(transactionBase64, 'base64');
    const transactionHex = transactionBuffer.toString('hex');
    console.log('Converted transaction to hex');

    // Return the transaction hex and request ID for client-side signing
    return NextResponse.json({
      transactionHex,
      requestId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in Jupiter buy:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process transaction' },
      { status: 500 }
    );
  }
} 