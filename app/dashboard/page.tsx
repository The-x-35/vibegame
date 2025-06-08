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

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { connected } = useWallet();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !connected) {
      router.push("/");
    }
  }, [connected, isLoading, router]);

  useEffect(() => {
    // Fetch the authenticated user's projects from the API
    if (!isLoading && user) {
      (async () => {
        setIsProjectsLoading(true);
        try {
          const response = await fetch(`/api/projects?wallet=${user.wallet}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
          }
          const data = await response.json();
          // Map API rows to Project type
          const fetched: Project[] = data.projects.map((p: any) => ({
            id: p.id,
            url: p.url,
            name: p.name,
            description: p.description,
            isPublic: p.is_public,
            createdAt: new Date(p.created_at),
            updatedAt: new Date(p.updated_at),
            thumbnail: undefined,
          }));
          setProjects(fetched);
        } catch (err) {
          console.error('Error fetching user projects:', err);
        } finally {
          setIsProjectsLoading(false);
        }
      })();
    }
  }, [user, isLoading]);

  const handleToggleVisibility = async (id: string, isPublic: boolean) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPublic }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update project visibility');
      }
      const updated = data.project;
      setProjects(prev => prev.map(p =>
        p.id === updated.id
          ? { ...p, isPublic: updated.is_public, updatedAt: new Date(updated.updated_at) }
          : p
      ));
    } catch (err) {
      console.error('Failed to update project visibility', err);
      alert(err instanceof Error ? err.message : 'Error updating project');
    }
  };

  const getPublicProjects = () => projects.filter(p => p.isPublic);
  const getPrivateProjects = () => projects.filter(p => !p.isPublic);

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
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <p className="text-muted-foreground">Manage and monitor all your game projects</p>
          {user?.wallet && (
            <p className="mt-2 text-sm font-mono break-all">
              <span className="font-medium">Wallet:</span> {user.wallet}
            </p>
          )}
        </div>
        
        <CreateProjectDialog />
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
          <TabsTrigger value="private">Private</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {isProjectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => (
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
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onToggleVisibility={handleToggleVisibility}
                  onClick={() => router.push(`/projects/${project.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/20 rounded-lg border border-dashed">
              <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">Start by creating your first game project</p>
              <CreateProjectDialog />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="public">
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
          ) : getPublicProjects().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getPublicProjects().map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onToggleVisibility={handleToggleVisibility}
                  onClick={() => router.push(`/projects/${project.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/20 rounded-lg border border-dashed">
              <h3 className="text-lg font-medium mb-2">No public projects</h3>
              <p className="text-muted-foreground mb-6">
                Make one of your projects public to share it with the world.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="private">
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
          ) : getPrivateProjects().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getPrivateProjects().map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onToggleVisibility={handleToggleVisibility}
                  onClick={() => router.push(`/projects/${project.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/20 rounded-lg border border-dashed">
              <h3 className="text-lg font-medium mb-2">No private projects</h3>
              <p className="text-muted-foreground mb-6">
                All your projects are currently set to public.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}