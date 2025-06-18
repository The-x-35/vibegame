"use client";

import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useState, useEffect } from "react";
import { Menu, X, Code, GamepadIcon, LayoutDashboardIcon as DashboardIcon } from "lucide-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { API_ENDPOINTS } from "@/global/constant";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import '@solana/wallet-adapter-react-ui/styles.css';

export default function Navbar() {
  const { user, isLoading } = useUser();
  const { connected, publicKey } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Create user in database when wallet is connected
  useEffect(() => {
    const createUser = async () => {
      if (connected && publicKey) {
        try {
          await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: publicKey.toString(),
              name: null
            }),
          });
        } catch (err) {
          console.error('Failed to create user:', err);
        }
      }
    };

    createUser();
  }, [connected, publicKey]);

  useEffect(() => {
    const fetchBalance = async (retryCount = 0) => {
      if (publicKey) {
        try {
          const connection = new Connection(API_ENDPOINTS.SOLANA_RPC_ENDPOINT);
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error("Error fetching balance:", error);
          // Retry up to 3 times with exponential backoff
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            setTimeout(() => fetchBalance(retryCount + 1), delay);
          }
        }
      }
    };

    fetchBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(() => fetchBalance(), 30000);
    return () => clearInterval(interval);
  }, [publicKey]);

  const navLinks = [
    { href: "/", label: "Game Builder", icon: <Code className="w-4 h-4 mr-2" /> },
    { href: "/games", label: "Games", icon: <GamepadIcon className="w-4 h-4 mr-2" /> },
  ];

  const authenticatedLinks: { href: string; label: string; icon: JSX.Element }[] = [
    // { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon className="w-4 h-4 mr-2" /> },
  ];

  // Handler to copy wallet address to clipboard and show feedback
  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get initials from wallet address
  const getInitials = () => {
    if (!publicKey) return "U";
    return publicKey.toString().substring(0, 2).toUpperCase();
  };

  // Generate DiceBear avatar URL using wallet address as seed
  const getAvatarUrl = () => {
    if (!publicKey) return "";
    return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${publicKey.toString()}`;
  };

  return (
    <header 
      className={`w-full z-50 transition-all duration-300 font-['Matrix_Sans_Video'] ${
        isScrolled 
          ? "bg-background/80 backdrop-blur-md border-b" 
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center justify-between">
          <Link href="/" className="z-50 font-['Matrix_Sans_Video']">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <div className="flex items-center">
              {navLinks.map((link) => (
                <div key={link.href} className="flex items-center space-x-0.5 mr-4">
                  <Button variant="ghost" disabled className="opacity-50 cursor-not-allowed">
                    <div className="flex items-center font-['Matrix_Sans_Video']">
                      {link.icon}
                      {link.label}
                    </div>
                  </Button>
                  <span className="text-[10px] bg-gray-500/20 text-gray-500 px-2 py-0.5 rounded-full font-matrix-sans-regular">
                    Coming Soon
                  </span>
                </div>
              ))}
              
              {connected && authenticatedLinks.map((link) => (
                <Button key={link.href} variant="ghost" asChild>
                  <Link href={link.href} className="flex items-center font-['Matrix_Sans_Video']">
                    {link.icon}
                    {link.label}
                  </Link>
                </Button>
              ))}
            </div>

            <div className="pl-4 ml-4 border-l flex items-center space-x-2">
              {isLoading ? (
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              ) : connected ? (
                <>
                  <div className="flex items-center space-x-2">
                    {balance !== null && (
                      <span className="text-sm font-medium bg-primary/10 px-2 py-1 rounded">
                        {balance.toFixed(4)} SOL
                      </span>
                    )}
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getAvatarUrl()} alt={publicKey?.toString()} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className="text-sm font-mono cursor-pointer select-all"
                      onClick={handleCopy}
                      title={copied ? 'Copied!' : 'Click to copy'}
                    >
                      {copied ? 'Copied!' : `${publicKey?.toString().slice(0,6)}...${publicKey?.toString().slice(-4)}`}
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Mobile Navigation Toggle */}
          <button 
            className="md:hidden z-50" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </nav>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex flex-col pt-20 pb-6 px-4 md:hidden">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <div key={link.href} className="flex items-center space-x-0.5">
                <Button 
                  variant="ghost" 
                  className="justify-start opacity-50 cursor-not-allowed" 
                  disabled
                >
                  <div className="flex items-center font-['Matrix_Sans_Video']">
                    {link.icon}
                    {link.label}
                  </div>
                </Button>
                <span className="text-[10px] bg-gray-500/20 text-gray-500 px-2 py-0.5 rounded-full font-matrix-sans-regular">
                  Coming Soon
                </span>
              </div>
            ))}
            
            {connected && authenticatedLinks.map((link) => (
              <Button 
                key={link.href} 
                variant="ghost" 
                className="justify-start" 
                asChild
                onClick={() => setIsOpen(false)}
              >
                <Link href={link.href} className="flex items-center font-['Matrix_Sans_Video']">
                  {link.icon}
                  {link.label}
                </Link>
              </Button>
            ))}
          </div>
          
          <div className="mt-auto">
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : connected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {balance !== null && (
                    <span className="text-sm font-medium bg-primary/10 px-2 py-1 rounded">
                      {balance.toFixed(4)} SOL
                    </span>
                  )}
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl()} alt={publicKey?.toString()} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="font-mono cursor-pointer select-all !text-[5px] leading-none"
                    onClick={handleCopy}
                    title={copied ? 'Copied!' : 'Click to copy'}
                  >
                    {copied ? 'Copied!' : `${publicKey?.toString().slice(0,6)}...${publicKey?.toString().slice(-4)}`}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}