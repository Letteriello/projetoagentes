"use client"; // Required for hooks like useEffect, useState, useCommandPalette

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Added framer-motion imports
import "./globals.css";
import { Inter } from 'next/font/google';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { AppLayout } from "@/components/layout/app-layout";
import { ErrorBoundaryClient } from '@/components/error-boundary-client';
import { Toaster } from "@/components/ui/toaster";
import { AgentsProvider } from '@/contexts/AgentsContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { EnvironmentProvider } from '@/contexts/EnvironmentContext';
import { LoggerProvider } from '@/components/logger-provider';
import Joyride, { Step, CallBackProps, STATUS, EVENTS, ACTIONS } from "react-joyride";

// Network Status Hook
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

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
import { Cpu, MessageSquare, Plus, Settings as SettingsIcon } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

// Initialize Inter font
export const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap'
});

const initialSteps: Step[] = [
  {
    target: '[data-tour="sidebar"]',
    content: 'Esta é a barra de navegação principal. Aqui você pode acessar todas as seções da aplicação.',
    placement: 'right',
    title: 'Navegação Principal'
  },
  {
    target: '[data-tour="agent-builder-link"]',
    content: 'Clique aqui para criar e gerenciar seus agentes de IA.',
    placement: 'right',
    title: 'Construtor de Agentes'
  },
  {
    target: '[data-tour="chat-link"]',
    content: 'Acesse o chat para interagir com seus agentes.',
    placement: 'right',
    title: 'Chat com Agentes'
  },
  {
    target: '[data-tour="api-keys-link"]',
    content: 'Configure suas chaves de API aqui para conectar seus agentes a serviços externos.',
    placement: 'top',
    title: 'Chaves API'
  }
];

// Script to polyfill Node.js modules early in the page lifecycle
function NodePolyfillScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          // Polyfill Node.js modules in browser
          if (typeof window !== 'undefined') {
            // @ts-ignore
            window.process = window.process || { env: {}, nextTick: function(fn) { setTimeout(fn, 0); } };
            // @ts-ignore
            window.Buffer = window.Buffer || { isBuffer: function() { return false; } };
            // @ts-ignore
            window.fs = window.fs || {};
            // @ts-ignore
            window.path = window.path || { 
              join: function() { return Array.from(arguments).join('/').replace(/\\\\/+/g, '/'); }, 
              resolve: function() { return Array.from(arguments).join('/').replace(/\\\\/+/g, '/'); } 
            };
            // @ts-ignore
            window.child_process = window.child_process || {};
            // @ts-ignore
            window.net = window.net || {};
            // @ts-ignore
            window.tls = window.tls || {};
            // @ts-ignore
            window.http = window.http || {};
            // @ts-ignore
            window.https = window.https || {};
            // @ts-ignore
            window.crypto = window.crypto || {};
            // @ts-ignore
            window.stream = window.stream || {};
            // @ts-ignore
            window.zlib = window.zlib || {};
            // @ts-ignore
            window.util = window.util || {};
            // @ts-ignore
            window.url = window.url || {};
            // @ts-ignore
            window.os = window.os || {};
            // @ts-ignore
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
  const [runTour, setRunTour] = React.useState(false);
  const [tourSteps] = React.useState<Step[]>(initialSteps);

  React.useEffect(() => {
    const hasCompletedTour = localStorage.getItem('hasCompletedTour');
    if (!hasCompletedTour) {
      // setTimeout to ensure the DOM is ready, especially for portal-based elements or dynamic content
      setTimeout(() => setRunTour(true), 500);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, lifecycle, action } = data;
    console.log('Joyride callback data:', data);

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRunTour(false);
      localStorage.setItem('hasCompletedTour', 'true');
    } else if (type === EVENTS.TOOLTIP_CLOSE && lifecycle === 'tooltip' && action === ACTIONS.CLOSE) {
      // This handles the case where the user closes the tooltip manually by clicking the 'X'
      setRunTour(false);
      localStorage.setItem('hasCompletedTour', 'true');
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      console.error(`Target not found for step: ${data.step?.target}`);
      // Optional: move to next step or stop tour
      // For now, Joyride will show its own error in the tooltip.
      // if (data.index + 1 < tourSteps.length) {
      //   // Example: programmatically go to next step if current target is not found
      //   // This requires more complex state management for currentStep or directly using Joyride's API if available
      // } else {
      //   setRunTour(false); // Or stop if it's a critical step
      // }
    }
  };

  const {
    isOpen,
    openPalette,
    closePalette,
    actions,
    registerCommand,
  } = useCommandPalette();
  const router = useRouter(); // Keep for command palette navigation
  const pathname = usePathname(); // Get current pathname for animations
  const { toast } = useToast(); // This instance is for the layout's own toast needs like command palette

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
      onSelect: () => { router.push('/agent-builder'); },
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
  }, [registerCommand, router, toast]);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <NodePolyfillScript />
      </head>
      <body className={`${inter.variable} antialiased font-sans`} suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:rounded-md">
          Pular para o conteúdo principal
        </a>
        <ThemeProvider>
          <LoggerProvider>
            <AuthProvider>
              <EnvironmentProvider>
                <AgentsProvider>
                  <SidebarProvider>
                    <AppLayout>
                      <ErrorBoundaryClient>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={pathname} // Use pathname from usePathname()
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <main id="main-content" tabIndex={-1}>
                              {children}
                            </main>
                          </motion.div>
                        </AnimatePresence>
                      </ErrorBoundaryClient>
                    </AppLayout>
                  </SidebarProvider>
                </AgentsProvider>
              </EnvironmentProvider>
            </AuthProvider>
            <Toaster />
            <NetworkStatusNotifier />
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
            <Joyride
              steps={tourSteps}
              run={runTour}
              callback={handleJoyrideCallback}
              continuous={true}
              showProgress={true}
              showSkipButton={true}
              locale={{ back: 'Voltar', close: 'Fechar', last: 'Fim', next: 'Próximo', skip: 'Pular' }}
              styles={{
                options: {
                  arrowColor: 'var(--joyride-arrow-color, #38bdf8)',
                  backgroundColor: 'var(--joyride-background-color, #1e293b)',
                  overlayColor: 'var(--joyride-overlay-color, rgba(0, 0, 0, 0.8))',
                  primaryColor: 'var(--joyride-primary-color, #38bdf8)',
                  textColor: 'var(--joyride-text-color, #e2e8f0)',
                  zIndex: 10000, // Ensure it's above other elements like command palette (1000-5000 usually)
                },
                tooltip: {
                  borderRadius: '0.5rem',
                },
                buttonNext: {
                  backgroundColor: 'var(--joyride-button-next-bg, #0ea5e9)',
                  borderRadius: '0.375rem',
                  padding: '0.5rem 1rem',
                },
                buttonBack: {
                  color: 'var(--joyride-button-back-color, #0ea5e9)',
                  borderRadius: '0.375rem',
                  padding: '0.5rem 1rem',
                },
                buttonSkip: {
                  color: 'var(--joyride-button-skip-color, #94a3b8)', // slate-400
                  fontSize: '0.875rem',
                },
                buttonClose: {
                  // For the 'X' button, ensure it's visible on dark background
                  color: 'var(--joyride-button-close-color, #94a3b8)', // slate-400
                }
              }}
            />
          </LoggerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// Network Status Notifier Component
function NetworkStatusNotifier() {
  const isOnline = useNetworkStatus();
  // Get a new instance of useToast for the notifier, to avoid conflicts if layout uses toast for other things.
  // Or, ensure useToast is context-safe if called multiple times (which it should be as a hook).
  // For this case, useToast() should return the same global state and dispatch.
  const { toast: networkToast, dismiss } = useToast();
  const offlineToastIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!isOnline) {
      // Only show toast if one isn't already active for offline status
      if (!offlineToastIdRef.current) {
        const { id } = networkToast({
          title: "Você está offline",
          description: "Verifique sua conexão. Algumas funcionalidades podem estar indisponíveis.",
          variant: "destructive",
          // Provide a no-op onOpenChange to attempt to prevent auto-dismissal from some internal mechanisms
          // The main persistence will rely on TOAST_LIMIT=1 and manually dismissing when back online.
          onOpenChange: () => {},
        });
        offlineToastIdRef.current = id;
      }
    } else {
      if (offlineToastIdRef.current) {
        dismiss(offlineToastIdRef.current);
        offlineToastIdRef.current = null;
        // Optionally, show a "back online" toast
        networkToast({
          title: "Você está online novamente!",
          description: "Sua conexão foi restaurada.",
          variant: "default", // Assuming 'default' is a success-like or neutral style
          // Standard auto-dismissal for this one, so use default onOpenChange by not providing it
        });
      }
    }
  }, [isOnline, networkToast, dismiss]);

  return null; // This component does not render anything itself
}