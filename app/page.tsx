"use client";

import { BuildInput } from "@/components/layout/build-input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code, Sparkles, Zap, Gamepad2, Star, Users, Copy } from "lucide-react";
import Link from "next/link";
import { ALPHA_GUI } from "@/global/constant";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/use-user";
import SuggestionCard from "@/components/suggestion-card";
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

// Template interface
interface Template {
  id: string;
  name: string;
  url: string;
  description: string;
  thumbnail?: string;
}

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [cloneDescription, setCloneDescription] = useState("");
  const [clonePublic, setClonePublic] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleCopy = () => {
    navigator.clipboard.writeText(ALPHA_GUI.SEND_TOKEN_CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (!response.ok) {
          throw new Error(`Failed to fetch templates: ${response.statusText}`);
        }
        const data: Template[] = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Clone form effect
  useEffect(() => {
    if (selectedTemplate) {
      setCloneName(selectedTemplate.name);
      setCloneDescription(selectedTemplate.description);
      setClonePublic(false);
    }
  }, [selectedTemplate]);

  const handleCreateFreshGame = async () => {
    // If user is not authenticated, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    setIsCloning(true);
    try {
      // Clone the "New" template (ID: 558aca0a-b28a-4ab1-baed-03cb966a4033)
      const response = await fetch('/api/projects/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: '558aca0a-b28a-4ab1-baed-03cb966a4033',
          name: 'My VibeGame',
          description: 'A fresh new game created with VibeGame',
          isPublic: false,
          wallet: user.wallet,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create fresh game');
      }

      const projectId = data.project.id;
      router.push(`/editor/${projectId}`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error creating fresh game');
    } finally {
      setIsCloning(false);
    }
  };

  const handleCloneTemplate = (template: Template) => {
    // If user is not authenticated, redirect to login
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
        throw new Error(data.error || 'Failed to clone template');
      }

      const projectId = data.project.id;
      setIsFormOpen(false);
      router.push(`/editor/${projectId}`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error cloning template');
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="relative">
      {/* Hero background with gradient effect */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-background/90" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              What do you want to{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                build today?
              </span>
            </h1>

            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="inline-block p-2 px-3 rounded-full bg-blue-500/10 border border-blue-500/20">
                <span className="text-sm bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  Low code solana, high speed innovation
                </span>
              </div>

              <div 
                onClick={handleCopy}
                className="inline-block p-2 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors group relative"
              >
                <span className="text-sm text-blue-400 flex items-center gap-2">
                  {ALPHA_GUI.SEND_TOKEN_CA}
                  <Copy className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                </span>
                {copied && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                    Copied!
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Transform your game ideas into reality with our low-code platform. Build, deploy, and share blockchain games without writing a single line of code.
            </p>
            
            <BuildInput className="mx-auto mb-8" />
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" asChild>
                <Link href="/games">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Explore Games
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="group" 
                onClick={handleCreateFreshGame}
                disabled={isCloning}
              >
                {isCloning ? 'Creating...' : 'Create Fresh VibeGame'}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
          
          {/* Templates Section */}
          <div className="max-w-6xl mx-auto mt-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                Game Templates
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose from our collection of game templates to start building your next masterpiece.
              </p>
            </div>
            
            {isTemplatesLoading ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <SuggestionCard
                    key={template.id}
                    embedUrl={`${ALPHA_GUI.EMBED_URL}?project_url=${encodeURIComponent(template.url)}`}
                    name={template.name}
                    description={template.description}
                    onOpen={() => handleCloneTemplate(template)}
                    buttonText="Use Template"
                    thumbnail={template.thumbnail}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-center md:text-left">
                <div className="font-bold text-2xl">20+</div>
                <div className="text-sm text-muted-foreground">Game Templates</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div className="text-center md:text-left">
                <div className="font-bold text-2xl">100s</div>
                <div className="text-sm text-muted-foreground">of Creators</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-green-500" />
              </div>
              <div className="text-center md:text-left">
                <div className="font-bold text-2xl">1000s</div>
                <div className="text-sm text-muted-foreground">of Games Built</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Describe Your Game</h3>
              <p className="text-muted-foreground">
                Simply tell us what kind of game you want to build using natural language.
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customize & Edit</h3>
              <p className="text-muted-foreground">
                Use our intuitive editor to customize game mechanics, graphics, and behaviors.
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Deploy & Share</h3>
              <p className="text-muted-foreground">
                Deploy your game on Solana with one click and share it with the world.
              </p>
            </div>
          </div>
        </div>
      </section>
      */}
        </div>
      </section>

      {/* Clone Template Dialog */}
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
    </div>
  );
}