"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WaifuViewer, { WaifuViewerHandle } from "@/components/waifu-viewer";

interface Props {
	waifuId: string;
	voiceId?: string;
	modelUrl: string;
}

// Demo prompts to showcase AI character control
const DEMO_PROMPTS = [
	{
		title: "Friendly Greeting",
		prompt: "Hello! Nice to meet you!",
		description: "Should use friendly gestures like thumbs up or OK sign"
	},
	{
		title: "Thinking",
		prompt: "Hmm, let me think about that for a moment...",
		description: "Should use shrug gesture and thinking pose"
	},
	{
		title: "Excited Response",
		prompt: "Oh my gosh, that's amazing! I'm so excited!",
		description: "Should use handup gesture and happy mood"
	},
	{
		title: "Confident Statement",
		prompt: "I'm absolutely certain about this decision.",
		description: "Should use hip pose (hands on hips) and confident mood"
	},
	{
		title: "Dancing",
		prompt: "Let me show you my dance moves!",
		description: "Should use dance pose or walking animation"
	},
	{
		title: "Dramatic Performance",
		prompt: "And then... *dramatic pause* the truth was revealed!",
		description: "Should use multiple poses in sequence (turn, back)"
	},
	{
		title: "Pointing",
		prompt: "Look over there! Can you see it?",
		description: "Should use index gesture (pointing)"
	},
	{
		title: "Prayer/Bow",
		prompt: "Thank you so much, I'm truly grateful.",
		description: "Should use namaste gesture"
	},
	{
		title: "Walking Around",
		prompt: "Let me walk around while I explain this concept.",
		description: "Should use Walking animation"
	},
	{
		title: "Disappointment",
		prompt: "Oh no, that's not what I wanted to hear.",
		description: "Should use thumbdown gesture and sad mood"
	}
];

export default function WaifuDemo({ waifuId, voiceId = "21m00Tcm4TlvDq8ikWAM", modelUrl }: Props) {
	const viewerRef = useRef<WaifuViewerHandle>(null);
	const [loading, setLoading] = useState(false);
	const [lastResponse, setLastResponse] = useState<string>("");

	async function handleDemoPrompt(prompt: string) {
		setLoading(true);
		try {
			// Ask Grok for a reply with actions
			const chatRes = await fetch(`/api/waifus/${waifuId}/chat/grok`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: prompt })
			});
			const { reply, actions } = await chatRes.json();
			if (!reply) return;

			setLastResponse(reply);

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

			// Convert to speech via ElevenLabs with viseme data
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

			// Play via TalkingHead streaming with proper lip-sync
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
		}
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>AI Character Control Demo</CardTitle>
					<CardDescription>
						This demo showcases how the AI can control the 3D character with poses, gestures, animations, and moods. 
						Try the demo prompts below to see the AI in action!
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="rounded-lg overflow-hidden shadow-sm border border-border/50 aspect-video bg-black">
						<WaifuViewer ref={viewerRef} className="w-full h-full" modelUrl={modelUrl} />
					</div>
					
					{lastResponse && (
						<div className="mt-4 p-3 bg-muted rounded-lg">
							<p className="text-sm text-muted-foreground">AI Response:</p>
							<p className="text-sm">{lastResponse}</p>
						</div>
					)}
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{DEMO_PROMPTS.map((demo, index) => (
					<Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
						<CardContent className="p-4">
							<h3 className="font-semibold text-sm mb-2">{demo.title}</h3>
							<p className="text-xs text-muted-foreground mb-3">{demo.description}</p>
							<Button 
								size="sm" 
								onClick={() => handleDemoPrompt(demo.prompt)}
								disabled={loading}
								className="w-full"
							>
								{loading ? '...' : 'Try Demo'}
							</Button>
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Available Character Actions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
						<div>
							<h4 className="font-semibold mb-2">Poses</h4>
							<ul className="space-y-1 text-muted-foreground">
								<li>• straight, side, hip</li>
								<li>• turn, back, wide</li>
								<li>• oneknee, kneel</li>
								<li>• bend, sitting</li>
								<li>• dance (FBX)</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold mb-2">Gestures</h4>
							<ul className="space-y-1 text-muted-foreground">
								<li>• handup, ok, index</li>
								<li>• thumbup, thumbdown</li>
								<li>• side, shrug</li>
								<li>• namaste</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold mb-2">Animations</h4>
							<ul className="space-y-1 text-muted-foreground">
								<li>• Walking (FBX)</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold mb-2">Moods</h4>
							<ul className="space-y-1 text-muted-foreground">
								<li>• neutral, happy, sad</li>
								<li>• excited, angry</li>
								<li>• surprised, confused</li>
								<li>• calm</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
