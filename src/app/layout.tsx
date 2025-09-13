import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from "@/contexts/AuthContext";
import { SWRProvider } from "@/components/SWRProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Real Estate Manager",
  description: "Advanced AI-powered real estate management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.className} light`} style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <body>
        <SWRProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </SWRProvider>
        <div id="modal-root"></div>
      </body>
    </html>
  );
} 