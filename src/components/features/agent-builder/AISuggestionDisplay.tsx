import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AiConfigurationAssistantOutput } from '@/ai/flows/aiConfigurationAssistantFlow'; // Adjust path as necessary
import { ScrollArea } from '@/components/ui/scroll-area'; // If suggestions can be long

interface AISuggestionDisplayProps {
  suggestions: AiConfigurationAssistantOutput;
  onApplySuggestions: (suggestions: AiConfigurationAssistantOutput) => void;
  onClose: () => void;
}

const AISuggestionDisplay: React.FC<AISuggestionDisplayProps> = ({ suggestions, onApplySuggestions, onClose }) => {
  const hasSuggestions =
    suggestions.suggestedPersonality ||
    suggestions.suggestedRestrictions?.length ||
    suggestions.suggestedModel ||
    suggestions.suggestedTemperature !== undefined ||
    suggestions.suggestedTools?.length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-background">
        <CardHeader>
          <CardTitle>Sugestões da IA</CardTitle>
          <CardDescription>
            A IA analisou o objetivo e as tarefas do seu agente e sugere as seguintes configurações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[60vh] pr-4">
            {!hasSuggestions && <p className="text-sm text-muted-foreground">Nenhuma sugestão específica foi gerada.</p>}

            {suggestions.suggestedPersonality && (
              <div className="mb-4">
                <h4 className="font-semibold mb-1">Personalidade Sugerida:</h4>
                <p className="text-sm p-2 border rounded-md bg-muted">{suggestions.suggestedPersonality}</p>
              </div>
            )}

            {suggestions.suggestedRestrictions && suggestions.suggestedRestrictions.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-1">Restrições Sugeridas:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {suggestions.suggestedRestrictions.map((restriction, index) => (
                    <li key={index} className="text-sm p-1 border rounded-md bg-muted">{restriction}</li>
                  ))}
                </ul>
              </div>
            )}

            {suggestions.suggestedModel && (
              <div className="mb-4">
                <h4 className="font-semibold mb-1">Modelo de IA Sugerido:</h4>
                <p className="text-sm p-2 border rounded-md bg-muted">{suggestions.suggestedModel}</p>
              </div>
            )}

            {suggestions.suggestedTemperature !== undefined && (
              <div className="mb-4">
                <h4 className="font-semibold mb-1">Temperatura Sugerida:</h4>
                <p className="text-sm p-2 border rounded-md bg-muted">{suggestions.suggestedTemperature}</p>
              </div>
            )}

            {suggestions.suggestedTools && suggestions.suggestedTools.length > 0 && (
              <div>
                <h4 className="font-semibold mb-1">Ferramentas Sugeridas:</h4>
                <ul className="space-y-2">
                  {suggestions.suggestedTools.map((tool) => (
                    <li key={tool.id} className="text-sm p-2 border rounded-md bg-muted">
                      <p className="font-medium">{tool.name}</p>
                      {tool.description && <p className="text-xs text-muted-foreground">{tool.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {hasSuggestions && (
            <Button onClick={() => onApplySuggestions(suggestions)}>Aplicar Sugestões</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AISuggestionDisplay;
