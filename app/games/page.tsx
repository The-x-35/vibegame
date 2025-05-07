"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/navbar";
import SuggestionCard from "@/components/suggestion-card";

// Game template interface
interface GameTemplate {
  id: string;
  name: string;
  url: string;
  description: string;
}

export default function GamesPage() {
  const [templates, setTemplates] = useState<GameTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, we would fetch from database
    // For now, we'll use the static data provided
    setTemplates([
      {
        id: "1",
        name: "Ball Game",
        url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/BallGame.sb3",
        description: "A very simple ball game."
      },
      {
        id: "2",
        name: "3D Ping Pong",
        url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/3DPingPong.sb3",
        description: "Experience a dynamic 3D ping pong challenge with realistic physics."
      },
      {
        id: "3",
        name: "Brick Breaker",
        url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/BrickBreaker.sb3",
        description: "Break through walls of bricks with precision and exciting power-ups."
      },
      {
        id: "4",
        name: "Endless Runner",
        url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/EndlessRunnerGames.sb3",
        description: "Race through an endless course full of obstacles and non-stop action."
      },
      {
        id: "5",
        name: "Flappy Bird",
        url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/FlappyBird.sb3",
        description: "Guide your bird through challenging gaps in this addictive arcade classic."
      },
      {
        id: "6",
        name: "Hill Climb Racing",
        url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/HillClimbRacing.sb3",
        description: "Conquer rugged terrains and steep hills in this thrilling driving game."
      },
      {
        id: "7",
        name: "Maze Game",
        url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/MazeGame.sb3",
        description: "Navigate intricate mazes and test your puzzle-solving skills."
      },
      {
        id: "8",
        name: "Maze Runner Mario",
        url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/MazeRunnerMario.sb3",
        description: "Embark on a maze adventure with a fun twist reminiscent of classic Mario."
      },
      {
        id: "9",
        name: "Memory Card Game",
        url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/MemoryCardGame.sb3",
        description: "Challenge your memory with an engaging and fast-paced card matching game."
      },
      {
        id: "10",
        name: "Space Shooter",
        url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/SpaceShooter.sb3",
        description: "Pilot your spaceship and blast through waves of enemy forces in space."
      },
      {
        id: "11",
        name: "Whack-A-Mole",
        url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/whackAMole.sb3",
        description: "Test your reflexes in a fast-paced game where quick hits are key."
      }
    ]);
    setIsLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            Game Templates
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse and open any of the available sample projects to kickstart your game development journey.
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
            {templates.map((t) => (
              <SuggestionCard
                key={t.id}
                embedUrl={`https://alpha-gui.vercel.app/embed.html?autoplay&project_url=${encodeURIComponent(
                  t.url
                )}`}
                name={t.name}
                description={t.description}
                onOpen={() => window.open(
                  `https://alpha-gui.vercel.app/?project_url=${encodeURIComponent(t.url)}`,
                  "_blank"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}