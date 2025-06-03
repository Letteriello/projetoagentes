import type { Metadata } from "next";
import "./globals.css";
import { Inter } from 'next/font/google';
import { AppLayout } from "@/components/layout/app-layout";
import { ErrorBoundaryClient } from '@/components/error-boundary-client';
import { Toaster } from "@/components/ui/toaster";
import { AgentsProvider } from '@/contexts/AgentsContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { EnvironmentProvider } from '@/contexts/EnvironmentContext';
import { LoggerProvider } from '@/components/logger-provider';

// Import polyfills for Node.js modules in browser environment
import '@/lib/polyfills';
import '@/lib/node-polyfills';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "AgentVerse",
  description: "Crie, configure e monitore agentes de IA com AgentVerse.",
};

// Script to polyfill Node.js modules early in the page lifecycle
function NodePolyfillScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          // Polyfill Node.js modules in browser
          if (typeof window !== 'undefined') {
            window.process = window.process || { env: {}, nextTick: function(fn) { setTimeout(fn, 0); } };
            window.Buffer = window.Buffer || { isBuffer: function() { return false; } };
            window.fs = window.fs || {};
            window.path = window.path || { 
              join: function() { return Array.from(arguments).join('/').replace(/\\/+/g, '/'); }, 
              resolve: function() { return Array.from(arguments).join('/').replace(/\\/+/g, '/'); } 
            };
            window.child_process = window.child_process || {};
            window.net = window.net || {};
            window.tls = window.tls || {};
            window.http = window.http || {};
            window.https = window.https || {};
            window.crypto = window.crypto || {};
            window.stream = window.stream || {};
            window.zlib = window.zlib || {};
            window.util = window.util || {};
            window.url = window.url || {};
            window.os = window.os || {};
            window.assert = window.assert || function() {};
            console.log('[Polyfills] Node.js module polyfills loaded for browser');
          }
        `,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <NodePolyfillScript />
      </head>
      <body className={`${inter.variable} antialiased font-sans`} suppressHydrationWarning>
        <ThemeProvider>
          <LoggerProvider>
            <AuthProvider>
              <EnvironmentProvider>
                <AgentsProvider>
                  <SidebarProvider>
                    <AppLayout>
                      <ErrorBoundaryClient>
                        {children}
                      </ErrorBoundaryClient>
                    </AppLayout>
                  </SidebarProvider>
                </AgentsProvider>
              </EnvironmentProvider>
            </AuthProvider>
            <Toaster />
          </LoggerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
