"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
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
import { ALPHA_GUI } from '@/global/constant';

interface BuildInputProps {
  placeholder?: string;
  className?: string;
}

export function BuildInput({ placeholder = "Find with AI", className = "" }: BuildInputProps) {
  const [focused, setFocused] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [staticSuggestions, setStaticSuggestions] = useState<string[]>([]);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<Array<{ name: string; description: string; url: string; id: string }>>([]);
  const [lastRequest, setLastRequest] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useUser();
  const [selectedTemplate, setSelectedTemplate] = useState<{ name: string; description: string; url: string; id: string } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [cloneDescription, setCloneDescription] = useState("");
  const [clonePublic, setClonePublic] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  const gameTemplates = [
    "Make a Mario game",
    "Create a Space Shooter",
    "Build a Flappy Bird clone",
    "Make a Brick Breaker game",
    "Create an Endless Runner",
    "Build a 3D Ping Pong game",
    "Make a Hill Climb Racing game",
    "Create a Memory Card game",
    "Build a Whack-A-Mole game",
    "Make a Ball Game",
    "Create a Maze Game"
  ];

  const getRandomSuggestions = () => {
    const shuffled = [...gameTemplates].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setStaticSuggestions(getRandomSuggestions());
  }, []);

  // Pulse animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.classList.add("animate-pulse-subtle");
        setTimeout(() => {
          inputRef.current?.classList.remove("animate-pulse-subtle");
        }, 1000);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setCloneName(selectedTemplate.name);
      setCloneDescription(selectedTemplate.description);
      setClonePublic(false);
    }
  }, [selectedTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Store the current request to display above suggestions
    setLastRequest(input);
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      const data = await res.json();
      if (data.suggestions) {
        setDynamicSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  const handleCloneTemplate = (template: { name: string; description: string; url: string; id: string }) => {
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
    <div className={`w-full max-w-3xl transition-all duration-300 ${focused ? "scale-105" : "scale-100"} ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className={`relative rounded-xl border bg-card p-2 shadow-lg transition-all duration-200 ${focused ? "ring-2 ring-primary/50 border-primary/50" : "hover:border-primary/30"}`}>
          <div className="flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholder}
              className="flex-1 bg-transparent px-3 py-2 text-lg outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" className="ml-2 transition-all duration-200" disabled={isLoading || !input.trim()}>
              <Sparkles className="mr-2 h-4 w-4" />
              {isLoading ? "Loading..." : "Build"}
            </Button>
          </div>
          {/* Static Recommendations */}
          <div className="mt-3 px-3 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Try these:</p>
            <div className="flex flex-wrap gap-2">
              {staticSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary text-xs text-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
      {/* Dynamic Suggestion Cards */}
      {(dynamicSuggestions.length > 0 || isLoading) && (
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-white text-lg">Finding the best template for you...</p>
            </div>
          ) : (
            <>
              <h3 className="text-white text-xl font-medium mb-4">Recommended Templates</h3>
              {lastRequest && (
                <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="text-gray-300 text-sm mb-1">Your request:</h4>
                  <p className="text-white font-mono text-sm">{lastRequest}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dynamicSuggestions.map((sugg, idx) => (
                  <SuggestionCard
                    key={idx}
                    embedUrl={`${ALPHA_GUI.EMBED_URL}?project_url=${encodeURIComponent(sugg.url)}`}
                    name={sugg.name}
                    description={sugg.description}
                    onOpen={() => handleCloneTemplate(sugg)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

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
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isCloning}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isCloning}>
                {isCloning ? "Cloning..." : "Clone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}