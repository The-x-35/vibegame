import { NextResponse } from 'next/server';
import { Transaction, SystemProgram, PublicKey, Connection } from '@solana/web3.js';
import { API_ENDPOINTS, WALLET } from '@/global/constant';
import { jwtDecode } from 'jwt-decode';

interface AppTokenPayload {
  sub: string;
  userId: string;
  wallet: string;
  exp?: number;
  iat?: number;
}

export async function POST(request: Request) {
  try {
    const appToken = request.headers.get('Authorization')?.split(' ')[1];
    if (!appToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Decode token and get user's wallet
    const payload = jwtDecode<AppTokenPayload>(appToken);
    if (!payload || !payload.wallet) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const connection = new Connection(API_ENDPOINTS.SOLANA_RPC_ENDPOINT, 'confirmed');
    const fromPublicKey = new PublicKey(payload.wallet);
    const toPublicKey = WALLET;

    // Create the transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports: 0.01 * 1e9, // Convert SOL to lamports (0.01 SOL)
      })
    );

    // Get recent blockhash and set fee payer
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    // Serialize transaction
    const serializedMessage = transaction.serialize({
      requireAllSignatures: false,
    });
    const transactionHex = serializedMessage.toString('hex');

    // Get the base URL from the request
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    // Send to sign route for signing and execution
    const signRes = await fetch(`${baseUrl}/api/transactions/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appToken}`,
      },
      body: JSON.stringify({ transactionHex }),
    });

    const result = await signRes.json();
    if (!signRes.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process transaction' },
      { status: 500 }
    );
  }
} 