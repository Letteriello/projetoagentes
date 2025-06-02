import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TagInput } from '@/components/ui/tag-input'; // Import TagInput
import { SavedAgentConfiguration } from '@/types/agent-configs';

interface SaveAsTemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  agentToTemplate: SavedAgentConfiguration | null;
  onSaveTemplate: (details: { useCases: string[]; templateDetailsPreview: string }) => void;
}

const SaveAsTemplateDialog: React.FC<SaveAsTemplateDialogProps> = ({
  isOpen,
  onOpenChange,
  agentToTemplate,
  onSaveTemplate,
}) => {
  const [useCases, setUseCases] = React.useState<string[]>([]);
  const [templateDetailsPreview, setTemplateDetailsPreview] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      // Reset fields when dialog opens
      // Pre-fill from agent's existing template fields if they exist (e.g. if user is re-saving a template or an agent derived from a template)
      setUseCases(agentToTemplate?.useCases || []); 
      setTemplateDetailsPreview(agentToTemplate?.templateDetailsPreview || '');
    }
  }, [isOpen, agentToTemplate]);

  const handleSubmit = () => {
    onSaveTemplate({
      useCases,
      templateDetailsPreview,
    });
    onOpenChange(false); // Close dialog after save
  };

  if (!agentToTemplate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar "{agentToTemplate.agentName}" como Template</DialogTitle>
          <DialogDescription>
            Adicione informações que ajudarão outros usuários a entender e usar este template.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="templateUseCases">Casos de Uso (Tags)</Label>
            <TagInput
              id="templateUseCases"
              tags={useCases}
              setTags={setUseCases}
              placeholder="Digite um caso de uso e pressione Enter"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ex: "atendimento_ao_cliente", "geracao_de_codigo", "resumo_de_texto".
            </p>
          </div>
          <div>
            <Label htmlFor="templateDetailsPreview">Preview dos Detalhes (Descrição Curta)</Label>
            <Textarea
              id="templateDetailsPreview"
              value={templateDetailsPreview}
              onChange={(e) => setTemplateDetailsPreview(e.target.value)}
              placeholder="Descreva brevemente o que este template faz, seus principais recursos ou um exemplo de prompt."
              rows={4}
              className="mt-1"
            />
             <p className="text-xs text-muted-foreground mt-1">
              Este texto aparecerá como uma prévia na listagem de templates.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Salvar Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveAsTemplateDialog;
