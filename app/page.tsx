"use client";

import { BuildInput } from "@/components/layout/build-input";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy } from "lucide-react";
import Link from "next/link";
import { ALPHA_GUI } from "@/global/constant";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/use-user";
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useToast } from '@/components/ui/use-toast';


export default function Home() {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(ALPHA_GUI.SEND_TOKEN_CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };





  return (
    <div className="relative">
      {/* Hero background with hero.svg */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: 'url(/hero.svg)',
          }}
        />
      </div>

            {/* Hero Section */}
      <section className="flex flex-col">
        <div className="w-full max-w-4xl mx-auto text-center px-4 pt-8">
          <div className="flex flex-col items-center gap-3 mb-4">
            <div 
              onClick={handleCopy}
              className="inline-block p-1 px-2 rounded-full bg-blue-500/10 border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors group relative"
            >
              <span className="text-xs text-blue-400 flex items-center gap-1 font-matrix-sans-regular">
                {ALPHA_GUI.SEND_TOKEN_CA}
                <Copy className="h-3 w-3 text-blue-400 group-hover:scale-110 transition-transform" />
              </span>
              {copied && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  Copied!
                </span>
              )}
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight font-matrix-sans-regular">
            what{" "}
            <span className="bg-clip-text text-transparent" style={{
              background: 'linear-gradient(to right, #EE00FF 0%, #EE5705 66%, #EE05E7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              games
            </span>
            {" "}you wanna{" "}
            <span className="bg-clip-text text-transparent" style={{
              background: 'linear-gradient(to right, #EE00FF 0%, #EE5705 66%, #EE05E7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              build
            </span>
            {" "}today?
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-xl mx-auto font-matrix-sans-regular">
          Build your own games with drag and drop. No code needed.
          </p>
        </div>
        
        <div className="flex items-start justify-center pt-4">
          <BuildInput className="mx-auto opacity-80" />
        </div>
        
        <div className="w-full max-w-4xl mx-auto text-center px-4 mt-8">
          <div className="flex flex-wrap justify-center gap-3">
            <Button 
              size="default" 
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 font-matrix-sans-regular text-sm" 
              asChild
            >
              <Link href="/editor">
                <Sparkles className="mr-2 h-4 w-4" />
                Open AI Editor
              </Link>
            </Button>
          </div>
                </div>
      </section>
      
    </div>
  );
}