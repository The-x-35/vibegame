"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import SuggestionCard from "@/components/suggestion-card";

interface BuildInputProps {
  placeholder?: string;
  className?: string;
}

export function BuildInput({ placeholder = "What do you want to build?", className = "" }: BuildInputProps) {
  const [focused, setFocused] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [staticSuggestions, setStaticSuggestions] = useState<string[]>([]);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<Array<{ name: string; description: string; url: string }>>([]);
  const [lastRequest, setLastRequest] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

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
      {dynamicSuggestions.length > 0 && (
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
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
                embedUrl={`https://alpha-gui.vercel.app/embed.html?autoplay&project_url=${encodeURIComponent(sugg.url)}`}
                name={sugg.name}
                description={sugg.description}
                onOpen={() =>
                  window.open(
                    `https://alpha-gui.vercel.app/?project_url=${encodeURIComponent(sugg.url)}`,
                    "_blank"
                  )
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 