"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Share2, 
  ArrowLeft, 
  Github, 
  Twitter, 
  Linkedin, 
  Copy,
  CalendarIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Project } from "@/components/project-card";

export default function ProjectPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Simulate fetching project from the database
    setTimeout(() => {
      // Only public projects should be accessible on this page
      const dummyProject: Project = {
        id,
        name: "Space Adventure",
        description: "A thrilling space shooter game with multiple levels and power-ups. Navigate through asteroid fields, fight enemy ships, and collect power-ups to upgrade your spaceship. Features include dynamic difficulty scaling, boss battles, and a high score system.",
        isPublic: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        thumbnail: "https://images.pexels.com/photos/1274260/pexels-photo-1274260.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
      };
      
      setProject(dummyProject);
      setIsLoading(false);
    }, 1000);
  }, [id]);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/projects/${id}`
    : `https://vibegame.io/projects/${id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project || !project.isPublic) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-lg overflow-hidden border shadow-sm bg-card">
            {/* Project Preview/Embed */}
            <div className="aspect-video bg-muted relative overflow-hidden">
              {project.thumbnail ? (
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${project.thumbnail})` }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/30 to-primary/10">
                  <span className="text-3xl font-bold text-foreground/30">{project.name.substring(0, 2).toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Project Content */}
            <div className="p-6">
              <h1 className="text-3xl font-bold mb-4">{project.name}</h1>
              <p className="text-muted-foreground mb-6">{project.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Created {formatDistanceToNow(project.createdAt)} ago
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <UserIcon className="h-4 w-4 mr-2" />
                  By Username
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="flex-1">
                  Launch Project
                </Button>
                <Button size="lg" variant="outline" className="flex-1">
                  View Source
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {/* Share Card */}
          <div className="rounded-lg border shadow-sm bg-card p-6 sticky top-20">
            <h3 className="text-lg font-semibold mb-4">Share Project</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-muted rounded-l-md text-sm border-r-0"
                />
                <Button
                  variant="outline"
                  className="rounded-l-none"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <span className="sr-only">Copied!</span>
                      <span className="text-green-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy</span>
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                  <Github className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">Embed</h3>
              <div className="bg-muted p-3 rounded-md text-xs font-mono text-muted-foreground mb-3 overflow-x-auto">
                {`<iframe src="${shareUrl}/embed" width="100%" height="400" frameborder="0"></iframe>`}
              </div>
              <Button variant="secondary" size="sm" onClick={() => {
                navigator.clipboard.writeText(
                  `<iframe src="${shareUrl}/embed" width="100%" height="400" frameborder="0"></iframe>`
                );
              }}>
                Copy Embed Code
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}