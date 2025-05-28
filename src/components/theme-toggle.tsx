"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Evita problema de hidratação (diferença entre servidor e cliente)
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9 opacity-0">
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
            onClick={toggleTheme} 
            className="w-9 h-9 text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Moon className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 transition-all" />
            ) : (
              <Sun className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 transition-all" />
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
