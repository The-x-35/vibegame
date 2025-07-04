import { NextResponse } from "next/server";
import OpenAI from 'openai';
import { query } from '@/lib/db';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// We dynamically fetch templates from the DB per request

// Force dynamic runtime so we can use request.json()
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    // Fetch templates from the database
    const dbResult = await query(
      'SELECT name, url, description, id, thumbnail FROM templates ORDER BY created_at',
      []
    );
    // Explicitly type the templates for proper type inference
    const templates = dbResult.rows as Array<{ name: string; url: string; description: string; id: string; thumbnail?: string }>;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a template matcher. Provide 3-4 game template suggestions that best align with the user's request.
Sort the suggestions by relevance, with the closest match first.
For each suggestion, respond using the exact URL from this list:

${templates.map(t => t.url).join('\n')}

Return your output as a JSON object with a "urls" field, e.g.:
{
  "urls": ["url1", "url2", "url3"]
}
`
        },
        { role: "user", content: message }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.3,
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");
    const suggestedUrls = Array.isArray(response.urls) ? response.urls : [];

    // Validate that all suggested URLs are in our template list
    const validUrls = suggestedUrls.filter((url: string) => templates.some(t => t.url === url));
    
    // If we don't have enough valid URLs, add some random ones
    while (validUrls.length < 3) {
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      if (!validUrls.includes(randomTemplate.url)) {
        validUrls.push(randomTemplate.url);
      }
    }

    // Get template details for each URL
    const suggestions = validUrls.map((url: string) => {
      const template = templates.find(t => t.url === url);
      return {
        url: url,
        name: template?.name || "Unknown Game",
        description: template?.description || "",
        id: template?.id || "",
        thumbnail: template?.thumbnail || "/og/og1.png"
      };
    });

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    // Rethrow to let Next.js surface the full stack in terminal
    throw error;
  }
}
