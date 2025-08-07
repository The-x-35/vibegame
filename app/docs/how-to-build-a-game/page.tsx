import Link from "next/link";
import { ArrowRight, Play, Upload, Settings, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HowToBuildGamePage() {
  const steps = [
    {
      number: "01",
      title: "Choose a Template",
      description: "Start with one of our pre-built game templates or create from scratch.",
      icon: <Upload className="w-6 h-6" />,
      details: [
        "Browse our template library on the homepage",
        "Click 'Use Template' on your preferred game",
        "Each template is fully customizable and ready to edit"
      ]
    },
    {
      number: "02", 
      title: "Design Your Game",
      description: "Use our drag-and-drop editor to customize your game mechanics and visuals.",
      icon: <Settings className="w-6 h-6" />,
      details: [
        "Add sprites, backgrounds, and sound effects",
        "Add optional transaction blocks"
      ]
    },
    {
      number: "03",
      title: "Test & Preview",
      description: "Play your game to ensure everything works as expected.",
      icon: <Play className="w-6 h-6" />,
      details: [
        "Use the built-in preview functionality",
        "Test all game mechanics and interactions"
      ]
    },
    {
      number: "04",
      title: "Deploy & Share",
      description: "Publish your game to the VibeGame platform and mint it as an NFT.",
      icon: <Rocket className="w-6 h-6" />,
      details: [
        "Click 'Deploy Project' to make your game public",
        "Your game name will be your sub-domain on VibeGame",
        "Set up tokenomics with your token launch powered by SendShot",
        "Share your game with the community"
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 font-matrix-sans-regular">
          How to Build a Game
        </h1>
        <p className="text-lg text-muted-foreground font-matrix-sans-regular">
          Learn how to create amazing games on VibeGame using our intuitive drag-and-drop interface. No coding experience required!
        </p>
        
        {/* Video Explanation */}
        <div className="flex justify-center mt-6">
          <div className="w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4 text-center font-matrix-sans-regular">
              🎥 Watch: How to Build Games on VibeGame
            </h3>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/uJyzvX8Aw6I"
                  title="How to Build Games on VibeGame - Tutorial"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-3">
              Complete video tutorial showing the game building process step by step
            </p>
          </div>
        </div>

        {/* Second Video */}
        <div className="flex justify-center mt-8">
          <div className="w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4 text-center font-matrix-sans-regular">
              🎮 Additional Game Development Tips
            </h3>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/eCrPTSC7roo"
                  title="Additional Game Development Tips"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-3">
              Learn more advanced techniques and tips for game development
            </p>
          </div>
        </div>
      </div>

      {/* Quick Start CTA */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3 font-matrix-sans-regular">🎮 Ready to Start?</h2>
        <p className="text-muted-foreground mb-4">
          Jump right in and start building your first game with our templates.
        </p>
        <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
          <Link href="/">
            Browse Templates
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Step-by-step Guide */}
      <div className="space-y-8">
        <h2 className="text-2xl font-semibold font-matrix-sans-regular">Step-by-Step Guide</h2>
        
        {steps.map((step, index) => (
          <div key={step.number} className="relative">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="absolute left-6 top-16 w-0.5 h-20 bg-gradient-to-b from-blue-500 to-purple-500 opacity-30" />
            )}
            
            <div className="flex gap-6">
              {/* Step number and icon */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {step.number}
                </div>
                <div className="mt-4 p-2 rounded-lg bg-primary/10 text-primary">
                  {step.icon}
                </div>
              </div>
              
              {/* Step content */}
              <div className="flex-1 pb-8">
                <h3 className="text-xl font-semibold mb-2 font-matrix-sans-regular">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {step.description}
                </p>
                <ul className="space-y-2">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start gap-2 text-sm">
                      <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Game Development Tips */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-6 font-matrix-sans-regular">Pro Tips for Game Development</h2>
        <div className="grid gap-4">
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <h3 className="font-semibold mb-2 font-matrix-sans-regular">🎯 Start Simple</h3>
            <p className="text-sm text-muted-foreground">
              Begin with a simple game concept and gradually add complexity. Even the most successful games started with basic mechanics.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <h3 className="font-semibold mb-2 font-matrix-sans-regular">🔄 Iterate Quickly</h3>
            <p className="text-sm text-muted-foreground">
              Use the preview feature frequently to test your changes. Quick iterations help you identify and fix issues early.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <h3 className="font-semibold mb-2 font-matrix-sans-regular">👥 Get Feedback</h3>
            <p className="text-sm text-muted-foreground">
              Share your game with the community early and often. Player feedback is invaluable for improving your game.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <h3 className="font-semibold mb-2 font-matrix-sans-regular">💰 Monetization</h3>
            <p className="text-sm text-muted-foreground">
              Consider integrating you token into game and you will collect a good amount in fees.
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4 font-matrix-sans-regular">Next Steps</h2>
        <div className="grid gap-4">
          <Link href="/docs/top-games" className="group block p-4 rounded-lg border border-border/50 hover:border-primary/20 transition-colors hover:bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors font-matrix-sans-regular">
                  Explore Top Games
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get inspired by successful games in our ecosystem
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
          <Link href="/docs/token" className="group block p-4 rounded-lg border border-border/50 hover:border-primary/20 transition-colors hover:bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors font-matrix-sans-regular">
                  Learn About $VIBEY
                </h3>
                <p className="text-sm text-muted-foreground">
                  Understand tokenomics and monetization opportunities
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 