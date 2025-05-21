"use client";

import { BuildInput } from "@/components/layout/build-input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code, Sparkles, Zap, Gamepad2, Star, Users, Copy } from "lucide-react";
import Link from "next/link";
import { ALPHA_GUI } from "@/global/constant";
import { useState } from "react";

export default function Home() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ALPHA_GUI.SEND_TOKEN_CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                className="inline-block p-2 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors group"
              >
                <span className="text-sm text-blue-400 flex items-center gap-2">
                  {ALPHA_GUI.SEND_TOKEN_CA}
                  <Copy className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                </span>
                {copied && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs">
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
              <Button size="lg" variant="outline" className="group" asChild>
                <Link href="/login">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
          
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
      
      {/* Features Section */}
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
    </div>
  );
}