'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize to auto-collapse/expand sidebar
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false); // Default closed on mobile
      } else {
        setIsSidebarOpen(true); // Default open on desktop
      }
    };

    // Initial check
    checkScreenSize();

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close sidebar on path change if on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  return (
    <div className="flex min-h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isMobile={isMobile} />
      
      {/* Screen Overlay for Mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main 
        className={cn(
          "flex-1 w-full transition-all duration-300 relative min-h-screen overflow-y-auto",
          isSidebarOpen && !isMobile ? "ml-[260px]" : "ml-0"
        )}
      >
        <Header 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-8 md:pt-24 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
