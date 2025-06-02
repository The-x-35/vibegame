import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGameUrl(gameId: string): string {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const isLocalhost = hostname === 'localhost';
    const isVibegameFun = hostname.includes('vibegame.fun');
    
    // If we're already on a subdomain, keep the current protocol and hostname
    if (isLocalhost || isVibegameFun) {
      const protocol = window.location.protocol;
      const baseHost = isLocalhost ? `localhost${port ? `:${port}` : ''}` : 'vibegame.fun';
      return `${protocol}//${gameId}.${baseHost}`;
    }
  }
  
  // Fallback to the regular route
  return `/games/${gameId}`;
}
