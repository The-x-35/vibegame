"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import { ALPHA_GUI } from '@/global/constant';
import { Button } from "@/components/ui/button";
import { Copy, TrendingUp, TrendingDown, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Connection, PublicKey } from '@solana/web3.js';
import { API_ENDPOINTS } from '@/global/constant';
import { jwtDecode } from 'jwt-decode';
import { Toaster } from "@/components/ui/toaster";
import { CommentsSection } from '@/components/comments-section';
import { useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { JUP_ULTRA_API } from '@/global/constant';
import { getGameUrl } from '@/lib/utils';

interface Game {
  id: string;
  name: string;
  url: string;
  description: string;
  ca?: string;
  likesCount?: number;
}

interface PriceData {
  price: number;
  lastUpdated: string;
  marketCap?: number;
}

interface AppTokenPayload {
  wallet: string;
}

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const { toast } = useToast();
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [price, setPrice] = useState<PriceData | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [showBuyInput, setShowBuyInput] = useState<boolean>(false);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [showSellInput, setShowSellInput] = useState<boolean>(false);
  const [sellAmount, setSellAmount] = useState<string>('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  const { signTransaction, connected, publicKey } = useWallet();

  const fetchTokenBalance = useCallback(async () => {
    try {
      if (!connected || !publicKey) return;

      const connection = new Connection(API_ENDPOINTS.SOLANA_RPC_ENDPOINT, 'confirmed');
      const tokenId = game?.ca || ALPHA_GUI.SEND_TOKEN_CA;
      const tokenPublicKey = new PublicKey(tokenId);

      try {
        const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, { mint: tokenPublicKey });
        if (tokenAccounts.value.length === 0) {
          setTokenBalance(0);
          return;
        }

        const balance = await connection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
        setTokenBalance(Number(balance.value.amount) / Math.pow(10, balance.value.decimals));
      } catch (rpcError) {
        console.error('RPC Error details:', {
          error: rpcError,
          endpoint: API_ENDPOINTS.SOLANA_RPC_ENDPOINT,
          wallet: publicKey.toString(),
          tokenId: tokenId
        });
        throw rpcError;
      }
    } catch (error) {
      console.error('Error fetching token balance:', error);
      setTokenBalance(0);
    }
  }, [connected, publicKey, game?.ca]);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch game: ${response.statusText}`);
        }
        const data = await response.json();
        setGame(data);
        // Set initial likes count from game data
        setLikesCount(data.likesCount || 0);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPrice = async () => {
      try {
        const tokenId = game?.ca || ALPHA_GUI.SEND_TOKEN_CA;
        const response = await fetch(`/api/jupiter/price?tokenId=${tokenId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch price: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setPrice(data);
      } catch (error) {
        console.error('Price fetch error:', error);
        setPrice(null);
      }
    };

    const fetchLikeStatus = async () => {
      try {
        if (!connected || !publicKey) return;

        const response = await fetch(`/api/games/${gameId}/like?wallet=${publicKey.toString()}`);

        if (response.status === 404) {
          // Game not found - this is handled by the game fetch
          return;
        }

        if (!response.ok) {
          console.error('Failed to fetch like status:', response.statusText);
          return;
        }

        const data = await response.json();
        setIsLiked(data.liked);
        setLikesCount(data.likesCount);
      } catch (error) {
        console.error('Error fetching like status:', error);
        // Don't throw the error, just log it
      }
    };

    fetchGame();
    fetchPrice();
    fetchTokenBalance();
    fetchLikeStatus();
    
    // Refresh price and balance every 30 seconds
    const interval = setInterval(() => {
      fetchPrice();
      fetchTokenBalance();
      fetchLikeStatus(); // This will also update the likes count
    }, 30000);
    
    return () => clearInterval(interval);
  }, [gameId, game?.ca, connected, publicKey, fetchTokenBalance]);

  const handleCopyCA = () => {
    const ca = game?.ca || ALPHA_GUI.SEND_TOKEN_CA;
    const gameUrl = getGameUrl(gameId);
    navigator.clipboard.writeText(ca);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBuy = async () => {
    if (!showBuyInput) {
      setShowBuyInput(true);
      return;
    }

    if (!buyAmount || isNaN(Number(buyAmount)) || Number(buyAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to buy",
        variant: "destructive",
      });
      return;
    }

    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue",
        variant: "destructive",
      });
      return;
    }

    if (!signTransaction) {
      toast({
        title: "Error",
        description: "Your wallet doesn't support signing transactions",
        variant: "destructive",
      });
      return;
    }

    setIsBuying(true);
    try {
      // Get the transaction from Jupiter API
      const res = await fetch('/api/jupiter/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(buyAmount),
          outputMint: game?.ca || ALPHA_GUI.SEND_TOKEN_CA,
          wallet: publicKey.toString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }

      // Convert hex back to transaction
      const transactionBuffer = Uint8Array.from(Buffer.from(data.transactionHex, 'hex'));
      const transaction = VersionedTransaction.deserialize(transactionBuffer);
      
      // Sign the transaction
      const signedTransaction = await signTransaction(transaction);
      
      // Send to Jupiter's execute endpoint
      const executeRes = await fetch(`${JUP_ULTRA_API}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signedTransaction: Buffer.from(signedTransaction.serialize()).toString('base64'),
          requestId: data.requestId,
        }),
      });
      
      const executeResult = await executeRes.json();
      if (!executeRes.ok) {
        throw new Error(executeResult.error || 'Failed to execute transaction');
      }

      toast({
        title: "Success!",
        description: `Successfully bought tokens worth ${buyAmount} SOL`,
      });
      setShowBuyInput(false);
      setBuyAmount('');
      // Refresh token balance after successful buy
      await fetchTokenBalance();
    } catch (error) {
      console.error('Buy error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process transaction',
        variant: "destructive",
      });
    } finally {
      setIsBuying(false);
    }
  };

  const handleSell = async () => {
    if (!showSellInput) {
      setShowSellInput(true);
      setSellAmount(tokenBalance.toString());
      return;
    }

    if (!sellAmount || isNaN(Number(sellAmount)) || Number(sellAmount) <= 0 || Number(sellAmount) > tokenBalance) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to sell",
        variant: "destructive",
      });
      return;
    }

    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue",
        variant: "destructive",
      });
      return;
    }

    if (!signTransaction) {
      toast({
        title: "Error",
        description: "Your wallet doesn't support signing transactions",
        variant: "destructive",
      });
      return;
    }

    setIsSelling(true);
    try {
      // Get the transaction from Jupiter API
      const response = await fetch('/api/jupiter/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(sellAmount),
          inputMint: game?.ca || ALPHA_GUI.SEND_TOKEN_CA,
          wallet: publicKey.toString(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.error || `HTTP error! status: ${response.status}`;
        console.error('Sell error response:', { status: response.status, data });
        throw new Error(errorMessage || 'Failed to process sell transaction');
      }

      // Convert hex back to transaction
      const transactionBuffer = Uint8Array.from(Buffer.from(data.transactionHex, 'hex'));
      const transaction = VersionedTransaction.deserialize(transactionBuffer);
      
      // Sign the transaction
      const signedTransaction = await signTransaction(transaction);
      
      // Send to Jupiter's execute endpoint
      const executeRes = await fetch(`${JUP_ULTRA_API}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signedTransaction: Buffer.from(signedTransaction.serialize()).toString('base64'),
          requestId: data.requestId,
        }),
      });
      
      const executeResult = await executeRes.json();
      if (!executeRes.ok) {
        throw new Error(executeResult.error || 'Failed to execute transaction');
      }

      toast({
        title: "Success!",
        description: `Successfully sold ${sellAmount} tokens`,
      });
      setShowSellInput(false);
      setSellAmount('');
      // Refresh token balance after successful sell
      await fetchTokenBalance();
    } catch (error) {
      console.error('Sell error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process transaction',
        variant: "destructive",
      });
    } finally {
      setIsSelling(false);
    }
  };

  const handleLike = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to like games",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLiking(true);
      const response = await fetch(`/api/games/${gameId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update like: ${response.statusText}`);
      }

      const data = await response.json();
      setIsLiked(data.liked);
      setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error updating like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    }
    if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    }
    if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
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
    <div className="h-screen bg-background flex flex-col" style={{ fontFamily: 'Matrix Sans Video' }}>
      <div className="flex-1 w-full h-full relative">
        <iframe
          src={`${ALPHA_GUI.EMBED_URL}?project_url=${encodeURIComponent(game.url)}`}
          className="w-full h-full"
          style={{ position: 'absolute', top: 0, left: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        
        {/* Left Column */}
        <div className="absolute left-0 top-0 h-full w-[15%] flex flex-col gap-4 ml-4 mt-5 z-20">
          <div className="text-2xl font-bold" style={{ fontFamily: 'Matrix Sans Video', background: 'linear-gradient(to right, #EE00FF, #EE5705)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{game.name}</div>
          <p className="text-muted-foreground break-words whitespace-normal w-full pr-4">{game.description}</p>
          {/* Contract Address */}
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Contract Address</p>
            <div className="flex items-center gap-2">
              <code className="text-xs whitespace-nowrap bg-muted px-2 py-1 rounded text-[6px]">
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
              {copied && <span className="text-xs text-green-500">Copied!</span>}
            </div>
          </div>

          {/* Spacer to push content to bottom */}
          <div className="flex-1" />

          {/* Price / Market / Balance */}
          <div className="flex flex-col gap-4 mt-auto mb-28">
            {/* Price */}
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Price:</p>
              <span className="text-lg font-semibold">
                ${price?.price.toFixed(4) || '0.0000'}
              </span>
            </div>

            {/* Market Cap */}
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Market Cap:</p>
              <span className="text-lg font-semibold">
                {price?.marketCap ? formatNumber(price.marketCap) : '$0.00'}
              </span>
            </div>

            {/* Token Balance */}
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Balance:</p>
              <span className="text-lg font-semibold">{tokenBalance.toFixed(4)}</span>
            </div>

            {/* Buy/Sell buttons */}
            <div className="flex flex-col gap-2">
              {showBuyInput ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount in SOL"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="w-32"
                    min="0"
                    step="0.01"
                  />
                  <Button
                    onClick={handleBuy}
                    disabled={isBuying}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {isBuying ? 'Buying...' : 'Confirm Buy'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBuyInput(false);
                      setBuyAmount('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleBuy}
                  disabled={isBuying}
                  className="bg-green-500 hover:bg-green-600 text-white w-full py-1 h-8 text-sm"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Buy
                </Button>
              )}
              {showSellInput ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount to sell"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    className="w-32"
                    min="0"
                    max={tokenBalance}
                    step="0.01"
                  />
                  <Button
                    onClick={handleSell}
                    disabled={isSelling}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {isSelling ? 'Selling...' : 'Confirm Sell'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSellInput(false);
                      setSellAmount('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleSell}
                  disabled={isSelling || tokenBalance <= 0}
                  className="bg-red-500 hover:bg-red-600 text-white w-full py-1 h-8 text-sm"
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Sell
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="absolute right-0 top-0 h-full w-[15%] flex flex-col gap-4 mr-6 mt-5 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            disabled={isLiking}
            className={`h-10 w-10 self-start ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="ml-2">{likesCount}</span>
          </Button>

          {/* Spacer to push comments to bottom */}
          <div className="flex-1" />

          {/* Comments section at bottom */}
          <div className="mt-auto">
            <h2 className="text-xl font-semibold mb-4">Comments</h2>
            <div className="overflow-y-auto max-h-[calc(100vh-300px)] mb-5">
              <CommentsSection projectId={gameId} />
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
} 