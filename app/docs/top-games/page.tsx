"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Eye, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";


interface Game {
  id: string;
  name: string;
  url: string;
  description: string;
  likes_count: number;
  views_count?: number;
  thumbnail?: string;
  ca?: string;
}

export default function TopGamesPage() {
  const [topGames, setTopGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch public games from the database API - same as games page
    (async () => {
      try {
        const response = await fetch('/api/games');
        if (!response.ok) {
          throw new Error(`Failed to fetch games: ${response.statusText}`);
        }
        const data: Game[] = await response.json();
        
        // Filter for the specific games you requested
        const requestedGameIds = ["vibey", "vibegame-runner", "mimi"];
        const filteredGames = data.filter(game => 
          requestedGameIds.includes(game.id)
        );
        
        // Sort them in your specified order
        const orderedGames = requestedGameIds
          .map(id => filteredGames.find(game => game.id === id))
          .filter(game => game !== undefined) as Game[];
        
        setTopGames(orderedGames);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 font-matrix-sans-regular">
          Top 3 Games from VibeGame
        </h1>
        <p className="text-lg text-muted-foreground font-matrix-sans-regular">
          Discover the most popular and engaging games created by our amazing community. These games showcase the potential of the VibeGame platform.
        </p>
      </div>

      {/* Featured Games */}
      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="border border-border/50 rounded-lg p-6 animate-pulse">
              <div className="flex gap-6">
                <div className="w-32 h-24 bg-muted rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : topGames.length > 0 ? (
        <div className="space-y-6">
          {topGames.map((game, index) => (
            <div key={game.id} className="border border-border/50 rounded-lg p-6 hover:border-primary/20 transition-colors">
              <div className="flex items-start gap-6">
                {/* Rank */}
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                    'bg-gradient-to-r from-orange-400 to-orange-600'
                  }`}>
                    #{index + 1}
                  </div>
                </div>

                {/* Game Thumbnail */}
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-24 bg-muted overflow-hidden rounded-lg">
                    <img
                      src={game.thumbnail || "/og/og1.png"}
                      alt={game.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== "/og/og1.png") {
                          target.src = "/og/og1.png";
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Game Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold mb-2 font-matrix-sans-regular">
                    {game.name}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {game.description || "An amazing game built with VibeGame"}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Heart className="w-4 h-4" />
                      {game.likes_count} likes
                    </div>
                                         <div className="flex items-center gap-1 text-sm text-muted-foreground">
                       <Eye className="w-4 h-4" />
                       {game.views_count || 0} views
                     </div>
                    {game.ca && (
                      <div className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">
                        Tokenized
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                      <a 
                        href={`https://${game.id}.vibegame.fun`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Play Game
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 font-matrix-sans-regular">No Games Yet</h3>
          <p className="text-muted-foreground mb-6">
            Be the first to create an amazing game on VibeGame!
          </p>
          <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            <Link href="/">
              Start Building
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Why These Games Excel */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-6 font-matrix-sans-regular">What Makes These Games Special?</h2>
        <div className="grid gap-4">
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <h3 className="font-semibold mb-2 font-matrix-sans-regular">🎮 Engaging Gameplay</h3>
            <p className="text-sm text-muted-foreground">
              These games feature compelling mechanics that keep players coming back for more.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <h3 className="font-semibold mb-2 font-matrix-sans-regular">🎨 Polished Design</h3>
            <p className="text-sm text-muted-foreground">
              High-quality visuals and smooth animations create an immersive gaming experience.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <h3 className="font-semibold mb-2 font-matrix-sans-regular">💰 Smart Monetization</h3>
            <p className="text-sm text-muted-foreground">
              Successful integration of token and flywheel tech.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <h3 className="font-semibold mb-2 font-matrix-sans-regular">🌟 Community Appeal</h3>
            <p className="text-sm text-muted-foreground">
              Strong community engagement through social features and regular updates.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3 font-matrix-sans-regular">🚀 Ready to Create Your Hit Game?</h2>
        <p className="text-muted-foreground mb-4">
          Learn from these successful examples and start building your own viral game today.
        </p>
        <div className="flex gap-3">
          <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            <Link href="/docs/how-to-build-a-game">
              Build Your Game
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/games">
              Browse All Games
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 