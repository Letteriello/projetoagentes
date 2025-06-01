// CustomBehaviorForm: Componente para o formulário de comportamento específico de agentes Customizados.
// Inclui um campo para a descrição da lógica customizada.

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Props para o componente CustomBehaviorForm.
interface CustomBehaviorFormProps {
  customLogicDescription: string;
  setCustomLogicDescription: (description: string) => void;
}

const CustomBehaviorForm: React.FC<CustomBehaviorFormProps> = ({
  customLogicDescription,
  setCustomLogicDescription,
}) => {
  return (
    <div className="space-y-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Label htmlFor="customLogicDescription" className="cursor-help">Descrição da Lógica Customizada</Label>
          </TooltipTrigger>
          <TooltipContent className="w-80">
            <p>Descreva a funcionalidade principal. Se este agente invoca um fluxo Genkit específico, mencione o nome do fluxo. Detalhe como ele orquestra outros agentes ou ferramentas, se aplicável.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Textarea id="customLogicDescription" placeholder="Descreva a lógica customizada que este agente irá executar. Pode incluir referências a scripts, módulos externos ou endpoints específicos." value={customLogicDescription} onChange={(e) => setCustomLogicDescription(e.target.value)} rows={5}/>
       <p className="text-xs text-muted-foreground">Detalhe o comportamento específico implementado por este agente.</p>
    </div>
  );
};

export default CustomBehaviorForm;
