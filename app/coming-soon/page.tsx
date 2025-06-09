"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Copy } from "lucide-react";
import { ALPHA_GUI } from "@/global/constant";
import { useState } from "react";

export default function ComingSoon() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ALPHA_GUI.SEND_TOKEN_CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="flex flex-col items-center space-y-8 max-w-2xl mx-auto">
        <h1 className="text-5xl font-bold text-white">
          gamecoin szn on solana
        </h1>
        
        <h2 className="text-3xl font-semibold">
          Coming Soon
        </h2>

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

        <div className="flex flex-col items-center space-y-4 pt-8">
          <span className="text-muted-foreground">Powered by</span>
          <div className="flex flex-col items-center space-y-2">
            <Image 
              src="/sa-logo.svg" 
              alt="Send Arcade Logo" 
              width={128}
              height={128}
              priority
              className="w-32 h-32"
            />
            <span className="text-lg font-medium text-white">Send Arcade</span>
          </div>
        </div>
      </div>
    </div>
  );
} 