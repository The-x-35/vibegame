import { NextResponse } from "next/server";
import OpenAI from 'openai';
import { query } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 });

    const result = await query(
      'SELECT system_prompt FROM projects WHERE id = $1 AND type = \"waifu\"',
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Waifu not found' }, { status: 404 });
    }
    const systemPrompt = result.rows[0].system_prompt || 'You are a helpful AI waifu.';

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.8,
    });

    const reply = completion.choices[0].message.content || '';
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[WAIFU_CHAT]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


