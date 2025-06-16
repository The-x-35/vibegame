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
import { ALPHA_GUI } from "@/global/constant";
import Link from "next/link";
import { getGameUrl } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction, VersionedTransaction } from '@solana/web3.js';

interface LaunchTokenDialogProps {
  projectId: string;
  projectUrl: string;
  projectName: string;
  projectDescription: string;
  ca?: string | null;
}

export default function LaunchTokenDialog({ 
  projectId, 
  projectUrl, 
  projectName, 
  projectDescription,
  ca,
}: LaunchTokenDialogProps) {
  const router = useRouter();
  const { connected, publicKey, signTransaction } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(projectName);
  const [description, setDescription] = useState(projectDescription);
  const [useSendToken, setUseSendToken] = useState(true);
  const [tokenName, setTokenName] = useState("");
  const [tokenTicker, setTokenTicker] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [tokenTelegram, setTokenTelegram] = useState("");
  const [tokenTwitter, setTokenTwitter] = useState("");
  const [tokenWebsite, setTokenWebsite] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setName(projectName);
      setDescription(projectDescription);
    }
  }, [isOpen, projectName, projectDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log('Starting token launch process...');
      console.log('API Key from env:', process.env.NEXT_PUBLIC_MINTER_API_KEY ? 'Present' : 'Missing');
      console.log('API Key length:', process.env.NEXT_PUBLIC_MINTER_API_KEY?.length);
      
      let ca: string;
      if (useSendToken) {
        console.log('Using SEND token...');
        ca = ALPHA_GUI.SEND_TOKEN_CA;
      } else {
        console.log('Launching new token...');
        if (!connected || !publicKey) {
          throw new Error('Please connect your wallet to launch a token');
        }
        if (!tokenAmount || isNaN(Number(tokenAmount)) || Number(tokenAmount) < 0) {
          throw new Error('Please enter a valid token amount');
        }
        
        console.log('Token launch parameters:', {
          tokenName,
          tokenTicker,
          tokenDescription,
          tokenTelegram,
          tokenTwitter,
          tokenWebsite,
          wallet: publicKey.toString(),
          initialBuyAmount: Number(tokenAmount),
          image: imageUrl
        });

        // Build request body expected by /api/launch
        const requestBody: any = {
          user: publicKey.toString(),
          tokenName,
          tokenTicker,
          description: tokenDescription,
          image: imageUrl,
          initialBuyAmount: Number(tokenAmount),
          twitter: tokenTwitter?.trim() || undefined,
          telegram: tokenTelegram?.trim() || undefined,
          website: tokenWebsite?.trim() || undefined,
          apiKey: process.env.NEXT_PUBLIC_MINTER_API_KEY || ""
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
      }

      // Update project with CA
      console.log('Updating project with CA:', ca);
      const updateResponse = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          ca,
          is_public: true
        }),
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('Failed to update project:', errorData);
        throw new Error('Failed to update project with token information');
      }
      
      console.log('Project updated successfully');
      setIsOpen(false);
      router.refresh(); // Refresh the page to show the new CA
    } catch (err) {
      console.error('Token launch error:', err);
      alert(`Token launch failed: ${err instanceof Error ? err.message : err}`);
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
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Launch Token for Project</DialogTitle>
          <DialogDescription>Configure your token launch settings.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project-url" className="text-right">Project URL</Label>
            <Input id="project-url" className="col-span-3" value={projectUrl} disabled />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project-name" className="text-right">Name</Label>
            <Input id="project-name" className="col-span-3" placeholder="Project Name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="project-description" className="text-right pt-2">Description</Label>
            <Textarea id="project-description" className="col-span-3" placeholder="Project Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="use-send-token" className="text-right">Use SEND token</Label>
            <Switch id="use-send-token" checked={useSendToken} onCheckedChange={setUseSendToken} className="col-span-3" />
          </div>
          {useSendToken && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="send-token-ca" className="text-right">SEND Token CA</Label>
              <Input id="send-token-ca" className="col-span-3" value={ALPHA_GUI.SEND_TOKEN_CA} disabled />
            </div>
          )}
          {!useSendToken && (
            <>
              {!connected ? (
                <div className="col-span-4 flex justify-center">
                  <WalletMultiButton />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="token-name" className="text-right">Token Name</Label>
                    <Input
                      id="token-name"
                      className="col-span-3"
                      placeholder="Token Name"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="token-ticker" className="text-right">Token Ticker</Label>
                    <Input
                      id="token-ticker"
                      className="col-span-3"
                      placeholder="Ticker (e.g. ABC)"
                      value={tokenTicker}
                      onChange={(e) => setTokenTicker(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="token-description" className="text-right pt-2">Token Description</Label>
                    <Textarea
                      id="token-description"
                      className="col-span-3"
                      placeholder="Description"
                      value={tokenDescription}
                      onChange={(e) => setTokenDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="token-amount" className="text-right">Token Amount</Label>
                    <Input
                      id="token-amount"
                      type="number"
                      className="col-span-3"
                      placeholder="Amount of tokens to mint"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="token-telegram" className="text-right">Telegram</Label>
                    <Input
                      id="token-telegram"
                      className="col-span-3"
                      placeholder="Telegram (optional)"
                      value={tokenTelegram}
                      onChange={(e) => setTokenTelegram(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="token-twitter" className="text-right">Twitter</Label>
                    <Input
                      id="token-twitter"
                      className="col-span-3"
                      placeholder="Twitter (optional)"
                      value={tokenTwitter}
                      onChange={(e) => setTokenTwitter(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="token-website" className="text-right">Website</Label>
                    <Input
                      id="token-website"
                      className="col-span-3"
                      placeholder="Website (optional)"
                      value={tokenWebsite}
                      onChange={(e) => setTokenWebsite(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="token-image" className="text-right">Token Image URL</Label>
                    <Input
                      id="token-image"
                      className="col-span-3"
                      type="url"
                      placeholder="https://example.com/image.png"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
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
            <Button type="submit" disabled={isLoading || (!useSendToken && !connected)}>
              {isLoading ? "Launching..." : "Launch Token"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 