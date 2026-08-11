import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Navbar from '@/components/layout/Navbar';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '김시온 | Backend Developer',
  description: 'RAG 챗봇에게 직접 물어보는 백엔드 개발자 김시온의 포트폴리오',
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
