import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { PrivyProvider } from '@/components/privy-provider';
import { WalletContextProvider } from '@/components/wallet-provider';
import { UserProvider } from '@/lib/contexts/user-context';
import { NavbarWrapper } from '@/components/layout/navbar-wrapper';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';

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
        {/* Import map to resolve bare module specifiers used by public/wifegame/modules/* */}
        <Script id="importmap-three" type="importmap">
          {JSON.stringify({
            imports: {
              "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
              "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
            }
          })}
        </Script>
        <Script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js" />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <WalletContextProvider>
            <UserProvider>
              <PrivyProvider>
                <NavbarWrapper>
                  {children}
                </NavbarWrapper>
              </PrivyProvider>
            </UserProvider>
          </WalletContextProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}