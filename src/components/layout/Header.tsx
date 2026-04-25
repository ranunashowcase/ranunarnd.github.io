'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, User, Settings, Database, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 right-0 left-0 md:left-[260px] h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40 flex items-center justify-end px-4 sm:px-6 transition-all duration-300">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 bg-gray-50 text-gray-700 hover:bg-brand-primary/10 hover:text-brand-primary rounded-xl transition-colors border border-gray-100 shadow-sm flex items-center justify-center"
          aria-label="Menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-slide-up origin-top-right">
            <div className="px-4 py-3 border-b border-gray-50 mb-2">
              <p className="text-sm font-semibold text-gray-900">Administrator</p>
              <p className="text-xs text-gray-500">admin@shalee.co.id</p>
            </div>

            <nav className="flex flex-col gap-1 px-2">
              <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-colors w-full text-left">
                <User className="w-4 h-4 text-gray-400" />
                Profil
              </button>
              
              <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-colors w-full text-left">
                <Settings className="w-4 h-4 text-gray-400" />
                Pengaturan
              </button>
              
              <div className="h-px bg-gray-100 my-1 mx-2" />

              <Link
                href="/admin/data-all"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors w-full",
                  pathname === '/admin/data-all'
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-gray-600 hover:text-brand-primary hover:bg-brand-primary/5"
                )}
              >
                <Database className={cn("w-4 h-4", pathname === '/admin/data-all' ? "text-brand-primary" : "text-gray-400")} />
                Data All (Master)
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
