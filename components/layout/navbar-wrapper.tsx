"use client";

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { useEffect, useState } from 'react';

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isComingSoonPage = pathname === '/coming-soon';
  // const [isSubdomain, setIsSubdomain] = useState(false);

  // useEffect(() => {
  //   const hostHeader = window.location.host;
  //   const hostname = hostHeader.split(':')[0];
  //   const parts = hostname.split('.');
    
  //   // Handle cases like "mario.localhost" (length 2) and "mario.vibegame.fun" (length 3)
  //   const subdomain = parts.length > 2
  //     ? parts[0]
  //     : parts.length === 2 && parts[1] === 'localhost'
  //       ? parts[0]
  //       : '';

  //   const isLocalhost = hostname.endsWith('localhost');
  //   const isVibegameFun = hostname.endsWith('vibegame.fun');
    
  //   const hasValidSubdomain = Boolean(subdomain) && subdomain !== 'www' && subdomain !== 'app' && (isLocalhost || isVibegameFun);
  //   setIsSubdomain(hasValidSubdomain);
  // }, []);
  //&& !isSubdomain

  return (
    <>
      {!isComingSoonPage && <Navbar />}
      <main className={`flex-1 overflow-auto pb-16`}>
        {children}
      </main>
      {/* {!isComingSoonPage && <Footer />} */}
    </>
  );
} 