"use client";

import { useEffect } from 'react';

interface EditorRedirectProps {
  url: string;
}

export default function EditorRedirect({ url }: EditorRedirectProps) {
  useEffect(() => {
    window.open(url, '_blank');
  }, [url]);

  return null;
} 