"use client";

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isComingSoonPage = pathname === '/coming-soon';

  return (
    <>
      {!isComingSoonPage && <Navbar />}
      <main className={`flex-1 ${!isComingSoonPage ? 'pt-16' : ''} overflow-auto pb-16`}>
        {children}
      </main>
      {!isComingSoonPage && <Footer />}
    </>
  );
} 