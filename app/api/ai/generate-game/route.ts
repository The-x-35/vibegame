import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * POST /api/ai/generate-game
 * Body: { prompt: string, files?: Array<{ path: string, content: string }> }
 * Returns: { files: Array<{ path: string, content: string }> }
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, files } = await req.json();
    console.log('[AI API] Incoming request', {
      promptPreview: typeof prompt === 'string' ? prompt.slice(0, 120) : typeof prompt,
      filesCount: Array.isArray(files) ? files.length : 0,
      fileNames: Array.isArray(files) ? files.map((f: any) => f?.path).slice(0, 10) : []
    });
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server missing GROK_API_KEY' }, { status: 500 });
    }

    // System prompt to force a JSON file map output
    const system = [
      'You are an expert web game generator. Output a minimal playable game in plain HTML, CSS, and JS.',
      'Always return a compact JSON object with key "files" that is an array of {path, content}.',
      'Do not include explanations. Ensure index.html is included and self-contained links to other files by relative path.',
      'Target modern browsers. Keep assets inline or minimal. Avoid external CDNs unless necessary.'
    ].join('\n');

    const userContent = {
      role: 'user',
      content: JSON.stringify({
        instruction: prompt,
        currentFiles: Array.isArray(files) ? files : [],
        format: 'json'
      })
    };

    // Choose endpoint: GROK_URL env, or autodetect by key prefix
    const configuredUrl = process.env.GROK_URL;
    const isOpenRouterKey = apiKey.startsWith('sk-');
    const endpoint = configuredUrl
      || (isOpenRouterKey ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions');

    // Build headers; include OpenRouter attribution headers if using OpenRouter
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (endpoint.includes('openrouter.ai')) {
      if (process.env.NEXT_PUBLIC_SITE_URL) headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_SITE_URL;
      headers['X-Title'] = process.env.OPENROUTER_TITLE || 'VibeGame';
    }

    console.log('[AI API] Using endpoint', { endpoint, isOpenRouterKey, configured: !!configuredUrl });

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'x-ai/grok-code-fast-1',
        messages: [
          { role: 'system', content: system },
          userContent
        ],
        temperature: 0.2,
        max_tokens: 1800,
        // OpenRouter may ignore response_format; harmless if unsupported
        response_format: { type: 'json_object' }
      })
    });
    const rawText = await resp.clone().text();
    const headerDump: Record<string, string> = {};
    resp.headers.forEach((v, k) => (headerDump[k] = v));
    console.log('[AI API] Grok response', {
      status: resp.status,
      ok: resp.ok,
      headers: headerDump,
      bodyPreview: rawText.slice(0, 800)
    });

    if (!resp.ok) {
      const text = await resp.text();
      // Optional safe fallback that still returns a playable game so UI doesn't break
      const enableFallback = process.env.ENABLE_AI_FALLBACK === 'true';
      if (enableFallback) {
        const fallback = {
          files: [
            { path: 'index.html', content: `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${prompt}</title><style>html,body,#app{height:100%;margin:0}body{background:#000;color:#fff;font-family:sans-serif}</style></head><body><div id="app"></div><script src="main.js"></script></body></html>` },
            { path: 'main.js', content: `const app=document.getElementById('app');app.innerHTML='<h1 style="text-align:center;margin-top:20vh">${prompt}</h1><p style="text-align:center;opacity:.7">(fallback demo)</p>';` },
            { path: 'style.css', content: `/* ${prompt} */` },
          ]
        };
        return NextResponse.json(fallback, { status: 200 });
      }
      return NextResponse.json({ error: 'Grok API error', status: resp.status, detail: text }, { status: 500 });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Empty response from Grok' }, { status: 500 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Some providers already return objects; fallback
      parsed = typeof content === 'object' ? content : null;
    }
    if (!parsed || !Array.isArray(parsed.files)) {
      return NextResponse.json({ error: 'Invalid AI output format' }, { status: 500 });
    }

    // Ensure unique, normalized paths
    const filesOut = parsed.files.map((f: any) => ({
      path: String(f.path).replace(/^\/+/, ''),
      content: String(f.content ?? '')
    }));

    return NextResponse.json({ files: filesOut }, { status: 200 });
  } catch (err: any) {
    console.error('AI generate error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to generate game' }, { status: 500 });
  }
}


