import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { QueryResult } from 'pg';

// Primary base URL for the DigitalOcean-hosted minter service.
// If the env var is not set, we default to the canonical production URL.
const MINTER_API_BASE_URL = process.env.MINTER_API_BASE_URL || "https://dolphin-app-leo54.ondigitalocean.app";

interface TokenFormData {
  user: string;
  tokenName: string;
  tokenTicker: string;
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  image?: string | File;
  initialBuyAmount?: number;
  // Optional API key coming from the client; overrides env key if provided.
  apiKey?: string;
}

interface MinterApiPayload {
  user: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  amount?: number;
  twitter?: string;
  telegram?: string;
  website?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

interface TokenLaunch {
  token_address: string;
  token_name: string;
  token_ticker: string;
  description: string;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  image_url: string;
  is_launched: boolean;
  created_at: Date;
  updated_at: Date;
}

function validateFormData(data: TokenFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.user || data.user.trim().length === 0) {
    errors.push({ field: 'user', message: 'User public key is required' });
  } else {
    const userKey = data.user.trim();
    if (userKey.length < 32 || userKey.length > 44) {
      errors.push({ field: 'user', message: 'Invalid user public key format' });
    }
  }

  if (!data.tokenName || data.tokenName.trim().length === 0) {
    errors.push({ field: 'tokenName', message: 'Token name is required' });
  } else if (data.tokenName.trim().length < 2) {
    errors.push({ field: 'tokenName', message: 'Token name must be at least 2 characters long' });
  } else if (data.tokenName.trim().length > 50) {
    errors.push({ field: 'tokenName', message: 'Token name must be less than 50 characters' });
  }

  if (!data.tokenTicker || data.tokenTicker.trim().length === 0) {
    errors.push({ field: 'tokenTicker', message: 'Token ticker is required' });
  } else {
    const ticker = data.tokenTicker.trim().toUpperCase();
    if (ticker.length < 2 || ticker.length > 10) {
      errors.push({ field: 'tokenTicker', message: 'Symbol must be less than 10 characters' });
    }
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Token description is required' });
  } else if (data.description.trim().length > 500) {
    errors.push({ field: 'description', message: 'Description must be less than 500 characters' });
  }

  if (!data.image) {
    errors.push({ field: 'image', message: 'Image is required' });
  } else if (typeof data.image === 'string') {
    if (data.image.trim().length === 0) {
      errors.push({ field: 'image', message: 'Image URL is required' });
    } else if (data.image.startsWith('data:image/')) {
      if (!data.image.includes('base64,')) {
        errors.push({ field: 'image', message: 'Invalid base64 image format' });
      }
    } else {
      try {
        new URL(data.image);
      } catch {
        errors.push({ field: 'image', message: 'Please enter a valid image URL' });
      }
    }
  }

  if (data.website && data.website.trim().length > 0) {
    try {
      new URL(data.website);
    } catch {
      errors.push({ field: 'website', message: 'Please enter a valid website URL' });
    }
  }

  if (data.twitter && data.twitter.trim().length > 0) {
    const twitter = data.twitter.trim();
    if (!twitter.startsWith('@') && !twitter.includes('twitter.com') && !twitter.includes('x.com')) {
      errors.push({ field: 'twitter', message: 'Please enter a valid Twitter handle (e.g., @username)' });
    }
  }

  if (data.telegram && data.telegram.trim().length > 0) {
    const telegram = data.telegram.trim();
    if (!telegram.startsWith('@') && !telegram.includes('t.me')) {
      errors.push({ field: 'telegram', message: 'Please enter a valid Telegram handle (e.g., @username)' });
    }
  }

  if (data.initialBuyAmount !== undefined && data.initialBuyAmount !== null) {
    if (typeof data.initialBuyAmount !== 'number' || data.initialBuyAmount < 0) {
      errors.push({ field: 'initialBuyAmount', message: 'Amount must be a positive number' });
    }
  }

  return errors;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json() as TokenFormData;
    console.log('🔔 Received /api/launch request with body:', formData);

    // Validate the form data
    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        },
        { status: 400 }
      );
    }

    // Image is expected to be a direct URL – no Pinata upload.
    const imageUrl = formData.image as string;

    // Ensure we have a base URL configured
    if (!MINTER_API_BASE_URL) {
      throw new Error('MINTER_API_BASE_URL environment variable is missing');
    }

    // Prepare payload for minter API
    const payload: MinterApiPayload = {
      user: formData.user.trim(),
      name: formData.tokenName.trim(),
      symbol: formData.tokenTicker.trim().toUpperCase(),
      description: formData.description.trim(),
      imageUrl: imageUrl
    };

    if (formData.initialBuyAmount) {
      payload.amount = formData.initialBuyAmount;
    }
    console.log('📦 Prepared payload for minter /mint:', payload);

    // We now only use the /mint endpoint.
    const resolvedApiKey = formData.apiKey?.trim() || process.env.NEXT_PUBLIC_MINTER_API_KEY || process.env.MINTER_API_KEY || process.env.PUMP_API_KEY!;

    const url = `${MINTER_API_BASE_URL}/mint/post-signed-tx`;
    console.log(`🌐 Sending POST ${url} with x-api-key ${resolvedApiKey?.slice(0,4)}***`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': resolvedApiKey
      },
      body: JSON.stringify(payload),
    });

    console.log('⬆️  Request body:', payload);
    console.log('⬇️  Waiting for minter response...');
    let lastRawText = '';

    // Attempt to parse the response as JSON. If that fails (e.g. HTML error page),
    // capture the raw text so we can surface a helpful error to the caller.
    let responseData: any;
    const contentType = response.headers.get('content-type') || '';
    try {
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        // reuse lastRawText if available to avoid reading body twice
        responseData = { raw: lastRawText || (await response.text()) };
      }
    } catch (parseErr) {
      responseData = { raw: lastRawText || (await response.text()) };
    }

    console.log('📥 Minter response status:', response.status);

    if (!response.ok) {
      console.error('❌ Minter API error response:', responseData);
      return NextResponse.json(
        {
          success: false,
          message: 'Token launch failed',
          error: responseData.error || responseData.raw || `API request failed with status ${response.status}`
        },
        { status: 400 }
      );
    }

    // If we expected JSON but received something else, treat it as an error even if 2xx.
    if (responseData && responseData.raw) {
      console.error('❌ Minter API returned non-JSON response:', responseData.raw);
      return NextResponse.json(
        {
          success: false,
          message: 'Token launch failed – unexpected response from minter API',
          error: responseData.raw.substring(0, 500) // avoid huge logs
        },
        { status: 502 }
      );
    }

    console.log('📥 Parsed minter response data:', responseData);

    // Store token data in database
    const result = await query(
      `INSERT INTO token_launches (
        token_address, token_name, token_ticker, description, website, twitter, telegram, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        responseData.mint,
        formData.tokenName.trim(),
        formData.tokenTicker.trim().toUpperCase(),
        formData.description.trim(),
        formData.website?.trim() || null,
        formData.twitter?.trim() || null,
        formData.telegram?.trim() || null,
        imageUrl
      ]
    );

    if (!result.rows || result.rows.length === 0) {
      console.error('❌ Database error: Failed to save token data');
      return NextResponse.json(
        {
          success: true,
          message: 'Token launched successfully but failed to save to database',
          warning: 'Database save failed - please contact support',
          data: {
            tx: responseData.tx,
            tokenAddress: responseData.mint,
            tokenName: formData.tokenName.trim(),
            tokenTicker: formData.tokenTicker.trim().toUpperCase(),
            description: formData.description.trim(),
            website: formData.website?.trim(),
            twitter: formData.twitter?.trim(),
            telegram: formData.telegram?.trim(),
            imageUrl: imageUrl
          }
        },
        { status: 200 }
      );
    }

    const savedToken = result.rows[0];
    console.log('💾 Saved token to DB:', savedToken);

    return NextResponse.json({
      success: true,
      message: 'Token launched successfully! 🚀',
      data: {
        tx: responseData.tx,
        tokenAddress: savedToken.token_address,
        tokenName: savedToken.token_name,
        tokenTicker: savedToken.token_ticker,
        description: savedToken.description,
        website: savedToken.website,
        twitter: savedToken.twitter,
        telegram: savedToken.telegram,
        imageUrl: savedToken.image_url
      }
    });

  } catch (error) {
    console.error('💥 Error processing token launch:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error occurred while processing your request',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed. Use POST to launch a token.' },
    { status: 405 }
  );
} 