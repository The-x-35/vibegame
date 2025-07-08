"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TowerControl as GameController, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALPHA_GUI } from '@/global/constant';

interface PriceData {
  price: number;
  marketCap: number;
}

type GameCardProps = {
  embedUrl: string;
  name: string;
  description: string;
  onOpen?: () => void;
  buttonText?: string;
  thumbnail?: string;
  ca?: string;
  playsCount?: number;
};

export default function GameCard({ 
  embedUrl, 
  name, 
  description, 
  onOpen, 
  buttonText = "Play Game",
  thumbnail,
  ca,
  playsCount = 0
}: GameCardProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [copied, setCopied] = useState(false);
  const defaultThumbnail = "/og/og1.png";
  const displayThumbnail = thumbnail || defaultThumbnail;
  const contractAddress = ca || ALPHA_GUI.SEND_TOKEN_CA;

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const response = await fetch(`/api/jupiter/price?tokenId=${contractAddress}`);
        if (response.ok) {
          const data = await response.json();
          setPriceData({
            price: data.price,
            marketCap: data.marketCap
          });
        }
      } catch (error) {
        console.error('Error fetching price data:', error);
      }
    };

    if (contractAddress) {
      fetchPriceData();
    }
  }, [contractAddress]);

  const formatMarketCap = (marketCap: number): string => {
    if (isNaN(marketCap)) return 'N/A';
    
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(1)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(1)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(1)}M`;
    } else if (marketCap >= 1e3) {
      return `$${(marketCap / 1e3).toFixed(1)}K`;
    } else {
      return `$${marketCap.toFixed(0)}`;
    }
  };

  const formatContractAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatPlaysCount = (plays: number): string => {
    if (plays >= 1e6) {
      return `${(plays / 1e6).toFixed(1)}M`;
    } else if (plays >= 1e3) {
      return `${(plays / 1e3).toFixed(1)}K`;
    } else {
      return plays.toString();
    }
  };

  const handleCopyCA = () => {
    if (contractAddress) {
      navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-border/50 group">
      <div className="relative bg-muted overflow-hidden h-48">
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
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-300 pointer-events-none" />
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <GameController className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-lg mb-1 truncate">{name}</h4>
            <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis" style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>{description}</p>
          </div>
        </div>

        {/* Market Info */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Plays</span>
            <span className="text-sm font-semibold">
              {formatPlaysCount(playsCount)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Market Cap</span>
            <span className="text-sm font-semibold">
              {priceData?.marketCap ? formatMarketCap(priceData.marketCap) : '...'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Contract</span>
            <div className="flex items-center gap-1">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                {formatContractAddress(contractAddress)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyCA}
                className="h-6 w-6"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      {onOpen && (
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