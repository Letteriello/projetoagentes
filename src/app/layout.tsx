
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import { AgentsProvider } from '@/contexts/AgentsContext'; // Importado

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AgentVerse',
  description: 'Crie, configure e monitore agentes de IA com AgentVerse.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans`}>
        <AgentsProvider> {/* Envolve com o Provider */}
          <AppLayout>
            {children}
          </AppLayout>
        </AgentsProvider>
        <Toaster />
      </body>
    </html>
  );
}
