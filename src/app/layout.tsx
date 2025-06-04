"use client"; // Required for hooks like useEffect, useState, useCommandPalette

import * as React from 'react'; // Import React
import type { Metadata } from "next"; // Keep metadata type if still used elsewhere, or remove if RootLayout is fully client
import "./globals.css";
import { Inter } from 'next/font/google';
import { useRouter } from 'next/navigation'; // For navigation commands
import { AppLayout } from "@/components/layout/app-layout";
import { ErrorBoundaryClient } from '@/components/error-boundary-client';
import { Toaster } from "@/components/ui/toaster";
import { AgentsProvider } from '@/contexts/AgentsContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { EnvironmentProvider } from '@/contexts/EnvironmentContext';
import { LoggerProvider } from '@/components/logger-provider';

// Command Palette Imports
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { useCommandPalette, CommandAction } from "@/hooks/use-command-palette";
import { Cpu, MessageSquare, Plus, Settings as SettingsIcon } from "lucide-react"; // Icons for commands
import { useToast } from '@/hooks/use-toast';


// Import polyfills for Node.js modules in browser environment
import '@/lib/polyfills';
import '@/lib/node-polyfills';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Metadata can remain here as it's a static export
export const metadata: Metadata = {
  title: "AgentVerse",
  description: "Crie, configure e monitore agentes de IA com AgentVerse.",
};

// Script to polyfill Node.js modules early in the page lifecycle
function NodePolyfillScript() {
  // ... (NodePolyfillScript content remains the same)
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
  const {
    isOpen,
    openPalette,
    closePalette,
    actions,
    registerCommand,
    // unregisterCommand // Not used for initial global commands in this setup
  } = useCommandPalette();
  const router = useRouter();
  const { toast } = useToast();

  // Register global keyboard shortcut for Command Palette
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openPalette();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [openPalette]);

  // Register initial global commands
  React.useEffect(() => {
    registerCommand({
      id: 'new-agent',
      label: 'Novo Agente',
      onSelect: () => { router.push('/agent-builder'); /* Consider opening modal directly if possible */ },
      icon: Plus,
      section: 'Ações Rápidas',
      keywords: ['criar', 'novo', 'agente', 'construtor'],
    });
    registerCommand({
      id: 'new-chat',
      label: 'Nova Conversa',
      onSelect: () => router.push('/chat'),
      icon: MessageSquare,
      section: 'Ações Rápidas',
      keywords: ['chat', 'conversa', 'nova'],
    });
    registerCommand({
      id: 'goto-agents',
      label: 'Ir para Agentes',
      onSelect: () => router.push('/agent-builder'),
      icon: Cpu,
      section: 'Navegação',
      keywords: ['construtor', 'agentes', 'ver', 'listar'],
    });
    registerCommand({
      id: 'goto-chat',
      label: 'Ir para Chat',
      onSelect: () => router.push('/chat'),
      icon: MessageSquare,
      section: 'Navegação',
      keywords: ['chat', 'conversa', 'ver', 'listar'],
    });
    registerCommand({
      id: 'settings-toast',
      label: 'Configurações (Exemplo)',
      onSelect: () => {
        toast({ title: 'Configurações', description: 'Acesso às configurações (exemplo).' });
      },
      icon: SettingsIcon,
      section: 'Configurações',
      keywords: ['config', 'preferencias', 'ajustes'],
    });

    // No need to unregister these global commands as they live with the app lifecycle
  }, [registerCommand, router, toast]);


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
            <CommandDialog open={isOpen} onOpenChange={(open) => !open && closePalette()}>
              <CommandInput placeholder="Digite um comando ou pesquise..." />
              <CommandList>
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                {Object.entries(
                  actions.reduce((groups, action) => {
                    const section = action.section || 'Geral';
                    if (!groups[section]) {
                      groups[section] = [];
                    }
                    groups[section].push(action);
                    return groups;
                  }, {} as Record<string, CommandAction[]>)
                ).map(([section, sectionActions]) => (
                  <CommandGroup key={section} heading={section}>
                    {sectionActions.map((action) => (
                      <CommandItem
                        key={action.id}
                        value={`${action.label} ${action.keywords?.join(' ') || ''}`}
                        onSelect={() => {
                          action.onSelect();
                          closePalette();
                        }}
                      >
                        {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                        <span>{action.label}</span>
                        {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </CommandDialog>
          </LoggerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
