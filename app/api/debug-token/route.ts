import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    console.log('🔍 Debug token API called');
    
    try {
        const token = req.headers.get("Authorization")?.split(" ")[1];
        console.log('🔍 Received token:', token ? `${token.substring(0, 20)}...` : 'null');
        
        if (!token) {
            return NextResponse.json({ error: "No token provided" }, { status: 400 });
        }

        console.log('🔍 About to verify token...');
        const payload = await verifyToken(token);
        console.log('🔍 verifyToken result:', payload);

        if (!payload) {
            return NextResponse.json({ 
                error: "Token verification failed",
                debug: "verifyToken returned null"
            }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            payload,
            debug: {
                wallet: payload.wallet,
                userId: payload.userId,
                userIdType: typeof payload.userId,
                sub: payload.sub
            }
        });

    } catch (error) {
        console.error('🔍 Debug token error:', error);
        return NextResponse.json({ 
            error: "Server error during token debug",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 