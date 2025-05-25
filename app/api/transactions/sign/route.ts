import { NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { API_ENDPOINTS } from '@/global/constant';
import { Connection, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

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

    const { transactionHex } = await request.json();
    if (!transactionHex) {
      return NextResponse.json({ error: 'Transaction hex is required' }, { status: 400 });
    }

    // Get signature from external service
    try {
      const res = await fetch(API_ENDPOINTS.SIGN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${appToken}`,
        },
        body: JSON.stringify({
          operation: "signTransaction",
          payload: transactionHex
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Signing service error:', { status: res.status, data });
        throw new Error(data.message || `Signing service error: ${res.status}`);
      }

      if (!data.signature) {
        throw new Error('Failed to get signature from signing service');
      }

      // Send and confirm transaction
      const connection = new Connection(API_ENDPOINTS.SOLANA_RPC_ENDPOINT, 'confirmed');
      const signedTxBuffer = Buffer.from(data.signature, 'hex');
      const txid = await connection.sendRawTransaction(signedTxBuffer, {
        skipPreflight: true,
      });

      const confirmation = await connection.confirmTransaction(txid, 'confirmed');
      if (confirmation.value.err) {
        throw new Error(`Transaction confirmation failed: ${confirmation.value.err}`);
      }

      return NextResponse.json({
        success: true,
        transactionId: txid,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Signing service error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to connect to signing service' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Transaction processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process transaction' },
      { status: 500 }
    );
  }
} 