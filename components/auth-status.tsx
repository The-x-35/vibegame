'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAuthToken, isAuthenticated } from '@/lib/auth-utils';
import { Badge } from '@/components/ui/badge';

export function AuthStatus() {
  const { connected, publicKey } = useWallet();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        setAuthStatus('authenticated');
      } else {
        setAuthStatus('unauthenticated');
      }
    };

    checkAuth();
    // Check auth status every 5 seconds
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Wallet Disconnected</Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline">
        Wallet: {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
      </Badge>
      <Badge variant={authStatus === 'authenticated' ? 'default' : 'destructive'}>
        {authStatus === 'loading' ? 'Checking...' : 
         authStatus === 'authenticated' ? 'Authenticated' : 'Not Authenticated'}
      </Badge>
    </div>
  );
} 