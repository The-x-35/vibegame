"use client";

import { BuildInput } from "@/components/layout/build-input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code, Sparkles, Zap, Gamepad2, Star, Users, Copy } from "lucide-react";
import Link from "next/link";
import { ALPHA_GUI } from "@/global/constant";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/use-user";
import SuggestionCard from "@/components/suggestion-card";
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useToast } from '@/components/ui/use-toast';

// Template interface
interface Template {
  id: string;
  name: string;
  url: string;
  description: string;
  thumbnail?: string;
}

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const router = useRouter();
  const { user } = useUser();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(ALPHA_GUI.SEND_TOKEN_CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (!response.ok) {
          throw new Error(`Failed to fetch templates: ${response.statusText}`);
        }
        const data: Template[] = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleCreateFreshGame = async () => {
    // If user is not authenticated, redirect to login
    if (!user) {
      setVisible(true);
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsCloning(true);
    try {
      // Clone the "New" template (ID: 6c489184-69ab-402d-b335-b70a03d38349)
      const response = await fetch('/api/projects/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: '6c489184-69ab-402d-b335-b70a03d38349',
          name: 'My VibeGame',
          description: 'A fresh new game created with VibeGame',
          isPublic: false,
          wallet: user.wallet,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create fresh game');
      }

      const projectId = data.project.id;
      router.push(`/editor/${projectId}`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error creating fresh game');
    } finally {
      setIsCloning(false);
    }
  };

  const handleCloneTemplate = async (template: Template) => {
    // If user is not authenticated, redirect to login
    if (!user) {
      setVisible(true);
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsCloning(true);
    try {
      const response = await fetch('/api/projects/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: template.id,
          name: template.name,
          description: '',
          isPublic: false,
          wallet: user.wallet,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to clone template');
      }

      const projectId = data.project.id;
      router.push(`/editor/${projectId}`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error cloning template');
    } finally {
      setIsCloning(false);
    }
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
            What do you want to{" "}
            <span className="bg-clip-text text-transparent" style={{
              background: 'linear-gradient(to right, #EE00FF 0%, #EE5705 66%, #EE05E7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              build today?
            </span>
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-xl mx-auto font-matrix-sans-regular">
          CREATE AND SHARE your blockchain game ideas into reality without writing a single line of code.
          </p>
        </div>
        
        <div className="flex items-start justify-center pt-4">
          <BuildInput className="mx-auto opacity-80" />
        </div>
        
        <div className="w-full max-w-4xl mx-auto text-center px-4 mt-8">
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="default" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 font-matrix-sans-regular text-sm" asChild>
              <Link href="/games">
                <Sparkles className="mr-2 h-4 w-4" />
                Explore Games
              </Link>
            </Button>
            <Button 
              size="default" 
              variant="outline" 
              className="group font-matrix-sans-regular text-sm" 
              onClick={handleCreateFreshGame}
              disabled={isCloning}
            >
              {isCloning ? 'Creating...' : 'Create Fresh VibeGame'}
              <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
                </div>
      </section>
      
      {/* Templates Section */}
      <section className="py-8">
        <div className="container px-4 mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 font-matrix-sans-regular">
                Community Games
              </h2>

            </div>
            
            {isTemplatesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden border border-border/50 shadow-sm">
                    <div className="h-48 bg-muted animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-muted animate-pulse rounded-md w-3/4" />
                      <div className="h-4 bg-muted animate-pulse rounded-md w-full" />
                      <div className="h-8 bg-muted animate-pulse rounded-md w-full mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-transparent">
                {templates.map((template) => (
                  <SuggestionCard
                    key={template.id}
                    embedUrl={`${ALPHA_GUI.EMBED_URL}?project_url=${encodeURIComponent(template.url)}`}
                    name={template.name}
                    description={template.description}
                    onOpen={() => handleCloneTemplate(template)}
                    buttonText="Use Template"
                    thumbnail={template.thumbnail}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}