"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Book, Gamepad2, Coins, DollarSign } from "lucide-react";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const sections = [
    {
      title: "How to build a game?",
      href: "/docs/how-to-build-a-game",
      icon: <Book className="w-4 h-4" />,
    },
    {
      title: "Top 3 Games from VibeGame",
      href: "/docs/top-games",
      icon: <Gamepad2 className="w-4 h-4" />,
    },
    {
      title: "Token: $VIBEY",
      href: "/docs/token",
      icon: <Coins className="w-4 h-4" />,
    },
    {
      title: "Creator Fees for Gamecoins",
      href: "/docs/creator-fees-for-gamecoins",
      icon: <DollarSign className="w-4 h-4" />,
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: 'url(/bg.svg)',
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
                <h2 className="font-bold text-lg mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 font-matrix-sans-regular">
                  Documentation
                </h2>
                <nav className="space-y-2">
                  <Link
                    href="/docs"
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted/50 ${
                      pathname === "/docs" 
                        ? "bg-primary/10 text-primary border border-primary/20" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Book className="w-4 h-4" />
                    Overview
                  </Link>
                  {sections.map((section) => (
                    <Link
                      key={section.href}
                      href={section.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted/50 ${
                        pathname === section.href 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {section.icon}
                      {section.title}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 