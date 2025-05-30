"use client";

import * as React from "react";
import { Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      </CardContent>
    </Card>
  );
};
