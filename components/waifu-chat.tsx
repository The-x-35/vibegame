"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WaifuViewer, { WaifuViewerHandle } from "@/components/waifu-viewer";

interface Props {
	waifuId: string;
	voiceId?: string; // default ElevenLabs voice if not set via site config
	modelUrl: string;
}

export default function WaifuChat({ waifuId, voiceId = "21m00Tcm4TlvDq8ikWAM", modelUrl }: Props) {
	const viewerRef = useRef<WaifuViewerHandle>(null);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSend() {
		if (!input.trim()) return;
		setLoading(true);
		try {
			// 1) Ask Grok for a reply with actions
			const chatRes = await fetch(`/api/waifus/${waifuId}/chat/grok`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: input.trim() })
			});
			const { reply, actions } = await chatRes.json();
			if (!reply) return;

			// Execute character actions in sequence
			if (actions && actions.length > 0) {
				for (const action of actions) {
					const duration = action.duration || 5;
					
					switch (action.type) {
						case 'pose':
							// Handle both built-in poses and FBX files
							if (action.name.startsWith('/')) {
								// FBX file path
								viewerRef.current?.playPose(action.name, duration);
							} else {
								// Built-in pose name
								viewerRef.current?.playPose(action.name, duration);
							}
							break;
							
						case 'gesture':
							// Use gesture names directly
							viewerRef.current?.playGesture(action.name, duration);
							break;
							
						case 'animation':
							// Map animation names to URLs
							const animationUrls: Record<string, string> = {
								'Walking': '/wifegame/animations/walking.fbx'
							};
							const url = animationUrls[action.name];
							if (url) {
								viewerRef.current?.playAnimation(url, duration);
							}
							break;
							
						case 'mood':
							// Set character mood
							viewerRef.current?.setMood(action.name);
							break;
					}
					
					// Add small delay between actions for better visual effect
					if (action !== actions[actions.length - 1]) {
						await new Promise(resolve => setTimeout(resolve, 100));
					}
				}
			}

			// 2) Convert to speech via ElevenLabs with viseme data
			const ttsRes = await fetch(`/api/waifus/${waifuId}/chat/eleven`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: reply, voiceId, includeVisemes: true })
			});
			
			let audioBuffer: ArrayBuffer;
			let visemes: any = null;
			let words: string[] = [reply];
			let wtimes: number[] = [0];
			let wdurations: number[] = [Math.max(800, Math.min(8000, reply.length * 40))];

			// Check if we got viseme data
			const contentType = ttsRes.headers.get('content-type');
			if (contentType?.includes('application/json')) {
				// Enhanced response with viseme data
				const data = await ttsRes.json();
				audioBuffer = new Uint8Array(data.audio).buffer;
				visemes = data.visemes;
			} else {
				// Fallback to audio-only response
				audioBuffer = await ttsRes.arrayBuffer();
			}

			// 3) Play via TalkingHead streaming with proper lip-sync
			const lipsyncType = visemes ? "visemes" : "words";
			await viewerRef.current?.startStream({ sampleRate: 22050, lipsyncType });
			
			const streamData: any = { audio: audioBuffer };
			
			if (visemes) {
				// Use ElevenLabs viseme data for accurate lip-sync
				streamData.visemes = visemes.visemes || [];
				streamData.vtimes = visemes.times || [];
				streamData.vdurations = visemes.durations || [];
			} else {
				// Fallback to word-based timing
				streamData.words = words;
				streamData.wtimes = wtimes;
				streamData.wdurations = wdurations;
			}
			
			viewerRef.current?.pushStream(streamData);
			viewerRef.current?.endStream();
		} finally {
			setLoading(false);
			setInput("");
		}
	}

	return (
		<div className="space-y-3">
			<div className="rounded-lg overflow-hidden shadow-sm border border-border/50 aspect-video bg-black">
				<WaifuViewer ref={viewerRef} className="w-full h-full" modelUrl={modelUrl} />
			</div>
			<div className="flex gap-2">
				<Input placeholder="Say something..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }} />
				<Button onClick={handleSend} disabled={loading}>{loading ? '...' : 'Send'}</Button>
			</div>
		</div>
	);
}
