import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { ThemeProvider } from '@/components/theme-provider';
import { PrivyProvider } from '@/components/privy-provider';
import { GoogleProvider } from '@/components/google-provider';

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
          <GoogleProvider>
            <PrivyProvider>
              <Navbar />
              <main className="flex-1 pt-16">{children}</main>
              <Footer />
            </PrivyProvider>
          </GoogleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}