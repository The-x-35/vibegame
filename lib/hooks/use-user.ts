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
      if (connected && publicKey) {
        try {
          const response = await fetch(`/api/users?wallet=${publicKey.toString()}`);
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('Failed to fetch user:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [connected, publicKey, pathname]);

  return { user, isLoading };
}