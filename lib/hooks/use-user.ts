"use client";

// Re-export the useUser hook from the context
export { useUser } from '../contexts/user-context';

// Also export the User type for backward compatibility
export type User = {
  id: string;
  wallet: string;
  name?: string | null;
  message?: string | null;
  signature?: string | null;
};