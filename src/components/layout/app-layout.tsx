
"use client";
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Bot, Cpu, Sparkles, KeyRound, Github, Settings2, UserCircle, MessageSquare } from 'lucide-react'; // Adicionado MessageSquare
import { AppLogo } from '@/components/icons/logo';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavItem {
  href: string;
  icon: ReactNode;
  label: string;
  tooltip: string;
}

const navItems: NavItem[] = [
  { href: '/agent-builder', icon: <Cpu />, label: 'Construtor de Agentes', tooltip: 'Construir Agentes' },
  { href: '/ai-assistant', icon: <Sparkles />, label: 'Assistente de IA', tooltip: 'Assistente de Configuração IA' },
  { href: '/chat', icon: <MessageSquare />, label: 'Chat com Agentes', tooltip: 'Interagir com Agentes' }, // Alterado
  { href: '/api-key-vault', icon: <KeyRound />, label: 'Cofre de Chaves API', tooltip: 'Gerenciar Chaves API' },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Button variant="ghost" size="icon" className="shrink-0 group-data-[collapsible=icon]:hidden rounded-full aspect-square asChild" asChild>
              <Link href="/"><AppLogo /></Link>
            </Button>
            <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">AgentVerse</span>
            <div className="flex-1 group-data-[collapsible=icon]:hidden" />
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.tooltip, className: "group-data-[collapsible=icon]:flex hidden" }}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center p-2">
                 <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="Avatar do Usuário" data-ai-hint="avatar usuário" />
                    <AvatarFallback>AV</AvatarFallback>
                  </Avatar>
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Nome do Usuário</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings2 className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 md:hidden">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">AgentVerse</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
