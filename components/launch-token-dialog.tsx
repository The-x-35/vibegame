"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Rocket, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { ALPHA_GUI, API_ENDPOINTS } from "@/global/constant";
import Link from "next/link";
import { getGameUrl } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction, VersionedTransaction, PublicKey, Connection } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

interface LaunchTokenDialogProps {
  projectId: string;
  projectUrl: string;
  projectName: string;
  projectDescription: string;
  ca?: string | null;
  onUpdate?: (updatedProject: { ca: string; is_public: boolean }) => void;
}

export default function LaunchTokenDialog({ 
  projectId, 
  projectUrl, 
  projectName, 
  projectDescription,
  ca,
  onUpdate,
}: LaunchTokenDialogProps) {
  const router = useRouter();
  const { connected, publicKey, signTransaction } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [isLaunchMode, setIsLaunchMode] = useState(false); // true = launch token, false = attach token
  const [manualCa, setManualCa] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingCa, setIsValidatingCa] = useState(false);
  const [caValidationError, setCaValidationError] = useState<string | null>(null);
  const [isCaValid, setIsCaValid] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ name?: string; symbol?: string; decimals?: number; supply?: number } | null>(null);
  const [lastValidatedCa, setLastValidatedCa] = useState<string>("");
  
  // Token launch fields
  const [tokenName, setTokenName] = useState("");
  const [tokenTicker, setTokenTicker] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [tokenTelegram, setTokenTelegram] = useState("");
  const [tokenTwitter, setTokenTwitter] = useState("");
  const [imageBase64, setImageBase64] = useState<string>("");

  // Initialize Solana connection
  const connection = new Connection(API_ENDPOINTS.SOLANA_RPC_ENDPOINT, 'confirmed');

  useEffect(() => {
    if (isOpen) {
      setTokenName(projectName);
      setTokenDescription(projectDescription);
      setManualCa("");
      setCaValidationError(null);
      setIsCaValid(false);
      setTokenInfo(null);
      setLastValidatedCa("");
    }
  }, [isOpen, projectName, projectDescription]);

  // Validate CA when manualCa changes
  useEffect(() => {
    const validateCa = async () => {
      const trimmedCa = manualCa.trim();
      
      // Don't validate if empty
      if (!trimmedCa) {
        setCaValidationError(null);
        setIsCaValid(false);
        setTokenInfo(null);
        setLastValidatedCa("");
        return;
      }

      // Don't validate if we already validated this exact value
      if (lastValidatedCa === trimmedCa) {
        return;
      }

      setIsValidatingCa(true);
      setCaValidationError(null);
      setTokenInfo(null);

      try {
        // Basic format check - Solana addresses are base58 encoded and typically 32-44 characters
        if (trimmedCa.length < 32 || trimmedCa.length > 44) {
          setCaValidationError("Invalid contract address format - wrong length");
          setIsCaValid(false);
          setTokenInfo(null);
          return;
        }

        // Check if it contains only valid base58 characters
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
        if (!base58Regex.test(trimmedCa)) {
          setCaValidationError("Invalid contract address format - invalid characters");
          setIsCaValid(false);
          setTokenInfo(null);
          return;
        }

        let publicKey: PublicKey;
        try {
          publicKey = new PublicKey(trimmedCa);
        } catch (pubKeyError) {
          setCaValidationError("Invalid contract address format");
          setIsCaValid(false);
          setTokenInfo(null);
          return;
        }
        
        // Use getMint from @solana/spl-token to properly validate the token mint
        const mintInfo = await getMint(connection, publicKey);
        
        // If getMint succeeds, it's a valid SPL token mint
        setIsCaValid(true);
        setCaValidationError(null);
        
        // Store token information for display
        setTokenInfo({
          decimals: mintInfo.decimals,
          supply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)
        });
        
        // Mark this CA as validated
        setLastValidatedCa(trimmedCa);
        
      } catch (error) {
        console.error('Token validation error:', error);
        
        // Check if it's a format error vs on-chain error
        if (error instanceof Error) {
          if (error.message.includes('Account does not exist')) {
            setCaValidationError("Invalid contract address - token does not exist on-chain");
          } else if (error.message.includes('Invalid account data')) {
            setCaValidationError("Invalid contract address - not a valid SPL token mint");
          } else {
            setCaValidationError("Invalid contract address - verification failed");
          }
        } else {
          setCaValidationError("Invalid contract address");
        }
        
        setIsCaValid(false);
        setTokenInfo(null);
        setLastValidatedCa(trimmedCa); // Mark as validated even if failed
      } finally {
        setIsValidatingCa(false);
      }
    };

    // Debounce validation to avoid too many API calls
    const timeoutId = setTimeout(validateCa, 500);
    return () => clearTimeout(timeoutId);
  }, [manualCa, connection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log('Starting token process...');
      
      let ca: string;
      
      if (isLaunchMode) {
        // Launch new token
        console.log('Launching new token...');
        if (!connected || !publicKey) {
          throw new Error('Please connect your wallet to launch a token');
        }
        // Token amount is set to 0 by default
        
        console.log('Token launch parameters:', {
          tokenName,
          tokenTicker,
          tokenDescription,
          tokenTelegram,
          tokenTwitter,
          wallet: publicKey.toString(),
          initialBuyAmount: 0,
          image: imageBase64
        });

        // Build request body expected by /api/launch
        const requestBody: any = {
          user: publicKey.toString(),
          tokenName: tokenName,
          tokenTicker: tokenTicker,
          description: tokenDescription.slice(0, 500),
          image: imageBase64,
          initialBuyAmount: 0,
          twitter: tokenTwitter?.trim() || undefined,
          telegram: tokenTelegram?.trim() || undefined,
          website: 'https://vibegame.fun/', // hardcoded
          platform: "meteora",
          username: publicKey.toString()
        };

        const launchRes = await fetch('/api/launch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const launchResult = await launchRes.json();

        if (!launchRes.ok || !launchResult.success) {
          console.error('Launch API failed:', launchResult);
          throw new Error(launchResult.message || 'Launch failed');
        }

        const txBase64: string | undefined = launchResult.data?.tx;
        const tokenAddress: string | undefined = launchResult.data?.tokenAddress || launchResult.data?.mint;

        if (!tokenAddress) {
          throw new Error('No token address returned from launch API');
        }

        if (!txBase64) {
          throw new Error('No transaction returned from launch API');
        }

        if (!signTransaction) {
          throw new Error('Wallet does not support signing transactions');
        }

        console.log('📝 Deserialising transaction for signing ...');
        const txBuffer = Buffer.from(txBase64, 'base64');
        let transaction: Transaction | VersionedTransaction;
        try {
          transaction = VersionedTransaction.deserialize(Uint8Array.from(txBuffer));
        } catch (e) {
          console.warn('Falling back to legacy Transaction deserialisation');
          transaction = Transaction.from(txBuffer);
        }

        // Sign using the connected wallet
        const signedTx = await signTransaction(transaction);
        const signedTxBase64 = Buffer.from(signedTx.serialize() as Uint8Array).toString('base64');

        console.log('✅ Transaction signed, forwarding to /api/sign ...');
        const signRes = await fetch('/api/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mintAddress: tokenAddress,
            tx: signedTxBase64,
            tokenTicker,
            username: publicKey.toString(),
          }),
        });

        const signResult = await signRes.json();
        if (!signRes.ok || !signResult.success) {
          console.error('Sign API failed:', signResult);
          throw new Error(signResult.message || 'Failed to broadcast signed transaction');
        }

        console.log('📬 Transaction submitted successfully');
        ca = tokenAddress;
      } else {
        // Attach existing token
        console.log('Attaching existing token...');
        if (!manualCa.trim()) {
          throw new Error('Please enter a valid contract address');
        }
        if (!isCaValid) {
          throw new Error('Please enter a valid contract address');
        }
        ca = manualCa.trim();
      }

      // Update project with CA
      console.log('Updating project with CA:', ca);
      if (!publicKey) {
        throw new Error('Please connect your wallet');
      }

      const updateResponse = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ca,
          is_public: true,
          wallet: publicKey.toString()
        }),
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('Failed to update project:', errorData);
        throw new Error('Failed to update project with token information');
      }
      
      console.log('Project updated successfully');
      setIsOpen(false);
      
      // Update parent state instead of refreshing
      if (onUpdate) {
        onUpdate({ ca, is_public: true });
      }
    } catch (err) {
      console.error('Token process error:', err);
      alert(`Token process failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (ca) {
    return (
      <Button size="lg" asChild>
        <Link href={getGameUrl(projectId)}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Project
        </Link>
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Rocket className="mr-2 h-4 w-4" />
          Launch Token
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto bg-black/40 backdrop-blur-xl border border-gray-800/50">
        <DialogHeader>
          <DialogTitle>Token Configuration</DialogTitle>
          <DialogDescription>Choose to either attach an existing token or launch a new one.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="token-mode" className="text-right text-white">Launch New Token</Label>
            <Switch 
              id="token-mode" 
              checked={isLaunchMode} 
              onCheckedChange={setIsLaunchMode} 
              className="col-span-3 [&>span]:bg-white [&>span]:shadow-lg data-[state=checked]:[&>span]:bg-gray-800" 
            />
          </div>
          
          {!isLaunchMode && (
            // Attach Token Mode
            <div className="space-y-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="manual-ca" className="text-right text-white">Contract Address</Label>
                <div className="col-span-3 space-y-1">
                  <Input 
                    id="manual-ca" 
                    className={`bg-black border-gray-800 text-white placeholder:text-gray-500 focus:ring-0 focus:border-gray-700 ${
                      caValidationError ? 'border-red-500' : isCaValid ? 'border-green-500' : ''
                    }`}
                    placeholder="Enter contract address"
                    value={manualCa}
                    onChange={(e) => setManualCa(e.target.value)}
                    required
                  />
                  {isValidatingCa && (
                    <p className="text-sm text-yellow-500">Validating contract address...</p>
                  )}
                  {caValidationError && (
                    <p className="text-sm text-red-500">{caValidationError}</p>
                  )}
                  {isCaValid && !isValidatingCa && tokenInfo && (
                    <div className="text-sm text-green-500 space-y-1">
                      <p>✓ Valid SPL token mint</p>
                      <p className="text-gray-400">
                        Decimals: {tokenInfo.decimals} | 
                        Supply: {tokenInfo.supply?.toLocaleString() || 'Unknown'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {isLaunchMode && (
            // Launch Token Mode
            <>
              {!connected ? (
                <div className="col-span-4 flex justify-center">
                  <WalletMultiButton />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="token-name" className="text-right text-white">Token Name</Label>
                                          <Input
                        id="token-name"
                        className="col-span-3 bg-black border-gray-800 text-white placeholder:text-gray-500 focus:ring-0 focus:border-gray-700"
                        placeholder="Token Name"
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                        required
                      />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="token-ticker" className="text-right text-white">Token Ticker</Label>
                                          <Input
                        id="token-ticker"
                        className="col-span-3 bg-black border-gray-800 text-white placeholder:text-gray-500 focus:ring-0 focus:border-gray-700"
                        placeholder="Ticker (2-10 characters, e.g. ABC)"
                        value={tokenTicker}
                        onChange={(e) => setTokenTicker(e.target.value)}
                        minLength={2}
                        maxLength={10}
                        required
                      />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="token-description" className="text-right pt-2 text-white">Token Description</Label>
                                          <Textarea
                        id="token-description"
                        className="col-span-3 bg-black border-gray-800 text-white placeholder:text-gray-500 focus:ring-0 focus:border-gray-700"
                        placeholder="Description"
                        value={tokenDescription}
                        onChange={(e) => setTokenDescription(e.target.value)}
                        required
                      />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="token-telegram" className="text-right text-white">Telegram</Label>
                    <Input
                      id="token-telegram"
                      className="col-span-3 bg-black border-gray-800 text-white placeholder:text-gray-500"
                      placeholder="Telegram (optional)"
                      value={tokenTelegram}
                      onChange={(e) => setTokenTelegram(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="token-twitter" className="text-right text-white">Twitter</Label>
                    <Input
                      id="token-twitter"
                      className="col-span-3 bg-black border-gray-800 text-white placeholder:text-gray-500"
                      placeholder="Twitter (optional)"
                      value={tokenTwitter}
                      onChange={(e) => setTokenTwitter(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="token-image" className="text-right text-white">Token Image</Label>
                    <Input
                      id="token-image"
                      className="col-span-3 bg-black border-gray-800 text-white placeholder:text-gray-500"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImageBase64(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        } else {
                          setImageBase64("");
                        }
                      }}
                      required
                    />
                  </div>
                </>
              )}
            </>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isLoading || 
                (!isLaunchMode && (!manualCa.trim() || !isCaValid || isValidatingCa)) || 
                (isLaunchMode && (!connected || !tokenName || !tokenTicker || !tokenDescription || !imageBase64))
              }
            >
              {isLoading ? "Processing..." : (isLaunchMode ? "Launch Token" : "Attach Token")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 