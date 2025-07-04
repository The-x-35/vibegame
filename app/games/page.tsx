"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/navbar";
import SuggestionCard from "@/components/suggestion-card";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/use-user";
import { ALPHA_GUI } from '@/global/constant';
import { getGameUrl } from '@/lib/utils';

// Game interface
interface Game {
  id: string;
  name: string;
  url: string;
  description: string;
  likes_count: number;
  wallet: string;
  thumbnail?: string;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Fetch public games from the database API
    (async () => {
      try {
        const response = await fetch('/api/games');
        if (!response.ok) {
          throw new Error(`Failed to fetch games: ${response.statusText}`);
        }
        const data: Game[] = await response.json();
        setGames(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handlePlayGame = (game: Game) => {
    router.push(getGameUrl(game.id));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            Public Games
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore games created by the community. Find inspiration and play amazing creations.
          </p>
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
            {games.map((game) => (
              <SuggestionCard
                key={game.id}
                embedUrl={`${ALPHA_GUI.EMBED_URL}?project_url=${encodeURIComponent(
                  game.url
                )}`}
                name={game.name}
                description={game.description}
                onOpen={() => handlePlayGame(game)}
                buttonText="Play Game"
                thumbnail={game.thumbnail}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}