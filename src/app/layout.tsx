import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import AiChatWidget from '@/components/chat/AiChatWidget';
import AppLayout from '@/components/layout/AppLayout';

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
          <AppLayout>
            {children}
          </AppLayout>
          <AiChatWidget />
        </ToastProvider>
      </body>
    </html>
  );
}
