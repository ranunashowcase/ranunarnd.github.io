'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Flame,
  Package,
  FlaskConical,
  FileText,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Trend Hari Ini', href: '/trends-today', icon: TrendingUp },
  { label: 'Produk Trending', href: '/trend-viral', icon: Flame },
  { label: 'Produk All', href: '/products', icon: Package },
  { label: 'Produk On Progress', href: '/products/on-progress', icon: FlaskConical },
  { label: 'Report', href: '/report', icon: FileText },
  { label: 'Input Informasi', href: '/input-info', icon: BrainCircuit },
];

export default function Sidebar({ isOpen, setIsOpen, isMobile }: { isOpen?: boolean; setIsOpen?: (v: boolean) => void; isMobile?: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-gradient-to-b from-[#0f2419] via-[#1B4332] to-[#143327] text-white shadow-sidebar z-50',
        'flex flex-col transition-all duration-300 ease-in-out custom-scrollbar',
        isOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full w-[260px]'
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-accent/20 flex-shrink-0 shadow-lg shadow-brand-accent/10">
            <Leaf className="w-6 h-6 text-brand-accent" />
          </div>
          <div className="animate-fade-in">
            <h1 className="text-base font-bold tracking-tight">SBJ R&D</h1>
            <p className="text-[11px] text-white/40 font-medium">Intelligence System</p>
          </div>
        </div>
        
        {/* Mobile close button */}
        {isMobile && setIsOpen && (
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-white/50 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-3 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25 px-3 mb-3">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
                    isActive
                      ? 'bg-white/12 text-white shadow-lg shadow-black/10'
                      : 'text-white/50 hover:text-white hover:bg-white/6'
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-accent rounded-r-full" />
                  )}
                  <Icon
                    className={cn(
                      'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                      isActive ? 'text-brand-accent' : 'text-white/40 group-hover:text-white/70'
                    )}
                  />
                  <span className="animate-fade-in">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/8">
        <div className="mb-3 px-2">
          <p className="text-[10px] text-white/20 font-medium">PT. Shalee Berkah Jaya</p>
          <p className="text-[10px] text-white/15">R&D Division</p>
        </div>
      </div>
    </aside>
  );
}
