import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { PrivyProvider } from '@/components/privy-provider';
import { WalletContextProvider } from '@/components/wallet-provider';
import { NavbarWrapper } from '@/components/layout/navbar-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VibeGame - Low code solana, high speed innovation',
  description: 'Build and share blockchain games using our low-code platform.',
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