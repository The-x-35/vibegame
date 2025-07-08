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

interface AttachTokenDialogProps {
  projectId: string;
  projectUrl: string;
  projectName: string;
  projectDescription: string;
  ca?: string | null;
}

export default function AttachTokenDialog({ 
  projectId, 
  projectUrl, 
  projectName, 
  projectDescription,
  ca,
}: AttachTokenDialogProps) {
  const router = useRouter();
  const { connected, publicKey, signTransaction } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [useSendToken, setUseSendToken] = useState(true);
  const [manualCa, setManualCa] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log('Starting token attach process...');
      console.log('API Key from env:', process.env.NEXT_PUBLIC_MINTER_API_KEY ? 'Present' : 'Missing');
      console.log('API Key length:', process.env.NEXT_PUBLIC_MINTER_API_KEY?.length);
      
      let ca: string;
      if (useSendToken) {
        console.log('Using SEND token...');
        ca = ALPHA_GUI.SEND_TOKEN_CA;
      } else {
        console.log('Using manual CA...');
        if (!manualCa.trim()) {
          throw new Error('Please enter a valid contract address');
        }
        ca = manualCa.trim();
      }

      // Update project with CA
      console.log('Updating project with CA:', ca);
      const updateResponse = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
      console.error('Token attach error:', err);
      alert(`Token attach failed: ${err instanceof Error ? err.message : err}`);
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
          Attach Token
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attach Token to Project</DialogTitle>
          <DialogDescription>Configure your token attachment settings.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manual-ca" className="text-right">Contract Address</Label>
              <Input 
                id="manual-ca" 
                className="col-span-3" 
                placeholder="Enter contract address"
                value={manualCa}
                onChange={(e) => setManualCa(e.target.value)}
                required
              />
            </div>
          )}
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">Or launch your token on:</p>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open('https://launch.meteora.ag/', '_blank')}
              >
                Meteora
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open('https://pump.fun/create', '_blank')}
              >
                Pump.fun
              </Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || (!useSendToken && !manualCa.trim())}>
              {isLoading ? "Attaching..." : "Attach Token"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 