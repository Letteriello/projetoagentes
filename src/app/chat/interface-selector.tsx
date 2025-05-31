"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BrainCircuit,
  Vibrate,
  SwatchBook,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface InterfaceOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

export function InterfaceSelector() {
  const router = useRouter();
  const pathname = usePathname();

  const interfaceOptions: InterfaceOption[] = [
    {
      id: "standard",
      title: "Interface Padrão",
      description:
        "Interface de chat clássica com suporte a todas as funcionalidades.",
      icon: <SwatchBook className="h-8 w-8" />,
      path: "/chat",
    },
    {
      id: "streaming",
      title: "Interface com Streaming",
      description:
        "Nova interface com respostas em tempo real e suporte avançado a eventos Genkit.",
      icon: <Vibrate className="h-8 w-8" />,
      path: "/chat/streaming",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/chat" && pathname === "/chat") return true;
    if (path !== "/chat" && pathname?.includes(path.split("/").pop() || ""))
      return true;
    return false;
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">Selecione a Interface</h2>
        <p className="text-muted-foreground">
          Escolha o tipo de interface de chat para usar com seus agentes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {interfaceOptions.map((option) => {
          const active = isActive(option.path);

          return (
            <motion.div
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn(
                  "relative p-6 cursor-pointer border-2 transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50 hover:bg-muted/50",
                )}
                onClick={() => router.push(option.path)}
              >
                {active && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                )}

                <div className="flex flex-col items-start gap-4">
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    {option.icon}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{option.title}</h3>
                    <p className="text-muted-foreground">
                      {option.description}
                    </p>
                  </div>

                  <Button
                    variant={active ? "default" : "outline"}
                    className="mt-4"
                  >
                    {active ? "Selecionado" : "Selecionar"}
                    {!active && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
