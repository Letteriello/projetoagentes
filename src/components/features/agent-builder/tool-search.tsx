"use client";

import * as React from "react";
import { useMemo } from "react"; // Import useMemo
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { debounce } from "../../../lib/utils"; // Import debounce
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface ToolFilters {
  configurable: boolean;
  requiresAuth: boolean;
}

interface ToolSearchProps {
  onSearch: (query: string) => void;
  onFilterChange: (
    filterKey: keyof ToolFilters | "reset",
    value?: boolean,
  ) => void;
  filters: ToolFilters;
}

export const ToolSearch: React.FC<ToolSearchProps> = ({
  onSearch,
  onFilterChange,
  filters,
}) => {
  const debouncedSearch = useMemo(() => {
    return debounce(onSearch, 300);
  }, [onSearch]);

  return (
    <div className="flex flex-col space-y-3 mb-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar ferramentas..."
          className="pl-8"
          onChange={(e) => debouncedSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtros:</span>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="filter-config"
            checked={filters.configurable}
            onCheckedChange={(checked) =>
              onFilterChange("configurable", checked === true)
            }
          />
          <Label htmlFor="filter-config" className="text-xs cursor-pointer">
            Configuráveis
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="filter-auth"
            checked={filters.requiresAuth}
            onCheckedChange={(checked) =>
              onFilterChange("requiresAuth", checked === true)
            }
          />
          <Label htmlFor="filter-auth" className="text-xs cursor-pointer">
            Requer Autenticação
          </Label>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs ml-auto"
          onClick={() => onFilterChange("reset")}
        >
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
};
