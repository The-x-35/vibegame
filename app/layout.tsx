import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { PrivyProvider } from '@/components/privy-provider';
import { WalletContextProvider } from '@/components/wallet-provider';
import { NavbarWrapper } from '@/components/layout/navbar-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VibeGame - Gamecoin szn on Solana',
  authors: [{ name: 'VibeGame', url: 'https://vibegame.fun' }],
  description: 'Build and share games using blocks on Solana.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: "VibeGame - Gamecoin szn on Solana",
    description: "Build and share games using blocks on Solana.",
    siteName: "VibeGame",
    images: [{
      url: `https://vibegame.fun/og/og1.png`,
      width: 1200,
      height: 630,
      alt: "VibeGame",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeGame - Gamecoin szn on Solana",
    description: "Build and share games using blocks on Solana.",
    images: [`https://vibegame.fun/og/og1.png`],
  },
  metadataBase: new URL("https://vibegame.fun"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <WalletContextProvider>
            <PrivyProvider>
              <NavbarWrapper>
                {children}
              </NavbarWrapper>
            </PrivyProvider>
          </WalletContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}