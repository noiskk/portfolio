import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Navbar from '@/components/layout/Navbar';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'AI-powered portfolio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${geist.className} bg-zinc-950 text-white antialiased`}>
        <Navbar />
        <main className="pt-14 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
