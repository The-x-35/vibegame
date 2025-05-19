"use client";

import React, { useState } from "react";
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

interface CreateProjectDialogProps {
  onCreate: (project: Project) => void;
}

export default function CreateProjectDialog({ onCreate }: CreateProjectDialogProps) {
  const SOLANA_RPC_ENDPOINT = API_ENDPOINTS.SOLANA_RPC_ENDPOINT;
  const SIGN_ENDPOINT = API_ENDPOINTS.SIGN_ENDPOINT;
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [useSendToken, setUseSendToken] = useState(true);
  const [tokenName, setTokenName] = useState("");
  const [tokenTicker, setTokenTicker] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [tokenTelegram, setTokenTelegram] = useState("");
  const [tokenTwitter, setTokenTwitter] = useState("");
  const [tokenWebsite, setTokenWebsite] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!useSendToken) {
      try {
        const token = localStorage.getItem('appToken') || '';
        await launchPumpFunToken({
          imageUrl: url,
          tokenName,
          tokenTicker,
          tokenDescription,
          tokenTelegram,
          tokenTwitter,
          tokenWebsite,
          appToken: token,
        });
        alert('Token launched successfully!');
      } catch (err) {
        console.error('Token launch error:', err);
        alert(`Token launch failed: ${err instanceof Error ? err.message : err}`);
      }
    }
    const newProject: Project = {
      id: Date.now().toString(),
      url,
      name,
      description,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      thumbnail: url,
    };
    onCreate(newProject);
    setIsOpen(false);
    setUrl("");
    setName("");
    setDescription("");
    setUseSendToken(true);
    setTokenName("");
    setTokenTicker("");
    setTokenDescription("");
    setTokenTelegram("");
    setTokenTwitter("");
    setTokenWebsite("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Fill in the details for your new project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project-url" className="text-right">Project URL</Label>
            <Input id="project-url" className="col-span-3" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} required />
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
          {!useSendToken && (
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
            </>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
