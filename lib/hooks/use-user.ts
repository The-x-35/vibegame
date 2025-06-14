"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useWallet } from '@solana/wallet-adapter-react';

// Define the shape of authenticated user in the app
type User = {
  id: string;
  wallet: string;
  name?: string | null;
};

export function useUser() {
  const pathname = usePathname();
  const { connected, publicKey } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      console.log('useUser hook - Current state:', {
        connected,
        publicKey: publicKey?.toString()
      });

      if (connected && publicKey) {
        try {
          console.log('Fetching user data for wallet:', publicKey.toString());
          const response = await fetch(`/api/users?wallet=${publicKey.toString()}`);
          if (response.ok) {
            const data = await response.json();
            console.log('User data fetched successfully:', data.user);
            setUser(data.user);
          } else {
            console.log('Failed to fetch user data:', response.status);
            setUser(null);
          }
        } catch (err) {
          console.error('Error fetching user:', err);
          setUser(null);
        }
      } else {
        console.log('Wallet not connected or no public key');
        setUser(null);
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [connected, publicKey, pathname]);

  return { user, isLoading };
}