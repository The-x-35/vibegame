"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/navbar";
import SuggestionCard from "@/components/suggestion-card";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/use-user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ALPHA_GUI } from '@/global/constant';

// Game template interface
interface GameTemplate {
  id: string;
  name: string;
  url: string;
  description: string;
}

export default function GamesPage() {
  const [templates, setTemplates] = useState<GameTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [cloneDescription, setCloneDescription] = useState("");
  const [clonePublic, setClonePublic] = useState(false);

  useEffect(() => {
    // Fetch templates from the database API
    (async () => {
      try {
        const response = await fetch('/api/templates');
        if (!response.ok) {
          throw new Error(`Failed to fetch templates: ${response.statusText}`);
        }
        const data: GameTemplate[] = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setCloneName(selectedTemplate.name);
      setCloneDescription(selectedTemplate.description);
      setClonePublic(false);
    }
  }, [selectedTemplate]);

  const handleCloneTemplate = (template: GameTemplate) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  const handleSubmitClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTemplate) return;
    try {
      const response = await fetch('/api/projects/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedTemplate.id,
          name: cloneName,
          description: cloneDescription,
          isPublic: clonePublic,
          wallet: user.wallet,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to clone project');
      }
      const projectId = data.project.id;
      setIsFormOpen(false);
      router.push(`/editor/${projectId}`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error cloning project');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            Game Templates
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse and open any of the available sample projects to kickstart your game development journey.
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-lg overflow-hidden border border-border/50 shadow-sm">
                <div className="h-48 bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-muted animate-pulse rounded-md w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded-md w-full" />
                  <div className="h-8 bg-muted animate-pulse rounded-md w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((t) => (
                <SuggestionCard
                  key={t.id}
                  embedUrl={`${ALPHA_GUI.EMBED_URL}?project_url=${encodeURIComponent(
                    t.url
                  )}`}
                  name={t.name}
                  description={t.description}
                  onOpen={() => router.push(`/games/${t.id}`)}
                />
              ))}
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clone Game</DialogTitle>
                  <DialogDescription>Customize your cloned game details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitClone} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="clone-name" className="text-right">Name</Label>
                    <Input id="clone-name" className="col-span-3" value={cloneName} onChange={(e) => setCloneName(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="clone-description" className="text-right pt-2">Description</Label>
                    <Textarea id="clone-description" className="col-span-3" value={cloneDescription} onChange={(e) => setCloneDescription(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="clone-public" className="text-right">Public</Label>
                    <Switch id="clone-public" checked={clonePublic} onCheckedChange={setClonePublic} className="col-span-3" />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Clone</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}