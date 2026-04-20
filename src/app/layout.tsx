import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';
import AiChatWidget from '@/components/chat/AiChatWidget';

export const metadata: Metadata = {
  title: 'SBJ RnD System — Market Intelligence',
  description: 'Sistem internal R&D dan Market Intelligence PT. Shalee Berkah Jaya untuk analisis produk, tren pasar, dan packaging.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-0 md:ml-[260px] w-full transition-all duration-300">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-8">
                {children}
              </div>
            </main>
          </div>
          <AiChatWidget />
        </ToastProvider>
      </body>
    </html>
  );
}
