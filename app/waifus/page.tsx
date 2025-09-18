"use client";

import React, { useEffect, useState } from "react";
import GameCard from "@/components/game-card";
import GamesSort from "@/components/games-sort";
import { useRouter } from "next/navigation";
import { ALPHA_GUI } from '@/global/constant';
import { useUser } from "@/lib/hooks/use-user";
import Link from 'next/link';

interface WaifuItem {
  id: string;
  name: string;
  url: string;
  description: string;
  likes_count: number;
  wallet: string;
  thumbnail?: string;
  ca?: string;
  views_count?: number;
  glb_url?: string;
  rpm_avatar_id?: string;
}

export default function WaifusPage() {
  const [waifus, setWaifus] = useState<WaifuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { user } = useUser();
  const router = useRouter();

  const fetchWaifus = async (sortByParam: string, sortOrderParam: 'asc' | 'desc') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/waifus?sortBy=${sortByParam}&sortOrder=${sortOrderParam}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch waifus: ${response.statusText}`);
      }
      const data: WaifuItem[] = await response.json();
      setWaifus(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaifus(sortBy, sortOrder);
  }, [sortBy, sortOrder]);

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  return (
    <div className="min-h-screen bg-background" style={{ backgroundImage: 'url(/bg.svg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-white">
            Discover Waifus
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore 3D AI waifus created by the community. Chat and launch tokens.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <Link href="/waifus/create" className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-primary text-white">
            Create Waifu
          </Link>
        </div>

        <div className="flex justify-center mb-6">
          <GamesSort
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-lg overflow-hidden border border-border/50 shadow-sm">
                <div className="h-48 bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-muted animate-pulse rounded-md w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded-md w-full" />
                  <div className="h-8 bg-muted animate-pulse rounded-md w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {waifus.map((w) => (
              <div key={w.id} onClick={() => router.push(`/waifus/${w.id}`)} className="cursor-pointer">
                <div className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-border/50 group rounded-lg">
                  <div className="relative bg-black overflow-hidden h-48">
                    {w.glb_url || w.rpm_avatar_id ? (
                      <model-viewer
                        src={w.glb_url || `https://models.readyplayer.me/${w.rpm_avatar_id}.glb`}
                        alt={w.name}
                        ar
                        auto-rotate
                        camera-controls
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <img src={w.thumbnail || '/og/og1.png'} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-lg mb-1 truncate">{w.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{w.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


