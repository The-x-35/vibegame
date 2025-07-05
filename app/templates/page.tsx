"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/navbar";
import SuggestionCard from "@/components/suggestion-card";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/use-user";
import { Button } from "@/components/ui/button";
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
  thumbnail?: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<GameTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const [templateToDelete, setTemplateToDelete] = useState<GameTemplate | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  // Auth check effect
  useEffect(() => {
    console.log('Auth check - Current state:', {
      isUserLoading,
      user,
      wallet: user?.wallet
    });

    // Don't do anything while loading
    if (isUserLoading) {
      console.log('Still loading user data...');
      return;
    }

    // If we have user data and it's loaded
    if (user && user.wallet) {
      console.log('Checking wallet address:', {
        userWallet: user.wallet,
        allowedWallet: 'AidmVBuszvzCJ6cWrBQfKNwgNPU4KCvXBcrWh91vitm8',
        matches: user.wallet === 'AidmVBuszvzCJ6cWrBQfKNwgNPU4KCvXBcrWh91vitm8'
      });

      if (user.wallet !== 'AidmVBuszvzCJ6cWrBQfKNwgNPU4KCvXBcrWh91vitm8') {
        console.log('Wallet address mismatch, redirecting to home');
        router.push('/');
        return;
      }

      console.log('Auth check passed, user can access templates');
    } else {
      console.log('No user data yet, waiting for wallet connection...');
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

  const handleCloneTemplate = async (template: GameTemplate) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsCloning(true);
    try {
      const response = await fetch('/api/projects/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: template.id,
          name: template.name,
          description: '',
          isPublic: false,
          wallet: user.wallet,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to clone project');
      }
      const projectId = data.project.id;
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
                    thumbnail={t.thumbnail}
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