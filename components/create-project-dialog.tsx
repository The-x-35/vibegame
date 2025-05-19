"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Project } from "@/components/project-card";
import { Switch } from "@/components/ui/switch";
import launchPumpFunToken from "../lib/launchPumpFunToken";
import { API_ENDPOINTS, ALPHA_GUI } from '@/global/constant';

interface LaunchProjectDialogProps {
  projectId: string;
  onLaunch: (ca: string) => void;
}

export default function LaunchProjectDialog({ projectId, onLaunch }: LaunchProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenTicker, setTokenTicker] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [tokenTelegram, setTokenTelegram] = useState("");
  const [tokenTwitter, setTokenTwitter] = useState("");
  const [tokenWebsite, setTokenWebsite] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      // Fetch project details
      fetch(`/api/projects/${projectId}`)
        .then(res => res.json())
        .then(data => {
          if (data.project) {
            setName(data.project.name);
            setDescription(data.project.description);
            setUrl(data.project.url);
          }
        })
        .catch(err => console.error('Error fetching project:', err));
    }
  }, [isOpen, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('appToken') || '';
      const ca = await launchPumpFunToken({
        imageUrl: url,
        tokenName,
        tokenTicker,
        tokenDescription,
        tokenTelegram,
        tokenTwitter,
        tokenWebsite,
        appToken: token,
      });

      // Update project with CA
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          ca,
        }),
      });

      onLaunch(ca);
      setIsOpen(false);
    } catch (err) {
      console.error('Token launch error:', err);
      alert(`Token launch failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <PlusCircle className="mr-2 h-4 w-4" />
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
            <Input id="project-url" className="col-span-3" value={url} disabled />
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
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Launching..." : "Launch Token"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
