import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '次の一手 - 不動産AI会計',
  description: '自主管理オーナーのためのインサイト駆動型AI会計アシスタント',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} antialiased`} suppressHydrationWarning={true}>
        {children}
        <Toaster 
          position="bottom-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              style: {
                background: '#4ade80',
                color: 'white',
              },
            },
            error: {
              style: {
                background: '#f87171',
                color: 'white',
              },
            },
          }}
        />
      </body>
    </html>
  );
} 