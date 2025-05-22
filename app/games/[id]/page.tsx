"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import { ALPHA_GUI } from '@/global/constant';
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface Game {
  id: string;
  name: string;
  url: string;
  description: string;
  ca?: string;
}

export default function GameDetailPage() {
  const params = useParams();
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`/api/games/${params.id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch game: ${response.statusText}`);
        }
        const data = await response.json();
        setGame(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGame();
  }, [params.id]);

  const handleCopyCA = () => {
    const ca = game?.ca || ALPHA_GUI.SEND_TOKEN_CA;
    navigator.clipboard.writeText(ca);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <div className="h-[calc(100vh-200px)] bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500">Game not found</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">{game.name}</h1>
          <p className="text-muted-foreground mb-4">{game.description}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Contract Address:</p>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {game.ca || ALPHA_GUI.SEND_TOKEN_CA}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyCA}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
            {copied && (
              <span className="text-sm text-green-500">Copied!</span>
            )}
          </div>
        </div>
        <div className="w-full h-[calc(100vh-250px)] rounded-lg overflow-hidden border border-border/50">
          <iframe
            src={`${ALPHA_GUI.EMBED_URL}?project_url=${encodeURIComponent(game.url)}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
} 