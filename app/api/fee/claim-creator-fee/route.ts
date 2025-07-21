import { NextRequest, NextResponse } from 'next/server';

// Primary base URL for the DigitalOcean-hosted minter service.
const MINTER_API_BASE_URL = process.env.MINTER_API_BASE_URL || "https://api.sendshot.ag";

interface ClaimFeeRequest {
  tokenMint: string;
  claimer: string;
}

export async function POST(request: NextRequest) {
  try {
    const { tokenMint, claimer } = await request.json() as ClaimFeeRequest;

    if (!tokenMint || !claimer) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters: tokenMint, claimer"
        },
        { status: 400 }
      );
    }

    // Validate public key format (basic check)
    if (tokenMint.length < 32 || tokenMint.length > 44 || claimer.length < 32 || claimer.length > 44) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid public key format for tokenMint or claimer"
        },
        { status: 400 }
      );
    }

    // Ensure we have a base URL configured
    if (!MINTER_API_BASE_URL) {
      throw new Error('MINTER_API_BASE_URL environment variable is missing');
    }

    const resolvedApiKey = process.env.MINTER_API_KEY || process.env.PUMP_API_KEY!;
    const url = `${MINTER_API_BASE_URL}/fee/claim-creator-fee`;

    console.log(`🌐 Sending POST ${url} with tokenMint: ${tokenMint}, claimer: ${claimer}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': resolvedApiKey
      },
      body: JSON.stringify({ tokenMint, claimer }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Claim fee API error response:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || `API request failed with status ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📥 Claim fee API response:', data);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('💥 Error claiming creator fees:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed. Use POST to claim creator fees.' },
    { status: 405 }
  );
} 