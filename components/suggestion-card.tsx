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
  /** Show iframe instead of thumbnail (without fullscreen) */
  showIframe?: boolean;
  /** optional custom height class for non-fullscreen mode */
  heightClass?: string;
  /** optional custom button text */
  buttonText?: string;
  /** optional thumbnail URL */
  thumbnail?: string;
};

export default function SuggestionCard({ 
  embedUrl, 
  name, 
  description, 
  onOpen, 
  fullScreen, 
  showIframe,
  heightClass,
  buttonText = "Edit Game",
  thumbnail
}: SuggestionCardProps) {
  const defaultThumbnail = "/og/og1.png";
  const displayThumbnail = thumbnail || defaultThumbnail;
  return (
    <Card className={cn(
      "overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 border border-white/30 dark:border-gray-200/10 group bg-transparent backdrop-blur-sm",
      fullScreen && "fixed inset-0 m-0 rounded-none"
    )}>
      <div className={cn(
        "relative bg-muted overflow-hidden",
        fullScreen ? "w-full h-full" : heightClass ?? "h-48"
      )}>
        {fullScreen || showIframe ? (
          <iframe
            src={embedUrl}
            title={name}
            className="w-full h-full"
            frameBorder="0"
            loading="lazy"
          />
        ) : (
          <img
            src={displayThumbnail}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== defaultThumbnail) {
                target.src = defaultThumbnail;
              }
            }}
          />
        )}
        {/* Removed black overlay to fix transparency issue */}
      </div>
      
      {!showIframe && (
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <GameController className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-1">{name}</h4>
            </div>
          </div>
        </CardContent>
      )}
      
      {onOpen && !fullScreen && !showIframe && (
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={onOpen}
            className="w-full group-hover:bg-green-600 group-hover:text-white transition-colors"
            variant="outline"
          >
            {buttonText}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}