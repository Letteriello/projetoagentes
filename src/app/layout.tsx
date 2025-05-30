
import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import { AgentsProvider } from '@/contexts/AgentsContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundaryClient from '@/components/error-boundary-client';
import { inter, jetbrainsMono } from './fonts';

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
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
      <body className="antialiased" suppressHydrationWarning>
        <ErrorBoundaryClient>
          <ThemeProvider>
            <AgentsProvider>
              <SidebarProvider defaultOpen>
                <AppLayout>
                  {children}
                </AppLayout>
              </SidebarProvider>
            </AgentsProvider>
            <Toaster />
          </ThemeProvider>
        </ErrorBoundaryClient>
      </body>
    </html>
  );
}
