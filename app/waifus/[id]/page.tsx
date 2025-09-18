"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CommentsSection } from "@/components/comments-section";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Toaster } from "@/components/ui/toaster";
import WaifuChat from "@/components/waifu-chat";


type Waifu = {
	id: string;
	name: string;
	description: string;
	ca?: string;
	glbUrl?: string;
	rpmAvatarId?: string;
	systemPrompt?: string;
};

export default function WaifuDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;
	const [waifu, setWaifu] = useState<Waifu | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { connected } = useWallet();

	useEffect(() => {
		const fetchWaifu = async () => {
			try {
				const res = await fetch(`/api/waifus/${id}`);
				if (!res.ok) throw new Error('Not found');
				const data = await res.json();
				setWaifu({
					id: data.id,
					name: data.name,
					description: data.description,
					ca: data.ca,
					glbUrl: data.glbUrl,
					rpmAvatarId: data.rpmAvatarId,
					systemPrompt: data.systemPrompt,
				});
			} catch (e) {
				console.error(e);
			} finally {
				setIsLoading(false);
			}
		};
		fetchWaifu();
	}, [id]);

	const modelUrl = useMemo(() => {
		if (waifu?.glbUrl) return waifu.glbUrl;
		if (waifu?.rpmAvatarId) return `https://models.readyplayer.me/${waifu.rpmAvatarId}.glb`;
		return '';
	}, [waifu?.glbUrl, waifu?.rpmAvatarId]);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background">
				<div className="container mx-auto px-4 py-10">
					<div className="h-[calc(100vh-200px)] bg-muted animate-pulse rounded-lg" />
				</div>
			</div>
		);
	}

	if (!waifu) {
		return (
			<div className="min-h-screen bg-background">
				<div className="container mx-auto px-4 py-10">
					<div className="text-center">
						<h1 className="text-2xl font-bold text-red-500">Waifu not found</h1>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-10">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* 3D viewer + chat */}
					<div className="lg:col-span-2">
						{modelUrl ? (
							<WaifuChat waifuId={waifu.id} modelUrl={modelUrl} />
						) : (
							<div className="rounded-lg overflow-hidden shadow-sm border border-border/50 aspect-video bg-black w-full h-full flex items-center justify-center text-muted-foreground">No model</div>
						)}

						<div className="mt-6">
							<p className="text-muted-foreground">{waifu.description}</p>
						</div>
					</div>

					{/* Right panel */}
					<div className="lg:col-span-1 space-y-4">
						<h1 className="text-3xl font-bold">{waifu.name}</h1>
						<p className="text-sm text-muted-foreground">
							<span className="font-medium">Contract Address:</span> {waifu.ca || 'Not launched yet'}
						</p>

						<div className="flex gap-2">
							<Button onClick={() => router.push(`/projects/${waifu.id}`)}>Manage</Button>
							<Button variant="outline" onClick={() => router.push(`/games/${waifu.id}`)}>Open Classic</Button>
						</div>

						<div className="pt-4 border-t">
							<h2 className="font-semibold mb-2">Wallet</h2>
							{!connected && <WalletMultiButton className="!h-8 !px-3 !py-1 text-sm" />}
						</div>

						<div className="pt-4 border-t">
							<h2 className="font-semibold mb-2">Comments</h2>
							<CommentsSection projectId={waifu.id} onCommentAdded={() => {}} />
						</div>
					</div>
				</div>
			</div>
			<Toaster />
		</div>
	);
}


