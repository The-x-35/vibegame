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
import DeleteTemplateDialog from '@/components/delete-template-dialog';
import { Trash2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

// Game template interface
interface GameTemplate {
  id: string;
  name: string;
  url: string;
  description: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<GameTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [cloneDescription, setCloneDescription] = useState("");
  const [clonePublic, setClonePublic] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<GameTemplate | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  // Auth check effect
  useEffect(() => {
    if (isUserLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    const token = localStorage.getItem('appToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode<{ sub: string }>(token);
      if (decoded.sub !== 'arpit.k3note@gmail.com') {
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
      return;
    }
  }, [user, isUserLoading, router]);

  // Fetch templates effect
  useEffect(() => {
    if (!user || isUserLoading) return;
    
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
  }, [user, isUserLoading]);

  // Clone form effect
  useEffect(() => {
    if (selectedTemplate) {
      setCloneName(selectedTemplate.name);
      setCloneDescription(selectedTemplate.description);
      setClonePublic(false);
    }
  }, [selectedTemplate]);

  // Show loading state while checking user authentication
  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render anything if not authorized
  if (!user) return null;

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
    setIsCloning(true);
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
    } finally {
      setIsCloning(false);
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
          <div className="flex justify-end mb-6">
            <Button
              onClick={() => router.push('/templates/add')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Add New Template
            </Button>
          </div>
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
                <div key={t.id} className="relative group">
                  <SuggestionCard
                    embedUrl={`${ALPHA_GUI.EMBED_URL}?project_url=${encodeURIComponent(
                      t.url
                    )}`}
                    name={t.name}
                    description={t.description}
                    onOpen={() => handleCloneTemplate(t)}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setTemplateToDelete(t)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clone Game</DialogTitle>
                  <DialogDescription>Customize your cloned game details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitClone} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Game Name</Label>
                    <Input
                      id="name"
                      value={cloneName}
                      onChange={(e) => setCloneName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={cloneDescription}
                      onChange={(e) => setCloneDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="public"
                      checked={clonePublic}
                      onCheckedChange={setClonePublic}
                    />
                    <Label htmlFor="public">Make Public</Label>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isCloning}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isCloning}>
                      {isCloning ? "Cloning..." : "Clone Game"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            {templateToDelete && (
              <DeleteTemplateDialog
                isOpen={!!templateToDelete}
                onClose={() => setTemplateToDelete(null)}
                templateId={templateToDelete.id}
                templateName={templateToDelete.name}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
} 