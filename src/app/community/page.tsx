"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // For potential future use, not strictly needed for links
import { Users, BookOpen, Lightbulb, MessageSquare, FileText, Youtube, Users2, PackageSearch } from 'lucide-react'; // Import appropriate icons
import Link from 'next/link'; // For internal links like /marketplace

// Define a type for link items for easier mapping
interface CommunityLink {
  href: string;
  text: string;
  icon?: React.ElementType;
  isInternal?: boolean;
}

interface LinkSection {
  title: string;
  icon?: React.ElementType;
  links: CommunityLink[];
}

const communitySections: LinkSection[] = [
  {
    title: "Recursos da Comunidade",
    icon: Users2,
    links: [
      { href: "#", text: "Fórum Oficial ADK", icon: MessageSquare },
      { href: "/docs", text: "Documentação Detalhada do ADK", icon: BookOpen, isInternal: true }, // Assuming /docs could be an internal route
      { href: "#", text: "Blog da Comunidade ADK", icon: FileText },
      { href: "#", text: "Servidor Discord da Comunidade", icon: Users },
    ],
  },
  {
    title: "Tutoriais e Guias da Comunidade",
    icon: BookOpen,
    links: [
      { href: "#", text: "Tutorial: Construindo seu Primeiro Agente com ADK (Vídeo)", icon: Youtube },
      { href: "#", text: "Guia Avançado: Integrando Ferramentas Customizadas no ADK", icon: FileText },
      { href: "#", text: "Melhores Práticas para Design de Agentes Colaborativos", icon: Users2 },
    ],
  },
  {
    title: "Exemplos de Agentes e Projetos",
    icon: Lightbulb,
    links: [
      { href: "/marketplace", text: "Galeria de Agentes da Comunidade (Marketplace)", icon: PackageSearch, isInternal: true },
      { href: "#", text: "Projeto Exemplo: Agente de Suporte ao Cliente com RAG", icon: Lightbulb },
      { href: "#", text: "Projeto Exemplo: Agente de Análise de Dados Financeiros", icon: Lightbulb },
    ],
  },
];

export default function CommunityPage() {
  return (
    <main className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Comunidade Agent Development Kit (ADK)
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore recursos, tutoriais e exemplos criados pela comunidade ADK para aprimorar suas habilidades e descobrir novas possibilidades com agentes inteligentes.
        </p>
      </header>

      <div className="space-y-12">
        {communitySections.map((section) => (
          <section key={section.title}>
            <Card className="bg-card/50 backdrop-blur-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center">
                  {section.icon && <section.icon className="w-7 h-7 mr-3 text-primary" />}
                  <CardTitle className="text-2xl font-semibold">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.links.map((link) => (
                    <Card key={link.text} className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center space-x-3 p-4">
                        {link.icon && <link.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                           {link.isInternal ? (
                            <Link href={link.href} passHref>
                              <span className="font-medium text-foreground hover:text-primary cursor-pointer truncate block">
                                {link.text}
                              </span>
                            </Link>
                          ) : (
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-foreground hover:text-primary cursor-pointer truncate block"
                            >
                              {link.text}
                            </a>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        ))}
      </div>
    </main>
  );
}
