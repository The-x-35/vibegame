import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { query } from '@/lib/db';
import { verifyWallet } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { wallet, signature, message } = await request.json();
    
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Validate wallet address format
    if (!verifyWallet(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    // For now, we'll trust wallet connection without signature verification
    // In production, you should verify the signature to prove wallet ownership
    // This is a simplified version for development

    // Check if user exists in database, create if not
    let result = await query(
      `INSERT INTO users (wallet, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       ON CONFLICT (wallet) DO UPDATE
         SET updated_at = NOW()
       RETURNING *;`,
      [wallet]
    );

    const user = result.rows[0];

    // Generate JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
    const token = await new SignJWT({ 
      wallet: user.wallet,
      sub: user.wallet 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    return NextResponse.json({
      token,
      user: {
        wallet: user.wallet,
        name: user.name
      },
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    });

  } catch (error) {
    console.error('[AUTH_LOGIN]', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, { status: 500 });
  }
} 