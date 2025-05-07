"use client";

import Link from "next/link";
import { UserButton } from "@/components/user-button";
import { useUser } from "@/lib/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useState, useEffect } from "react";
import { Menu, X, Code, GamepadIcon, LayoutDashboardIcon as DashboardIcon } from "lucide-react";

export default function Navbar() {
  const { user, isLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home", icon: <Code className="w-4 h-4 mr-2" /> },
    { href: "/games", label: "Games", icon: <GamepadIcon className="w-4 h-4 mr-2" /> },
  ];

  const authenticatedLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon className="w-4 h-4 mr-2" /> },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-background/80 backdrop-blur-md border-b" 
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center justify-between">
          <Link href="/" className="z-50">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <div className="flex items-center space-x-1">
              {navLinks.map((link) => (
                <Button key={link.href} variant="ghost" asChild>
                  <Link href={link.href} className="flex items-center">
                    {link.icon}
                    {link.label}
                  </Link>
                </Button>
              ))}
              
              {user && authenticatedLinks.map((link) => (
                <Button key={link.href} variant="ghost" asChild>
                  <Link href={link.href} className="flex items-center">
                    {link.icon}
                    {link.label}
                  </Link>
                </Button>
              ))}
            </div>

            <div className="pl-4 ml-4 border-l">
              {isLoading ? (
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <UserButton />
              ) : (
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              )}
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
              <Button 
                key={link.href} 
                variant="ghost" 
                className="justify-start" 
                asChild
                onClick={() => setIsOpen(false)}
              >
                <Link href={link.href} className="flex items-center">
                  {link.icon}
                  {link.label}
                </Link>
              </Button>
            ))}
            
            {user && authenticatedLinks.map((link) => (
              <Button 
                key={link.href} 
                variant="ghost" 
                className="justify-start" 
                asChild
                onClick={() => setIsOpen(false)}
              >
                <Link href={link.href} className="flex items-center">
                  {link.icon}
                  {link.label}
                </Link>
              </Button>
            ))}
          </div>
          
          <div className="mt-auto">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserButton />
                </div>
              </div>
            ) : (
              <Button 
                className="w-full" 
                asChild
                onClick={() => setIsOpen(false)}
              >
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}