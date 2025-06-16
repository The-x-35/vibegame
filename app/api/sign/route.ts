import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const MINTER_API_BASE_URL = process.env.MINTER_API_BASE_URL || "https://dolphin-app-leo54.ondigitalocean.app";

if (!MINTER_API_BASE_URL) {
  throw new Error('MINTER_API_BASE_URL env variable is missing');
}

interface SignTxRequest {
  mintAddress: string;
  tx: string;
  tokenTicker: string;
  username: string;
}

async function signTransaction(mintAddress: string, tx: string) {
  const url = `${MINTER_API_BASE_URL}/mint/sign-tx`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': process.env.NEXT_PUBLIC_MINTER_API_KEY || process.env.MINTER_API_KEY || process.env.PUMP_API_KEY!
    },
    body: JSON.stringify({ mintAddress, tx }),
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  // Attempt safe parse
  let data: any;
  const contentType = response.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { raw: await response.text() };
    }
  } catch (parseErr) {
    data = { raw: await response.text() };
  }

  // If the minter returned non-JSON but the request was OK, treat it as success and return the raw payload
  if (data.raw) {
    console.warn('⚠️ Minter responded with non-JSON payload:', data.raw?.slice?.(0, 200));
    return data.raw;
  }

  // Prefer `signature`, but fall back to any common hash/tx fields or full JSON blob
  const possibleSig = data.signature || data.txid || data.sig || data.hash || null;

  return possibleSig ?? data;
}

export async function POST(request: NextRequest) {
  try {
    const { mintAddress, tx, tokenTicker, username } = await request.json() as SignTxRequest;

    if (!mintAddress || !tx) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields',
          error: 'mintAddress and tx are required'
        },
        { status: 400 }
      );
    }

    // Broadcast the signed transaction through the minter service
    const signature = await signTransaction(mintAddress, tx);

    // Update token launch status in database
    const result = await query(
      `UPDATE token_launches 
       SET is_launched = true,
           updated_at = CURRENT_TIMESTAMP
       WHERE token_address = $1
       RETURNING *`,
      [mintAddress]
    );

    if (!result.rows || result.rows.length === 0) {
      console.error('❌ Database error: Failed to update token launch status');
      return NextResponse.json(
        {
          success: true,
          message: 'Transaction signed successfully but failed to update database',
          warning: 'Database update failed - please contact support',
          data: { signature }
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction signed successfully! 🎉',
      data: { signature }
    });

  } catch (error) {
    console.error('💥 Error signing transaction:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to sign transaction',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed. Use POST to sign a transaction.' },
    { status: 405 }
  );
} 