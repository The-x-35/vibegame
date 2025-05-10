"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';
import { Logo } from "@/components/ui/logo";
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { Button } from "@/components/ui/button";
import { Mail, Wallet } from "lucide-react";

// Define payload type for our app token
interface AppTokenPayload {
  sub: string;
  userId: string;
  wallet: string;
  exp?: number;
  iat?: number;
}

export default function LoginPage() {
  const router = useRouter();
  const [appToken, setAppToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<AppTokenPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // On mount, check for token in local storage
  useEffect(() => {
    const stored = localStorage.getItem('appToken');
    if (stored) {
      try {
        const decoded = jwtDecode<AppTokenPayload>(stored);
        if (!decoded.exp || decoded.exp * 1000 > Date.now()) {
          setAppToken(stored);
          setUserData(decoded);
          router.push('/dashboard');
        } else localStorage.removeItem('appToken');
      } catch {
        localStorage.removeItem('appToken');
      }
    }
  }, [router]);

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    setError(null);
    setIsLoading(true);
    if (!response.credential) {
      setError('Google credential not received'); setIsLoading(false); return;
    }
    try {
      const res = await fetch('https://mrgbnbr5uk.execute-api.eu-central-1.amazonaws.com/auth/google/verify', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${response.credential}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP error ${res.status}`);
      const token = data.token;
      setAppToken(token);
      localStorage.setItem('appToken', token);
      const decoded = jwtDecode<AppTokenPayload>(token);
      setUserData(decoded);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Sign-in failed');
    } finally { setIsLoading(false); }
  };

  const handleGoogleError = () => { setError('Google Login Failed'); };

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
              {isLoading ? (
                <p>Signing in...</p>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                />
              )}
            </div>
            
            <p className="mt-6 text-center text-sm text-muted-foreground">
              By continuing, you agree to our <a href="/terms" className="underline hover:text-foreground">Terms of Service</a> and <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}