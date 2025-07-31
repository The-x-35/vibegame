"use client";

import Link from "next/link";
import { ArrowRight, Coins, TrendingUp, Gamepad2, Users, Zap, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALPHA_GUI } from "@/global/constant";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { VersionedTransaction } from '@solana/web3.js';
import { JUP_ULTRA_API } from '@/global/constant';

export default function TokenPage() {
  const [copied, setCopied] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [showBuyInput, setShowBuyInput] = useState<boolean>(false);
  const [showSellInput, setShowSellInput] = useState<boolean>(false);
  const [sellAmount, setSellAmount] = useState<string>('');
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  const { toast } = useToast();
  const { signTransaction, connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ALPHA_GUI.SEND_TOKEN_CA);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setVisible(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
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
          outputMint: ALPHA_GUI.SEND_TOKEN_CA,
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
          inputMint: ALPHA_GUI.SEND_TOKEN_CA,
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
  const tokenFeatures = [
    {
      title: "Game Monetization",
      description: "Creators can monetize their games by integrating $VIBEY tokens for in-game purchases, rewards, and premium features.",
      icon: <Gamepad2 className="w-6 h-6" />,
    },
    {
      title: "NFT Marketplace",
      description: "Trade game assets, characters, and collectibles using $VIBEY tokens in our integrated marketplace.",
      icon: <TrendingUp className="w-6 h-6" />,
    },
    {
      title: "Community Governance",
      description: "Hold $VIBEY tokens to participate in platform governance and vote on important ecosystem decisions.",
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: "Creator Rewards",
      description: "Earn $VIBEY tokens for creating popular games, contributing to the platform, and helping other developers.",
      icon: <Zap className="w-6 h-6" />,
    },
  ];

  const tokenomics = [
    {
      category: "Creator Rewards",
      percentage: "35%",
      description: "Allocated to game creators and platform contributors",
    },
    {
      category: "Ecosystem Development",
      percentage: "25%",
      description: "Platform improvements and new features",
    },
    {
      category: "Community Treasury",
      percentage: "20%",
      description: "Governance and community-driven initiatives",
    },
    {
      category: "Team & Advisors",
      percentage: "15%",
      description: "Core team and strategic advisors",
    },
    {
      category: "Liquidity",
      percentage: "5%",
      description: "DEX liquidity and market making",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <Coins className="w-12 h-12 text-yellow-500" />
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 font-matrix-sans-regular">
            $VIBEY Token
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-matrix-sans-regular">
          The official memecoin of Vibegame.fun
        </p>
      </div>

      {/* Token Address */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2 font-matrix-sans-regular">Contract Address</h2>
            <p className="text-muted-foreground mb-3">
              Add $VIBEY to your wallet with this contract address:
            </p>
            <div className="inline-flex items-center gap-2 p-2 rounded-lg bg-card border font-mono text-sm">
              <span>{ALPHA_GUI.SEND_TOKEN_CA}</span>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6"
                onClick={handleCopy}
              >
                <Copy className={`h-3 w-3 ${copied ? 'text-green-500' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Buy/Sell Section */}
        <div className="mt-6 space-y-4">
          <div className={`overflow-hidden transition-[height,opacity] duration-300 ease-in-out ${showBuyInput ? 'h-[160px] opacity-100' : 'h-0 opacity-0'}`}>
            <div className="w-full bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-lg">
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

      {/* Flywheel Technology */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 font-matrix-sans-regular">🔄 Flywheel Technology</h2>
        <p className="text-muted-foreground leading-relaxed">
          We implement a sustainable flywheel technology where all fees collected from platform are automatically used to buy back 
          $VIBEY tokens from the market and burn them. This creates a deflationary mechanism that 
          continuously reduces the total supply, increasing the value of remaining tokens and creating 
          a self-sustaining ecosystem that benefits all $VIBEY holders.
        </p>
      </div>

      {/* Resources */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4 font-matrix-sans-regular">Resources</h2>
        <div className="grid gap-4">
          <Link href="/docs/how-to-build-a-game" className="group block p-4 rounded-lg border border-border/50 hover:border-primary/20 transition-colors hover:bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors font-matrix-sans-regular">
                  Game Development Guide
                </h3>
                <p className="text-sm text-muted-foreground">
                  Learn how to build games and earn $VIBEY rewards
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
          <Link href="/docs/top-games" className="group block p-4 rounded-lg border border-border/50 hover:border-primary/20 transition-colors hover:bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors font-matrix-sans-regular">
                  Success Stories
                </h3>
                <p className="text-sm text-muted-foreground">
                  See how top creators are making games
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </div>
      </div>
      <Toaster />
    </div>
  );
} 