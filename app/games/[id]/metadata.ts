import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `VibeGame - Play and Share Games on Solana`,
    authors: [{ name: 'VibeGame', url: 'https://vibegame.fun' }],
    description: 'Build and share games using blocks on Solana.',
    icons: {
      icon: '/favicon.svg',
    },
    openGraph: {
      title: "VibeGame - Play and Share Games on Solana",
      description: "Build and share games using blocks on Solana.",
      siteName: "VibeGame",
      images: [{
        url: `https://vibegame.fun/og/og2.png`,
        width: 1200,
        height: 630,
        alt: "VibeGame",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: "VibeGame - Play and Share Games on Solana",
      description: "Build and share games using blocks on Solana.",
      images: [`https://vibegame.fun/og/og2.png`],
    },
    metadataBase: new URL("https://vibegame.fun"),
  };
} 