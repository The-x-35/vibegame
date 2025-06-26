"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ALPHA_GUI } from '@/global/constant';
import { Button } from "@/components/ui/button";
import { Copy, TrendingUp, TrendingDown, Heart, Check } from "lucide-react";
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
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { getAuthToken, loginWithWallet } from '@/lib/auth-utils';

interface Game {
  id: string;
  name: string;
  url: string;
  description: string;
  ca?: string;
  likesCount?: number;
  viewsCount?: number;
  commentsCount?: number;
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
  const [viewsCount, setViewsCount] = useState(0);
  const [playsCount, setPlaysCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);

  const { signTransaction, connected, publicKey, select, connect, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  // Auto-login when wallet connects
  useEffect(() => {
    const handleWalletLogin = async () => {
      if (connected && publicKey && !getAuthToken()) {
        try {
          await loginWithWallet(publicKey.toString());
          console.log('Auto-login successful');
        } catch (error) {
          console.error('Auto-login failed:', error);
        }
      }
    };

    handleWalletLogin();
  }, [connected, publicKey]);

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

  const fetchPlaysCount = useCallback(async () => {
    try {
      const connection = new Connection(API_ENDPOINTS.SOLANA_RPC_ENDPOINT, 'confirmed');
      const playsAccountPublicKey = new PublicKey('7rtHJuXdP36q1Y4QjcqCLGFGZkDhvik77zAjPePfjjzw');
      
      const balance = await connection.getBalance(playsAccountPublicKey);
      const balanceInSol = balance / Math.pow(10, 9); // Convert lamports to SOL
      const plays = Math.floor(balanceInSol / 0.0001); // Divide by 0.0001 to get plays count
      
      setPlaysCount(plays);
    } catch (error) {
      console.error('Error fetching plays count:', error);
      setPlaysCount(0);
    }
  }, []);

  const refreshCommentsCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`);
      if (response.ok) {
        const data = await response.json();
        setCommentsCount(data.commentsCount || 0);
      }
    } catch (error) {
      console.error('Error refreshing comments count:', error);
    }
  }, [gameId]);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch game: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Game data from API:', data);
        setGame(data);
        // Set initial likes count and views count from game data
        setLikesCount(data.likesCount || 0);
        setViewsCount(data.viewsCount || 0);
        console.log('Set views count to:', data.viewsCount || 0);
        setCommentsCount(data.commentsCount || 0);
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

    const incrementViews = async () => {
      try {
        console.log('Incrementing views for game:', gameId);
        const response = await fetch(`/api/games/${gameId}/view`, {
          method: 'POST',
        });
        console.log('View API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('View API response data:', data);
          setViewsCount(data.viewsCount);
        } else {
          const errorData = await response.json();
          console.error('View API error:', errorData);
        }
      } catch (error) {
        console.error('Error incrementing views:', error);
        // Don't throw the error, just log it
      }
    };

    fetchGame();
    fetchPrice();
    fetchTokenBalance();
    fetchLikeStatus();
    incrementViews();
    fetchPlaysCount();
    
    // Refresh price and balance every 30 seconds
    const interval = setInterval(() => {
      fetchPrice();
      fetchTokenBalance();
      fetchLikeStatus(); // This will also update the likes count
      fetchPlaysCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [gameId, game?.ca, connected, publicKey, fetchTokenBalance, fetchPlaysCount]);

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
      await handleConnectWallet();
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
          wallet: publicKey!.toString(),
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
      await handleConnectWallet();
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
          wallet: publicKey!.toString(),
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
      await handleConnectWallet();
      return;
    }

    try {
      setIsLiking(true);
      
      // Get JWT token using the utility function
      const token = getAuthToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add JWT token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/games/${gameId}/like`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          wallet: publicKey.toString(),
        }),
      });

      if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.error?.includes('connect your wallet')) {
          toast({
            title: "Wallet Required",
            description: "Please connect your wallet to like games",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Authentication failed",
            description: "Please connect your wallet again",
            variant: "destructive",
          });
        }
        return;
      }

      if (response.status === 429) {
        const data = await response.json();
        toast({
          title: "Rate limit exceeded",
          description: `Please wait ${data.retryAfter} seconds before trying again`,
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to update like: ${response.statusText}`);
      }

      const data = await response.json();
      setIsLiked(data.liked);
      setLikesCount(data.likesCount);
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

  // Add helper function for price formatting with subscript
  const formatPriceWithSubscript = (price: number): JSX.Element => {
    if (price === 0) return <>$0</>;
    
    const priceStr = price.toString();
    
    // If price is in scientific notation, convert it to decimal
    if (priceStr.includes('e')) {
      const [mantissa, exponent] = priceStr.split('e');
      const exp = parseInt(exponent);
      const decimalStr = price.toFixed(Math.abs(exp));
      return formatPriceWithSubscript(parseFloat(decimalStr));
    }

    // Handle regular decimal numbers
    if (priceStr.includes('.')) {
      const [whole, decimal] = priceStr.split('.');
      let leadingZeros = 0;
      let significantPart = '';
      
      // Count leading zeros in decimal part
      for (let i = 0; i < decimal.length; i++) {
        if (decimal[i] === '0') {
          leadingZeros++;
        } else {
          // Take only first 3 significant digits after zeros
          significantPart = decimal.slice(i, i + 3);
          break;
        }
      }
      
      if (leadingZeros > 0) {
        return (
          <span className="whitespace-nowrap">
            $0.0<sub className="text-[0.7em]">{leadingZeros}</sub>{significantPart}
          </span>
        );
      }
      
      // For regular decimals without leading zeros, show 4 significant digits
      return <>${parseFloat(priceStr).toPrecision(4)}</>;
    }
    
    // For whole numbers, show 4 significant digits
    return <>${parseFloat(priceStr).toPrecision(4)}</>;
  };

  // Add helper function for market cap formatting
  const formatMarketCap = (marketCap: string | number): string => {
    // If marketCap is already a formatted string, return as is
    if (typeof marketCap === 'string' && (marketCap.includes('K') || marketCap.includes('M') || marketCap.includes('B') || marketCap.includes('T'))) {
      return marketCap.startsWith('$') ? marketCap : `$${marketCap}`;
    }
    
    // Convert to number if it's a string
    const num = typeof marketCap === 'string' ? parseFloat(marketCap.replace(/[$,]/g, '')) : marketCap;
    
    if (isNaN(num)) return 'N/A';
    
    if (num >= 1e12) {
      return `$${(num / 1e12).toFixed(1)}T`;
    } else if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(1)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(1)}M`;
    } else if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(1)}K`;
    } else {
      return `$${num.toFixed(0)}`;
    }
  };

  const formatContractAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-3)}`;
  };

  const handleConnectWallet = async () => {
    try {
      setVisible(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-10">
          <div className="h-[calc(100vh-200px)] bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500">Game not found</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile placeholder */}
      <div className="flex md:hidden items-center justify-center min-h-screen bg-background px-4">
        <p className="text-center text-lg font-semibold text-muted-foreground">
          Please visit on a desktop device to play this game.
        </p>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block min-h-screen bg-background" style={{ fontFamily: 'Matrix Sans Video' }}>
        {/* Main flex container */}
        <div className="flex w-full h-screen">
          {/* Left Column */}
          <div className="w-[24%] min-w-[280px] flex flex-col gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 md:p-5 border-r border-border">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Matrix Sans Video', background: 'linear-gradient(to right, #EE00FF, #EE5705)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{game.name}</div>
            <p className="text-lg text-muted-foreground break-words whitespace-normal w-full">{game.description}</p>

            {/* Spacer to push content to bottom */}
            <div className="flex-1" />

            {/* Views Count */}
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">Plays</p>
              <span className="font-semibold text-lg">
                {viewsCount.toLocaleString()}
              </span>
            </div>

            {/* Plays Count */}
            {/* <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">Plays</p>
              <span className="font-semibold text-lg">
                {playsCount.toLocaleString()}
              </span>
            </div> */}

            {/* Contract Address */}
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">Contract Address</p>
              <div className="flex items-center gap-1 sm:gap-2">
                <code className="whitespace-nowrap bg-muted px-1 sm:px-2 py-0.5 sm:py-1 rounded text-sm overflow-x-auto max-w-[120px] sm:max-w-[150px] md:max-w-none">
                  {formatContractAddress(game.ca || ALPHA_GUI.SEND_TOKEN_CA)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyCA}
                  className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9"
                >
                  {copied ? (
                    <Check className="h-3 w-3 sm:h-3 sm:w-3 md:h-3 md:w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 sm:h-3 sm:w-3 md:h-3 md:w-3" />
                  )}
                </Button>
                <a
                  href="https://discord.gg/sendarcade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-7 w-7 sm:h-7 sm:w-7 md:h-7 md:w-7 rounded-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4 sm:h-4 sm:w-4 md:h-4 md:w-4 text-[#5865F2]"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Separator */}
            <div className="w-full h-px bg-border my-2" />

            {/* Price / Market / Balance */}
            <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
              {/* Price */}
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-sm">Price</p>
                <span className="font-semibold text-lg">
                  {price?.price ? formatPriceWithSubscript(price.price) : '$0.0000'}
                </span>
              </div>

              {/* Market Cap */}
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-sm">Mkt. Cap</p>
                <span className="font-semibold text-lg">
                  {price?.marketCap ? formatMarketCap(price.marketCap) : '$0.00'}
                </span>
              </div>

              {/* Token Balance */}
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-sm">Balance</p>
                <span className="font-semibold text-lg">
                  {tokenBalance.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Separator */}
            <div className="w-full h-px bg-border my-2" />

            {/* Buy/Sell section */}
            <div className="flex flex-col">
              {/* Buy Input Drawer */}
              <div className={`mt-0 overflow-hidden transition-[height,opacity] duration-300 ease-in-out ${showBuyInput ? 'h-[160px] opacity-100' : 'h-0 opacity-0'}`}>
                <div className="w-full bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-2 shadow-lg">
                  <div className="flex flex-col gap-2">
                    <Input
                      type="number"
                      placeholder="Amount in SOL"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="w-full focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="0"
                      step="0.01"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBuyAmount("0.1")}
                        className="flex-1 text-xs h-7"
                      >
                        0.1 SOL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBuyAmount("0.5")}
                        className="flex-1 text-xs h-7"
                      >
                        0.5 SOL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBuyAmount("1")}
                        className="flex-1 text-xs h-7"
                      >
                        1 SOL
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleBuy}
                        disabled={isBuying}
                        className="flex-1 bg-[#3405EE] hover:bg-[#2804cc] text-white"
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
                  </div>
                </div>
              </div>

              {/* Sell Input Drawer */}
              <div className={`overflow-hidden transition-[height,opacity] duration-300 ease-in-out ${showSellInput ? 'h-[120px] opacity-100' : 'h-0 opacity-0'}`}>
                <div className="w-full bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-lg">
                  <div className="flex flex-col gap-2">
                    <Input
                      type="number"
                      placeholder="Amount to sell"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      className="w-full focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="0"
                      max={tokenBalance}
                      step="0.01"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSellAmount("0.1")}
                        className="flex-1 text-xs h-7"
                      >
                        0.1 SOL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSellAmount("0.5")}
                        className="flex-1 text-xs h-7"
                      >
                        0.5 SOL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSellAmount("1")}
                        className="flex-1 text-xs h-7"
                      >
                        1 SOL
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSell}
                        disabled={isSelling}
                        className="flex-1 bg-[#EE4005] hover:bg-[#cc3604] text-white"
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
                  </div>
                </div>
              </div>

              {/* Buy/Sell buttons */}
              <div className="flex gap-2 w-full">
                <Button
                  onClick={handleBuy}
                  disabled={isBuying}
                  className="flex-1 bg-[#3405EE] hover:bg-[#2804cc] text-white h-9"
                >
                  Buy
                </Button>
                <Button
                  onClick={handleSell}
                  disabled={isSelling || tokenBalance <= 0}
                  className="flex-1 bg-[#EE4005] hover:bg-[#cc3604] text-white h-9"
                >
                  Sell
                </Button>
              </div>
            </div>
          </div>

          {/* Middle Section - Game */}
          <div className="w-full h-screen p-4">
            <iframe
              src={`${ALPHA_GUI.EMBED_URL}?project_url=${encodeURIComponent(game.url)}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Right Column */}
          <div className="w-[24%] min-w-[240px] flex flex-col h-screen p-3 sm:p-4 md:p-5 border-l border-border">
            {/* Heart button at top */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLike}
                disabled={isLiking}
                className={`h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
              >
                <Heart className={`h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="ml-0.5 sm:ml-1 md:ml-2 text-xs sm:text-md md:text-base">{likesCount}</span>
              </Button>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold">Comments ({commentsCount})</h2>
            </div>

            {/* Comments section with flex layout */}
            <div className="flex flex-col flex-1 min-h-0">
              {/* Scrollable comments list */}
              <div className="flex-1 overflow-y-auto">
                <CommentsSection projectId={gameId} onCommentAdded={refreshCommentsCount} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
} 