import Link from "next/link";
import { ArrowRight, Book, Gamepad2, Coins, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocsPage() {
  const sections = [
    {
      title: "How to build a game?",
      description: "Learn the fundamentals of game development on VibeGame platform using our drag-and-drop interface.",
      href: "/docs/how-to-build-a-game",
      icon: <Book className="w-6 h-6" />,
    },
    {
      title: "Top 3 Games from VibeGame",
      description: "Explore the most popular and successful games created by our community.",
      href: "/docs/top-games",
      icon: <Gamepad2 className="w-6 h-6" />,
    },
    {
      title: "Token: $VIBEY",
      description: "Understand the tokenomics and utility of the $VIBEY token in the VibeGame ecosystem.",
      href: "/docs/token",
      icon: <Coins className="w-6 h-6" />,
    },
    {
      title: "Creator Fees for Gamecoins",
      description: "Learn how to earn creator fees from your game tokens and understand the monetization model.",
      href: "/docs/creator-fees-for-gamecoins",
      icon: <DollarSign className="w-6 h-6" />,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 font-matrix-sans-regular">
          VibeGame Documentation
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-matrix-sans-regular">
          Welcome to the VibeGame documentation. Here you&apos;ll find everything you need to build, deploy, and monetize games on the Solana blockchain.
        </p>
      </div>

      {/* Quick Start */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3 font-matrix-sans-regular">🚀 Quick Start</h2>
        <p className="text-muted-foreground mb-4">
          Ready to build your first game? Get started with our step-by-step guide.
        </p>
        <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
          <Link href="/docs/how-to-build-a-game">
            Start Building
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Documentation Sections */}
      <div className="grid gap-6">
        <h2 className="text-2xl font-semibold font-matrix-sans-regular">Documentation Sections</h2>
        {sections.map((section) => (
          <Link 
            key={section.href} 
            href={section.href}
            className="group block p-6 rounded-lg border border-border/50 hover:border-primary/20 transition-colors hover:bg-muted/20"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                {section.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors font-matrix-sans-regular">
                  {section.title}
                </h3>
                <p className="text-muted-foreground">
                  {section.description}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* Community */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4 font-matrix-sans-regular">Join Our Community</h2>
        <p className="text-muted-foreground mb-4">
          Connect with other developers, share your games, and get help from the VibeGame community.
        </p>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <a href="https://discord.com/invite/sendarcade" target="_blank" rel="noopener noreferrer">
              Discord
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="https://t.me/vibegamescreenerbot" target="_blank" rel="noopener noreferrer">
              Telegram Bot
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="https://x.com/vibegamefun" target="_blank" rel="noopener noreferrer">
              Twitter/X
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
} 