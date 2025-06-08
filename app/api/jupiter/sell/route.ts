import { NextResponse } from 'next/server';
import { PublicKey, Connection } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import { API_ENDPOINTS, TOKENS, JUP_ULTRA_API } from '@/global/constant';

interface JupiterUltraOrderResponse {
  requestId: string;
  transaction: string;
}

export async function POST(request: Request) {
  try {
    console.log('Starting Jupiter sell request...');
    
    const { amount, inputMint, wallet } = await request.json();
    console.log('Request params:', { amount, inputMint, wallet });
    
    if (!amount || !inputMint || !wallet) {
      console.log('Missing required parameters');
      return NextResponse.json({ error: 'Amount, inputMint, and wallet are required' }, { status: 400 });
    }

    const connection = new Connection(API_ENDPOINTS.SOLANA_RPC_ENDPOINT, 'confirmed');
    const fromPublicKey = new PublicKey(wallet);
    const outputMint = TOKENS.SOL;

    // Get token decimals
    const mintInfo = await getMint(connection, new PublicKey(inputMint));
    const inputDecimals = mintInfo.decimals;
    const scaledAmount = amount * Math.pow(10, inputDecimals);

    console.log('Swap parameters:', {
      inputMint,
      outputMint: outputMint.toString(),
      amount: scaledAmount,
      taker: fromPublicKey.toString()
    });

    // Get Jupiter swap quote
    const orderUrl = `${JUP_ULTRA_API}/order?` +
      `inputMint=${inputMint}` +
      `&outputMint=${outputMint.toString()}` +
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
    console.error('Error in Jupiter sell:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process transaction' },
      { status: 500 }
    );
  }
} 