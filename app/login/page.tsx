"use client";

import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Mail, Wallet } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    // Implement login logic here later
    router.push("/dashboard");
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card rounded-xl shadow-xl border overflow-hidden">
          <div className="px-6 py-8 text-center sm:px-8">
            <div className="mb-6 flex justify-center">
              <Logo size="lg" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Welcome to VibeGame</h1>
            <p className="text-muted-foreground mb-8">
              Sign in to start building amazing games on Solana
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={handleLogin} 
                size="lg" 
                className="w-full gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Mail className="w-5 h-5" />
                Continue with Email
              </Button>
              
              <Button 
                onClick={handleLogin}
                variant="outline"
                size="lg"
                className="w-full gap-2"
              >
                <Wallet className="w-5 h-5" />
                Connect Wallet
              </Button>
            </div>
            
            <p className="mt-6 text-center text-sm text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}