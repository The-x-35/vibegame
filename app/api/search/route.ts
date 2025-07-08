import { NextResponse } from "next/server";
import { query } from '@/lib/db';

// Force dynamic runtime
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { query: searchQuery } = await req.json();
    
    if (!searchQuery || typeof searchQuery !== 'string') {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Clean and prepare search terms - split into individual words
    const searchTerm = searchQuery.trim().toLowerCase();
    const words = searchTerm.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }
    
    // Build dynamic WHERE clause for matching any word
    const wordConditions = words.map((_, index) => 
      `(LOWER(name) ILIKE $${index + 1} OR LOWER(description) ILIKE $${index + 1})`
    ).join(' OR ');
    
    // Build relevance scoring - count matches and prioritize name matches
    const relevanceScore = `
      (
        -- Exact full phrase match in name (highest priority)
        CASE WHEN LOWER(name) = $${words.length + 1} THEN 1000 ELSE 0 END +
        -- Full phrase in name
        CASE WHEN LOWER(name) ILIKE $${words.length + 2} THEN 500 ELSE 0 END +
        -- Full phrase in description
        CASE WHEN LOWER(description) ILIKE $${words.length + 2} THEN 250 ELSE 0 END +
        -- Count individual word matches in name (higher weight)
        ${words.map((_, index) => 
          `CASE WHEN LOWER(name) ILIKE $${index + 1} THEN 100 ELSE 0 END`
        ).join(' + ')} +
        -- Count individual word matches in description (lower weight)
        ${words.map((_, index) => 
          `CASE WHEN LOWER(description) ILIKE $${index + 1} THEN 50 ELSE 0 END`
        ).join(' + ')} +
        -- Bonus for name starting with search term
        CASE WHEN LOWER(name) ILIKE $${words.length + 3} THEN 200 ELSE 0 END
      )
    `;
    
    // Search in templates table - match any word and sort by relevance
    const searchResults = await query(
      `SELECT id, name, url, description, thumbnail,
              ${relevanceScore} as relevance_score
       FROM templates 
       WHERE ${wordConditions}
       ORDER BY relevance_score DESC, name ASC
       LIMIT 12`,
      [...words.map(word => `%${word}%`), searchTerm, `%${searchTerm}%`, `${searchTerm}%`]
    );

    // Handle the results properly - check if it has rows property like in chat API
    let templates: any[] = [];
    if (Array.isArray(searchResults)) {
      templates = searchResults;
    } else if (searchResults && (searchResults as any).rows) {
      templates = (searchResults as any).rows;
    }

    // If no results found, get some popular templates
    if (templates.length === 0) {
      const popularResults = await query(
        'SELECT id, name, url, description, thumbnail FROM templates ORDER BY created_at LIMIT 6',
        []
      );
      
      if (Array.isArray(popularResults)) {
        templates = popularResults;
      } else if (popularResults && (popularResults as any).rows) {
        templates = (popularResults as any).rows;
      }
    }

    // Format the results to match the expected structure
    const formattedSuggestions = templates.map((template: any) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      url: template.url,
      thumbnail: template.thumbnail || "/og/og1.png"
    }));

    return NextResponse.json({ suggestions: formattedSuggestions });

  } catch (error) {
    console.error("Error in /api/search:", error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 