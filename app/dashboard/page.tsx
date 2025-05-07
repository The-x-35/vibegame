"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/use-user";
import { ProjectCard, type Project } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Gamepad2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Simulating fetching projects from the database
    // In a real app, you would fetch from your API
    setTimeout(() => {
      const dummyProjects: Project[] = [
        {
          id: "1",
          name: "Space Adventure",
          description: "A thrilling space shooter game with multiple levels and power-ups.",
          isPublic: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          thumbnail: "https://images.pexels.com/photos/1274260/pexels-photo-1274260.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
        },
        {
          id: "2",
          name: "Platformer Challenge",
          description: "Jump and run through challenging obstacles in this platformer game.",
          isPublic: false,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          thumbnail: "https://images.pexels.com/photos/371924/pexels-photo-371924.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
        },
        {
          id: "3",
          name: "Puzzle Master",
          description: "Test your brain with this challenging puzzle collection.",
          isPublic: true,
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: "4",
          name: "Racing Rivals",
          description: "Compete against AI or friends in this fast-paced racing game.",
          isPublic: false,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          thumbnail: "https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
        },
      ];

      setProjects(dummyProjects);
      setIsProjectsLoading(false);
    }, 1000);
  }, []);

  const handleToggleVisibility = (id: string, isPublic: boolean) => {
    // In a real app, you would call your API to update the project
    setProjects(projects.map(project => 
      project.id === id ? { ...project, isPublic } : project
    ));
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
  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <p className="text-muted-foreground">Manage and monitor all your game projects</p>
        </div>
        
        <Button size="lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Project
        </Button>
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
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/20 rounded-lg border border-dashed">
              <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">Start by creating your first game project</p>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Project
              </Button>
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