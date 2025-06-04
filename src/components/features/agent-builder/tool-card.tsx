"use client";

import * as React from "react";
import { Check, Settings, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AvailableTool } from "@/types/tool-types";

interface ToolCardProps {
  tool: AvailableTool;
  isSelected: boolean;
  onSelect: (toolId: string) => void;
  onConfigure: (tool: AvailableTool) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  isSelected,
  onSelect,
  onConfigure,
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              "border transition-all duration-200 hover:border-primary/50 cursor-pointer relative",
        isSelected ? "border-primary ring-1 ring-primary" : "border-border",
        tool.isMCPTool
          ? "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900"
          : "",
      )}
      onClick={() => onSelect(tool.id)}
    >
      {tool.isMCPTool && (
        <div className="absolute top-2 right-2">
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-xs border-blue-400/30"
          >
            MCP
          </Badge>
        </div>
      )}
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-1.5 rounded-md",
                tool.isMCPTool
                  ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                  : "bg-primary/10",
              )}
            >
              {tool.icon &&
                (React.isValidElement(tool.icon)
                  ? tool.icon
                  : React.createElement(tool.icon as React.ElementType))}
            </div>
            <CardTitle className="text-base font-medium">{tool.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isSelected && <Check size={16} className="text-primary" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-xs text-muted-foreground">{tool.description}</p>
        {tool.hasConfig && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 w-full text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onConfigure(tool);
            }}
          >
            <Settings size={12} className="mr-1" />
            Configurar
          </Button>
        )}
        {tool.requiresAuth && (
          <div className="mt-2 pt-2 border-t border-dashed flex items-center justify-between">
            <div className="flex items-center">
              <Lock size={14} className="mr-1 text-yellow-500" />
              <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-600">
                Requer Autenticação
              </Badge>
            </div>
            <Link href="/api-key-vault" passHref>
              <a className="text-xs text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                Configurar Chaves
              </a>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  </TooltipTrigger>
  <TooltipContent className="w-80">
    <p className="text-sm font-semibold">{tool.name}</p>
    <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
    {/* Assuming tool.parameters might exist on the AvailableTool type */}
    {tool.parameters && tool.parameters.length > 0 && (
      <div className="mt-2 pt-2 border-t border-border">
        <p className="text-xs font-medium mb-1">Parameters:</p>
        <ul className="list-none p-0 space-y-1">
          {tool.parameters.map((param: any) => ( // Add 'any' type for param if not defined in AvailableTool
            <li key={param.name}>
              <p className="text-xs font-semibold">
                {param.name}
                {param.type && <span className="text-muted-foreground font-normal ml-1">({param.type})</span>}
              </p>
              {param.description && <p className="text-xs text-muted-foreground">{param.description}</p>}
            </li>
          ))}
        </ul>
      </div>
    )}
  </TooltipContent>
</Tooltip>
</TooltipProvider>
);
};
