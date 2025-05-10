"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";

// Define the shape of the decoded application JWT payload
interface AppTokenPayload {
  sub: string; // email
  userId: string;
  wallet: string;
  exp?: number;
  iat?: number;
}

// Define the shape of authenticated user in the app
type User = {
  id: string;
  email: string;
  wallet: string;
};

export function useUser() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('appToken') : null;
    if (token) {
      try {
        // Decode our app token
        const decoded = jwtDecode<AppTokenPayload>(token);
        // Check expiration
        if (!decoded.exp || decoded.exp * 1000 > Date.now()) {
          setUser({ id: decoded.userId, email: decoded.sub, wallet: decoded.wallet });
        } else {
          localStorage.removeItem('appToken');
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to decode token in useUser:', err);
        localStorage.removeItem('appToken');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [pathname]);

  return { user, isLoading };
}