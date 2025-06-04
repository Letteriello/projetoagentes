"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita problema de hidratação (diferença entre servidor e cliente)
  const [isAnimating, setIsAnimating] = useState(false);

  // Evita problema de hidratação (diferença entre servidor e cliente)
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => {
      setIsAnimating(false);
    }, 300); // Duration of the animation
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={`w-9 h-9 opacity-0 ${className || ''}`}>
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all" />
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className={`w-9 h-9 text-muted-foreground hover:text-foreground ${className || ''}`}
          >
            {theme === "dark" ? (
              <Moon
                className={`h-[1.15rem] w-[1.15rem] transition-all duration-300 ease-in-out ${
                  isAnimating ? 'rotate-[360deg] scale-75' : 'rotate-0 scale-100'
                }`}
              />
            ) : (
              <Sun
                className={`h-[1.15rem] w-[1.15rem] transition-all duration-300 ease-in-out ${
                  isAnimating ? 'rotate-[360deg] scale-125' : 'rotate-0 scale-100'
                }`}
              />
            )}
            <span className="sr-only">Alternar tema</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Alternar para tema {theme === "dark" ? "claro" : "escuro"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
