import { NextResponse } from 'next/server';
import { PublicKey, Connection, VersionedTransaction } from '@solana/web3.js';
import { API_ENDPOINTS, TOKENS, JUP_ULTRA_API } from '@/global/constant';
import { jwtDecode } from 'jwt-decode';

interface AppTokenPayload {
  sub: string;
  userId: string;
  wallet: string;
  exp?: number;
  iat?: number;
}

interface JupiterUltraOrderResponse {
  requestId: string;
  transaction: string;
}

export async function POST(request: Request) {
  try {
    console.log('Starting Jupiter buy request...');
    
    const appToken = request.headers.get('Authorization')?.split(' ')[1];
    if (!appToken) {
      console.log('No auth token provided');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Decode token and get user's wallet
    const payload = jwtDecode<AppTokenPayload>(appToken);
    if (!payload || !payload.wallet) {
      console.log('Invalid token payload:', payload);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { amount, outputMint } = await request.json();
    console.log('Request params:', { amount, outputMint });
    
    if (!amount || !outputMint) {
      console.log('Missing required parameters');
      return NextResponse.json({ error: 'Amount and outputMint are required' }, { status: 400 });
    }

    const connection = new Connection(API_ENDPOINTS.SOLANA_RPC_ENDPOINT, 'confirmed');
    const fromPublicKey = new PublicKey(payload.wallet);
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

    // Get the base URL from the request
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    console.log('Sending transaction for signing...');
    // Send to sign route for signing
    const signRes = await fetch(`${baseUrl}/api/transactions/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appToken}`,
      },
      body: JSON.stringify({ transactionHex }),
    });

    const signResult = await signRes.json();
    console.log('Sign response:', signResult);

    if (!signRes.ok) {
      console.error('Signing failed:', signResult);
      return NextResponse.json({ error: signResult.error }, { status: 500 });
    }

    // The sign route has already sent the transaction to the network
    // We just need to return the transaction ID
    return NextResponse.json({
      success: true,
      transactionId: signResult.transactionId,
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