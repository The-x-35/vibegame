"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/use-user";
import { useWallet } from '@solana/wallet-adapter-react';
import { ProjectCard, type Project } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Gamepad2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateProjectDialog from "@/components/create-project-dialog";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { connected } = useWallet();
  const [projects, setProjects] = useState<Project[]>([]);
  const [v2Games, setV2Games] = useState<Array<{ id: string; name: string; description: string; index_key: string; created_at: string; updated_at: string }>>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !connected) {
      router.push("/");
    }
  }, [connected, isLoading, router]);

  useEffect(() => {
    if (!isLoading && user) {
      (async () => {
        setIsProjectsLoading(true);
        try {
          // fetch v2 games only
          const v2Res = await fetch(`/api/v2/games?wallet=${user.wallet}`);
          if (v2Res.ok) {
            const v2Data = await v2Res.json();
            setV2Games(v2Data.games || []);
          } else {
            setV2Games([]);
          }
        } catch (err) {
          console.error('Error fetching v2 games:', err);
          setV2Games([]);
        } finally {
          setIsProjectsLoading(false);
        }
      })();
    }
  }, [user, isLoading]);

  // Poll periodically to reflect immediate upserts from /editor
  useEffect(() => {
    if (!isLoading && user) {
      const interval = setInterval(async () => {
        try {
          const v2Res = await fetch(`/api/v2/games?wallet=${user.wallet}`);
          if (v2Res.ok) {
            const v2Data = await v2Res.json();
            setV2Games(v2Data.games || []);
          }
        } catch {}
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [user, isLoading]);

  // Optionally, you can update this to handle ca changes if needed, or remove if not required

  const getPublicProjects = () => projects.filter(p => p.ca);
  const getPrivateProjects = () => projects.filter(p => !p.ca);

  // Show loading state if checking user authentication
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only proceed if user is authenticated (redirect handled in useEffect)
  if (!connected) return null;

  return (
    <div className="h-screen w-screen container mx-auto px-4 py-10" style={{ backgroundImage: 'url(/bg.svg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground">Manage and monitor all your game projects</p>
          {user?.wallet && (
            <p className="mt-2 text-sm font-mono break-all">
              <span className="font-medium">Wallet:</span> {user.wallet}
            </p>
          )}
        </div>
        
        <CreateProjectDialog />
      </div>
      
      <Tabs defaultValue="v2" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="v2">AI Games</TabsTrigger>
        </TabsList>
        <TabsContent value="v2">
          {isProjectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden border border-border/50 shadow-sm animate-pulse">
                  <div className="h-48 bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded-md w-3/4" />
                    <div className="h-4 bg-muted rounded-md w-full" />
                    <div className="h-8 bg-muted rounded-md w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : v2Games.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {v2Games.map(g => (
                <div key={g.id} className="rounded-lg overflow-hidden border border-border/50 shadow-sm p-4 bg-card">
                  <div className="font-semibold text-lg mb-1">{g.name || g.id}</div>
                  <div className="text-sm text-muted-foreground mb-3 line-clamp-2">{g.description || 'AI web game'}</div>
                  <div className="flex gap-2">
                    <Button onClick={() => router.push(`/editor/${g.id}`)} size="sm">Open</Button>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${g.id}`)}>Open in Projects</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/20 rounded-lg border border-dashed">
              <h3 className="text-lg font-medium mb-2">No AI games yet</h3>
              <p className="text-muted-foreground mb-6">Use the AI editor to create your first web game.</p>
              <Button onClick={() => router.push('/editor')}>Open AI Editor</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}