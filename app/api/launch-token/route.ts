import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', {
      ...body,
      apiKey: body.apiKey ? `${body.apiKey.substring(0, 4)}...${body.apiKey.substring(body.apiKey.length - 4)}` : undefined
    });

    if (!body.apiKey) {
      console.error('API key is missing');
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const requestBody = {
      user: body.user,
      name: body.name,
      symbol: body.symbol,
      description: body.description,
      imageUrl: body.imageUrl,
      amount: body.amount,
      twitter: body.twitter,
      telegram: body.telegram,
      website: body.website,
    };
    console.log('Sending request to external API:', requestBody);

    const response = await fetch('https://dolphin-app-leo54.ondigitalocean.app/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': body.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('External API response status:', response.status);
    console.log('External API response headers:', Object.fromEntries(response.headers.entries()));
    
    // Check content type
    const contentType = response.headers.get('content-type');
    console.log('Response content type:', contentType);

    let data;
    try {
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        return NextResponse.json(
          { error: 'Invalid response format from server' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      return NextResponse.json(
        { error: 'Failed to parse server response' },
        { status: 500 }
      );
    }

    console.log('External API response data:', data);

    if (!response.ok) {
      console.error('External API error:', data);
      return NextResponse.json(
        { error: data.error || data.message || 'Failed to launch token' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Detailed error in launch-token API route:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Internal server error: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 