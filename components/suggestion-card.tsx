"use client";

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TowerControl as GameController } from 'lucide-react';
import { cn } from '@/lib/utils';

type SuggestionCardProps = {
  embedUrl: string;
  name: string;
  description: string;
  onOpen?: () => void;
  fullScreen?: boolean;
};

export default function SuggestionCard({ embedUrl, name, description, onOpen, fullScreen }: SuggestionCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-border/50 group",
      fullScreen && "fixed inset-0 m-0 rounded-none"
    )}>
      <div className={cn(
        "relative bg-muted overflow-hidden",
        fullScreen ? "w-full h-full" : "h-48"
      )}>
        <iframe
          src={embedUrl}
          title={name}
          className="w-full h-full"
          frameBorder="0"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-300" />
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <GameController className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-1">{name}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>
        </div>
      </CardContent>
      
      {onOpen && !fullScreen && (
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={onOpen}
            className="w-full group-hover:bg-green-600 group-hover:text-white transition-colors"
            variant="outline"
          >
            Edit Game
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}