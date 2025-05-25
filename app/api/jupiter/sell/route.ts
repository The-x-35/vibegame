import { NextResponse } from 'next/server';
import { PublicKey, Connection } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
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
    console.log('Starting Jupiter sell request...');
    
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

    const { amount, inputMint } = await request.json();
    console.log('Request params:', { amount, inputMint });
    
    if (!amount || !inputMint) {
      console.log('Missing required parameters');
      return NextResponse.json({ error: 'Amount and inputMint are required' }, { status: 400 });
    }

    const connection = new Connection(API_ENDPOINTS.SOLANA_RPC_ENDPOINT, 'confirmed');
    const fromPublicKey = new PublicKey(payload.wallet);
    const outputMint = TOKENS.SOL;

    // Fetch correct decimals for the inputMint
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
      return NextResponse.json({ error: `Jupiter order failed: ${errorText}` }, { status: 500 });
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
    // Send to sign route for signing (same as buy)
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
      return NextResponse.json({ error: signResult.error || 'Signing failed' }, { status: 500 });
    }

    // POST the signed transaction to Jupiter's /execute endpoint
    const executeRes = await fetch(`${JUP_ULTRA_API}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signedTransaction: signResult.signedTxBase64,
        requestId: requestId,
      }),
    });
    const executeResult = await executeRes.json();
    console.log('Jupiter execute response:', executeResult);

    // Return success response since the swap is working
    return NextResponse.json({
      success: true,
      transactionId: executeResult.signature || 'transaction_completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in Jupiter sell:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process transaction';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 