"use client";

import { use } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/lib/hooks/use-user';
import { getAuthToken } from '@/lib/auth-utils';
import { uploadWebGameFile } from '@/lib/utils/chunked-upload';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

type V2File = { path: string; content: string };

export default function AIGameEditorByIdPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(paramsPromise);
  const { user, refreshUser } = useUser();
  const { setVisible } = useWalletModal();

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
  const [hasUpserted, setHasUpserted] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const indexHtml = useMemo(() => files.find(f => f.path === 'index.html')?.content || '', [files]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`editor-prompt:${id}`);
      if (stored) setPrompt(stored);
    } catch {}
  }, [id]);

  // Ensure there is a v2_games DB record as soon as user lands on editor
  useEffect(() => {
    const upsertInitial = async () => {
      if (!user || hasUpserted) return;
      try {
        let token = getAuthToken();
        if (!token) {
          try { await refreshUser(); } catch {}
          token = getAuthToken();
          if (!token) {
            console.log('[V2 DB] No auth token; prompting wallet modal');
            try { setVisible(true); } catch {}
          }
        }
        const prefix = `${user.wallet}/v2/${id}/`;
        let res = await fetch('/api/v2/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            id,
            wallet: user.wallet,
            name: id,
            description: prompt || '',
            s3Prefix: prefix,
            indexKey: '',
            files: [],
            isPublic: false,
          })
        });
        // Don't block UX on failure; log only
        let text = await res.clone().text();
        console.log('[V2 DB] Upsert initial', { status: res.status, ok: res.ok, bodyPreview: text.slice(0, 300) });
        if (res.status === 401 || res.status === 403) {
          console.log('[V2 DB] Unauthorized; trying to refresh auth and retry');
          try { await refreshUser(); } catch {}
          token = getAuthToken();
          if (token) {
            res = await fetch('/api/v2/games', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                id,
                wallet: user.wallet,
                name: id,
                description: prompt || '',
                s3Prefix: prefix,
                indexKey: '',
                files: [],
                isPublic: false,
              })
            });
            text = await res.clone().text();
            console.log('[V2 DB] Retry upsert', { status: res.status, ok: res.ok, bodyPreview: text.slice(0, 300) });
          }
        }

        // Ensure a legacy projects row exists so /projects/[id] works
        try {
          const create = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: user.wallet,
              url: 'https://placeholder.invalid',
              name: id,
              description: prompt || '',
              isPublic: false
            })
          });
          const createdJson = await create.clone().json().catch(() => ({}));
          const createdId = createdJson?.project?.id;
          console.log('[Projects] Create placeholder', { status: create.status, ok: create.ok, createdId });
          if (create.ok && createdId && createdId !== id) {
            const rename = await fetch(`/api/projects/${createdId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ wallet: user.wallet, subdomain: id })
            });
            console.log('[Projects] Rename to id', { status: rename.status, ok: rename.ok });
          }
        } catch (e) {
          console.warn('Could not ensure legacy project row:', e);
        }
        setHasUpserted(true);
      } catch (e) {
        console.warn('Initial upsert failed', e);
      }
    };
    upsertInitial();
  }, [user, id, prompt, hasUpserted]);

  useEffect(() => {
    if (prompt && files.length <= 2) {
      setTimeout(() => callAI(prompt), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

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

    let html = indexHtml;
    for (const f of files) {
      if (f.path === 'index.html') continue;
      const url = makeUrl(f.path, f.content);
      html = html.replace(new RegExp(f.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), url);
    }
    const docUrl = makeUrl('index.html', html);
    iframe.src = docUrl;

    return () => {
      Array.from(blobs.values()).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files, indexHtml]);

  const callAI = async (instruction: string) => {
    setIsGenerating(true);
    try {
      const payload = { prompt: instruction, files };
      console.log('[AI] Request → /api/ai/generate-game', {
        promptPreview: instruction.slice(0, 120),
        filesCount: files.length,
        fileNames: files.map(f => f.path)
      });
      const res = await fetch('/api/ai/generate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const responseClone = res.clone();
      const text = await responseClone.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => (headers[k] = v));
      console.log('[AI] Response ← /api/ai/generate-game', {
        status: res.status,
        ok: res.ok,
        headers,
        bodyPreview: (typeof text === 'string' ? text : '').slice(0, 500)
      });
      if (!res.ok) throw new Error(data.error || data.detail || `Generation failed (status ${res.status})`);
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
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col" style={{ backgroundImage: 'url(/bg.svg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
      <div className="flex-1 w-full min-h-[60vh]">
        <iframe ref={iframeRef} className="w-full h-full border-0" title={`Game Preview - ${id}`} />
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <Textarea
          value={prompt}
          onChange={e => {
            setPrompt(e.target.value);
            try { sessionStorage.setItem(`editor-prompt:${id}`, e.target.value); } catch {}
          }}
          placeholder="Describe what to build/change"
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