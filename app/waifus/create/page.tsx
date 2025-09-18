"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/lib/hooks/use-user";
import { uploadFileInChunks } from "@/lib/utils/chunked-upload";
import { getAuthToken } from "@/lib/auth-utils";
import { useRouter } from "next/navigation";

type RpmBaseEvent = {
  source?: string;
  eventName?: string;
  data?: unknown;
};

type AvatarExportedData = {
  avatarId?: string;
  id?: string;
  url?: string;
};

export default function CreateWaifuPage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [creatorUrl, setCreatorUrl] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const [avatarId, setAvatarId] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [thumbnail, setThumbnail] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const base = useMemo(() => (process.env.NEXT_PUBLIC_RPM_BASE || "https://readyplayer.me").replace(/\/+$/, ""), []);

  useEffect(() => {
    setCreatorUrl(`${base}/avatar?frameApi`);
  }, [base]);

  const postToIframe = useCallback((message: object) => {
    const frame = iframeRef.current;
    if (!frame || !frame.contentWindow) return;
    let targetOrigin = "*";
    try {
      if (creatorUrl) targetOrigin = new URL(creatorUrl).origin;
    } catch {}
    frame.contentWindow.postMessage(JSON.stringify(message), targetOrigin);
  }, [creatorUrl]);

  function isAllowedOrigin(origin: string): boolean {
    try {
      const expected = creatorUrl ? new URL(creatorUrl).origin : "";
      if (expected && origin === expected) return true;
      const url = new URL(origin);
      const host = url.host;
      return host === "readyplayer.me" || host.endsWith(".readyplayer.me");
    } catch {
      return false;
    }
  }

  function parseEventData(data: unknown): RpmBaseEvent | null {
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return parsed && typeof parsed === "object" ? (parsed as RpmBaseEvent) : null;
      } catch {
        return null;
      }
    }
    if (data && typeof data === "object") return data as RpmBaseEvent;
    return null;
  }

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isAllowedOrigin(event.origin)) return;
      const payload = parseEventData(event.data);
      if (!payload || typeof payload !== "object") return;

      if (payload.source === "readyplayerme") {
        if (payload.eventName === "v1.frame.ready") {
          setIsReady(true);
          postToIframe({ target: "readyplayerme", type: "subscribe", eventName: "v1.**" });
        }
        if (payload.eventName === "v1.avatar.exported" && payload.data) {
          const data = payload.data as AvatarExportedData | undefined;
          const id = data?.avatarId || data?.id || "";
          const url = data?.url || "";
          setAvatarId(id);
          setAvatarUrl(url);
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [postToIframe]);

  const modelUrl = useMemo(() => avatarId ? `https://models.readyplayer.me/${avatarId}.glb` : "", [avatarId]);

  const handleSave = useCallback(async () => {
    if (!user?.wallet) return;
    setIsSaving(true);
    try {
      // Optionally upload thumbnail if available as File input (skipped here)
      // Save project as type waifu
      const res = await fetch('/api/waifus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          wallet: user.wallet,
          url: null,
          name,
          description,
          thumbnail: thumbnail || null,
          glbUrl: modelUrl || null,
          rpmAvatarId: avatarId || null,
          systemPrompt: systemPrompt || null,
        })
      });
      if (!res.ok) throw new Error('Failed to save waifu');
      const data = await res.json();
      router.push(`/waifus/${data.waifu.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }, [user?.wallet, name, description, thumbnail, modelUrl, avatarId, systemPrompt, router]);

  const copy = useCallback((text: string) => {
    if (!text) return;
    void navigator.clipboard.writeText(text);
  }, []);

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Create Waifu</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <Input placeholder="Waifu Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Textarea placeholder="System prompt (AI behavior)" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
          <Input readOnly value={modelUrl} placeholder="Model URL (.glb) will appear here" />
          <div className="flex gap-2">
            <Button onClick={() => copy(modelUrl)}>Copy .glb</Button>
            <Button disabled={!name || !modelUrl || isSaving} onClick={handleSave}>{isSaving ? 'Saving…' : 'Save Waifu'}</Button>
          </div>
        </div>

        <div className="w-full h-[680px] border border-gray-200 rounded-xl overflow-hidden">
          {creatorUrl && (
            <iframe
              ref={iframeRef}
              src={creatorUrl}
              className="w-full h-full"
              allow="camera; clipboard-write;"
              sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
            />
          )}
        </div>
      </div>
    </div>
  );
}


