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
    <div className="flex flex-col items-center justify-center h-screen px-4 text-center relative">
      <Image
        src="/coming-soon/1.png"
        alt="Background 1"
        width={900}
        height={900}
        className="absolute top-0 left-0 z-0 w-[280px] md:w-[900px]"
        priority
      />
      <Image
        src="/coming-soon/2.png"
        alt="Background 2"
        width={420}
        height={400}
        className="absolute bottom-0 left-0 z-0 w-[160px] md:w-[420px]"
        priority
      />
      <Image
        src="/coming-soon/3.png"
        alt="Background 3"
        width={400}
        height={400}
        className="absolute top-0 right-0 z-0 w-[150px] md:w-[400px]"
        priority
      />
      <Image
        src="/coming-soon/4.png"
        alt="Background 4"
        width={700}
        height={700}
        className="absolute bottom-0 right-0 z-0 w-[260px] md:w-[700px]"
        priority
      />
      <div className="flex flex-col items-center space-y-6 md:space-y-8 max-w-2xl mx-auto relative z-10">
        <Image
          src="/coming-soon/logo.png"
          alt="Logo"
          width={150}
          height={150}
          className="w-[100px] md:w-[150px]"
          priority
        />
        <h1 className="text-3xl md:text-5xl font-bold text-white font-['Matrix_Sans_Print'] text-center">
          gamecoin szn on solana
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-semibold font-['Matrix_Sans_Screen'] text-center">
          Coming Soon
        </h2>

        <div 
          onClick={handleCopy}
          className="inline-block p-2 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors group relative mx-auto w-full max-w-[90vw] md:max-w-fit"
        >
          <span className="text-xs md:text-sm text-white flex items-center justify-center gap-2 break-all text-center">
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
      <Image
        src="/coming-soon/footer.svg"
        alt="Footer"
        width={300}
        height={200}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-0 w-[200px] md:w-[300px]"
        priority
      />
    </div>
  );
} 