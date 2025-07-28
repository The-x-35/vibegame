"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useWallet } from '@solana/wallet-adapter-react';
import { randomBytes } from "crypto";
import { getAuthToken, loginWithWallet } from "../auth-utils";
import bs58 from "bs58";

// Define the shape of authenticated user in the app
type User = {
  id: string;
  wallet: string;
  name?: string | null;
  message?: string | null;
  signature?: string | null;
};

// Define the context value type
type UserContextType = {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  signMessage: ((message: Uint8Array) => Promise<Uint8Array | null>) | undefined;
};

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { connected, publicKey, signMessage } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    console.log('UserProvider - Current state:', {
      connected,
      publicKey: publicKey?.toString()
    });

    if (connected && publicKey) {
      try {
        console.log('Fetching user data for wallet:', publicKey.toString());

        const authToken = getAuthToken();
        console.log("getAuthToken", authToken);

        if (authToken) {
          // User has a valid token, fetch user data
          console.log('Valid auth token found, fetching user data');
          try {
            const response = await fetch(`/api/users?wallet=${encodeURIComponent(publicKey.toString())}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              setUser({
                id: data.user.id || publicKey.toString(),
                wallet: data.user.wallet,
                name: data.user.name || null,
                message: null,
                signature: null
              });
            } else {
              // Token might be invalid, trigger re-authentication
              throw new Error('Failed to fetch user data with token');
            }
          } catch (tokenError) {
            console.log('Token validation failed, will try to re-authenticate:', tokenError);
            // Fall through to re-authentication
            const message = `sign to login. wallet: ${publicKey.toString()}, nonce: ${randomBytes(16).toString('hex')}, ts: ${Date.now()}`;
            const signature = await signMessage?.(new TextEncoder().encode(message));
            const loginResponse = await loginWithWallet(publicKey.toString(), message, bs58.encode(signature!));
            setUser({
              id: loginResponse.user.id,
              wallet: loginResponse.user.wallet,
              name: loginResponse.user.name || null,
              message,
              signature: bs58.encode(signature!)
            });
          }
        } else {
          // No auth token, sign message and login
          console.log("No auth token found, initiating login");
          const message = `sign to login. wallet: ${publicKey.toString()}, nonce: ${randomBytes(16).toString('hex')}, ts: ${Date.now()}`;
          const signature = await signMessage?.(new TextEncoder().encode(message));
          const loginResponse = await loginWithWallet(publicKey.toString(), message, bs58.encode(signature!));
          setUser({
            id: loginResponse.user.id,
            wallet: loginResponse.user.wallet,
            name: loginResponse.user.name || null,
            message,
            signature: bs58.encode(signature!)
          });
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

  useEffect(() => {
    fetchUser();
  }, [connected, publicKey, pathname]);

  const contextValue: UserContextType = {
    user,
    isLoading,
    refreshUser: fetchUser,
    signMessage: signMessage,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// Hook to use the context
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 