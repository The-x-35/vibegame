import { NextRequest, NextResponse } from 'next/server';

// Primary base URL for the DigitalOcean-hosted minter service.
const MINTER_API_BASE_URL = process.env.MINTER_API_BASE_URL || "https://api.sendshot.ag";

interface FeeRequest {
  tokenMint: string;
  claimer: string;
}

interface FeeApiResponse {
  tx: {
    tx: string;
    curveFee: number;
    lpFee: {
      claimedFee: number;
      unclaimedFee: number;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const { tokenMint, claimer } = await request.json() as FeeRequest;

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
      console.error('❌ Fee API error response:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || `API request failed with status ${response.status}`
        },
        { status: response.status }
      );
    }

    const data: FeeApiResponse = await response.json();
    console.log('📥 Fee API response:', data);

    // Extract data from the correct structure
    const transactionData = data.tx;
    const totalUnclaimedFee = transactionData.lpFee.unclaimedFee;
    const totalClaimedFee = transactionData.lpFee.claimedFee;
    const hasUnclaimedFees = totalUnclaimedFee > 0;

    return NextResponse.json({
      success: true,
      data: {
        // Transaction for claiming fees
        tx: transactionData.tx,
        // Fee information
        fees: {
          curveFee: transactionData.curveFee,
          lpFee: {
            claimedFee: totalClaimedFee,
            unclaimedFee: totalUnclaimedFee
          },
          totalFee: totalClaimedFee + totalUnclaimedFee,
          hasUnclaimedFees
        }
      }
    });

  } catch (error) {
    console.error('💥 Error fetching fee data:', error);
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
    { message: 'Method not allowed. Use POST to get fee data and claim transaction.' },
    { status: 405 }
  );
} 