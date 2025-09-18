"use client";

import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";

export type WaifuViewerHandle = {
	loadAvatar: (url: string) => Promise<void>;
	startStream: (opts?: { sampleRate?: number; gain?: number; lipsyncLang?: string; lipsyncType?: "visemes" | "words" | "blendshapes"; waitForAudioChunks?: boolean }) => Promise<void>;
	pushStream: (data: { audio?: ArrayBuffer | Int16Array | Uint8Array | Float32Array; visemes?: string[]; vtimes?: number[]; vdurations?: number[]; words?: string[]; wtimes?: number[]; wdurations?: number[]; anims?: any[] }) => void;
	endStream: () => void;
	interruptStream: () => void;
	playAnimation: (url: string, duration?: number) => void;
	playPose: (url: string, duration?: number) => void;
	playGesture: (name: string, duration?: number, mirror?: boolean) => void;
	setMood: (mood: string) => void;
};

type Props = {
	className?: string;
	modelUrl?: string;
	pixelRatio?: number;
	camera?: {
		zoom?: boolean;
		pan?: boolean;
		rotate?: boolean;
		view?: "full" | "upper" | "head";
	};
	light?: {
		ambient?: { color?: number; intensity?: number };
		direct?: { color?: number; intensity?: number; phi?: number; theta?: number };
		spot?: { color?: number; intensity?: number; phi?: number; theta?: number; dispersion?: number };
	};
	mood?: string;
	lipsyncLang?: string;
};

const WaifuViewer = forwardRef<WaifuViewerHandle, Props>(function WaifuViewer(
	{ className, modelUrl, pixelRatio = 1, camera, light, mood = "neutral", lipsyncLang = "en" },
	ref
) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const headRef = useRef<any>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let mounted = true;
		async function setup() {
			if (!containerRef.current) return;
			const mod = await import(/* webpackIgnore: true */ "/wifegame/modules/talkinghead.mjs");
			const { TalkingHead } = mod as any;
			if (!mounted) return;
			headRef.current = new TalkingHead(containerRef.current, {
				cameraZoomEnable: camera?.zoom ?? true,
				cameraPanEnable: camera?.pan ?? true,
				cameraRotateEnable: camera?.rotate ?? true,
				cameraView: camera?.view ?? "full",
				modelPixelRatio: pixelRatio,
				avatarMood: mood,
				lipsyncModules: [lipsyncLang],
				lightAmbientColor: light?.ambient?.color ?? 0xffffff,
				lightAmbientIntensity: light?.ambient?.intensity ?? 2,
				lightDirectColor: light?.direct?.color ?? 0x8888aa,
				lightDirectIntensity: light?.direct?.intensity ?? 30,
				lightDirectPhi: light?.direct?.phi ?? 1,
				lightDirectTheta: light?.direct?.theta ?? 2,
				lightSpotIntensity: light?.spot?.intensity ?? 0,
				lightSpotColor: light?.spot?.color ?? 0x3388ff,
				lightSpotPhi: light?.spot?.phi ?? 0.1,
				lightSpotTheta: light?.spot?.theta ?? 4,
				lightSpotDispersion: light?.spot?.dispersion ?? 1,
			});
			setReady(true);
		}
		setup();
		return () => {
			mounted = false;
			try {
				headRef.current?.streamStop?.();
				headRef.current?.stop?.();
			} catch {}
			headRef.current = null;
		};
	}, []);

	useEffect(() => {
		if (ready && modelUrl) {
			load(modelUrl);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ready, modelUrl]);

	async function load(url: string) {
		if (!headRef.current) return;
		await headRef.current.showAvatar({ url, lipsyncLang });
		// Ensure playback starts only after a user gesture to satisfy AudioContext policies
		const resume = () => {
			try { headRef.current?.start?.(); } catch {}
			document.removeEventListener('pointerdown', resume);
			document.removeEventListener('keydown', resume);
		};
		document.addEventListener('pointerdown', resume, { once: true });
		document.addEventListener('keydown', resume, { once: true });
		headRef.current.setMood?.(mood);
	}

	useImperativeHandle(ref, () => ({
		loadAvatar: async (url: string) => {
			await load(url);
		},
		startStream: async (opts = {}) => {
			if (!headRef.current) return;
			await headRef.current.streamStart(
				{
					sampleRate: opts.sampleRate ?? 22050,
					gain: opts.gain ?? 1,
					lipsyncLang: opts.lipsyncLang ?? lipsyncLang,
					lipsyncType: opts.lipsyncType ?? "visemes",
					waitForAudioChunks: opts.waitForAudioChunks ?? true,
				},
				undefined,
				undefined,
				undefined,
				{ enabled: false }
			);
		},
		pushStream: (data) => {
			if (!headRef.current) return;
			headRef.current.streamAudio(data);
		},
		endStream: () => {
			if (!headRef.current) return;
			headRef.current.streamNotifyEnd();
		},
		interruptStream: () => {
			if (!headRef.current) return;
			headRef.current.streamInterrupt();
		},
		playAnimation: (url: string, duration = 20) => {
			if (!headRef.current) return;
			headRef.current.playAnimation?.(url, undefined, duration);
		},
		playPose: (url: string, duration = 60) => {
			if (!headRef.current) return;
			headRef.current.playPose?.(url, undefined, duration);
		},
		playGesture: (name: string, duration = 5, mirror = false) => {
			if (!headRef.current) return;
			headRef.current.playGesture?.(name, duration, mirror);
		},
		setMood: (mood: string) => {
			if (!headRef.current) return;
			headRef.current.setMood?.(mood);
		},
	}));

	return (
		<div className={className} style={{ position: "relative", width: "100%", height: "100%", background: "black", borderRadius: 8 }}>
			<div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
		</div>
	);
});

export default WaifuViewer;
