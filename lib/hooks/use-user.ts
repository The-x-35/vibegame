"use client";

import { useState } from "react";

type User = {
  id: string;
  email?: string | null;
  profileImage?: string | null;
};

export function useUser() {
  // Temporary mock user state until auth is implemented
  const [user] = useState<User | null>(null);
  const [isLoading] = useState(false);

  return { user, isLoading };
}