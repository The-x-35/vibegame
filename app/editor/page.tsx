"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/lib/hooks/use-user';
import { getAuthToken } from '@/lib/auth-utils';
import { uploadWebGameFile } from '@/lib/utils/chunked-upload';

type V2File = { path: string; content: string };

export default function AIGameEditorPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useUser();

  // Either we get ?id=<gameId> to load existing, or we create fresh in-memory files
  const gameId = params.get('id') || '';
  const initialPrompt = params.get('prompt') || '';

  const [files, setFiles] = useState<V2File[]>([{
    path: 'index.html',
    content: '<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>New Game</title><style>html,body,#app{height:100%;margin:0}canvas{display:block;margin:0 auto}</style></head><body><div id="app"></div><script src="main.js"></script></body></html>'
  },{
    path: 'main.js',
    content: 'document.getElementById("app").innerHTML = "<h1 style=\"color:white;text-align:center;margin-top:20vh\">Hello, Game!</h1>";document.body.style.background="#000";'
  }]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const indexHtml = useMemo(() => files.find(f => f.path === 'index.html')?.content || '', [files]);

  useEffect(() => {
    if (initialPrompt) {
      // Kick off AI generation when entered from homepage with prompt
      callAI(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Render current files into iframe via Blob URLs
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Build a simple in-memory asset map using Blob URLs
    const blobs = new Map<string, string>();
    const makeUrl = (path: string, content: string) => {
      const ext = path.split('.').pop()?.toLowerCase();
      const ct: Record<string,string> = {
        html: 'text/html', css: 'text/css', js: 'application/javascript', json: 'application/json'
      };
      const blob = new Blob([content], { type: ct[ext || ''] || 'text/plain' });
      const url = URL.createObjectURL(blob);
      blobs.set(path, url);
      return url;
    };

    // Build rewritten index.html that points to Blob URLs
    let html = indexHtml;
    for (const f of files) {
      if (f.path === 'index.html') continue;
      const url = makeUrl(f.path, f.content);
      // naive replace for src/href occurrences
      html = html.replace(new RegExp(f.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), url);
    }

    const docUrl = makeUrl('index.html', html);
    iframe.src = docUrl;

    return () => {
      for (const url of blobs.values()) URL.revokeObjectURL(url);
    };
  }, [files, indexHtml]);

  const callAI = async (instruction: string) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: instruction, files })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      if (Array.isArray(data.files)) setFiles(data.files);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'AI generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToS3 = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Create folder prefix wallet/v2/<id>/
      const id = gameId || `game-${Date.now().toString(36)}`;
      const prefix = `${user.wallet}/v2/${id}/`;
      const token = getAuthToken();
      if (!token) throw new Error('Missing auth token');

      const uploaded: { path: string; key: string; url: string }[] = [];

      for (const f of files) {
        const b64 = typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(f.content))) : Buffer.from(f.content, 'utf-8').toString('base64');
        const result = await uploadWebGameFile(b64, f.path, user.wallet, prefix, token, f.path);
        uploaded.push({ path: f.path, key: result.key, url: result.url });
      }

      const indexKey = uploaded.find(u => u.path === 'index.html')?.key || uploaded[0]?.key;

      // Upsert DB record
      const up = await fetch('/api/v2/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id,
          wallet: user.wallet,
          name: id,
          description: '',
          s3Prefix: prefix,
          indexKey,
          files: uploaded,
          isPublic: false,
        })
      });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error || 'Failed to save v2 game');

      // update URL to include id
      if (!gameId) router.replace(`/editor?id=${id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col" style={{ backgroundImage: 'url(/bg.svg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
      <div className="flex-1 w-full min-h-[60vh]">
        <iframe ref={iframeRef} className="w-full h-full border-0" title="Game Preview" />
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe what to add or change (e.g., add enemy that moves left-right)"
          className="flex-1"
          rows={2}
        />
        <div className="flex flex-col gap-2">
          <Button onClick={() => callAI(prompt)} disabled={!prompt.trim() || isGenerating}>
            {isGenerating ? 'Thinking...' : 'Apply'}
          </Button>
          <Button variant="outline" onClick={saveToS3} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}


