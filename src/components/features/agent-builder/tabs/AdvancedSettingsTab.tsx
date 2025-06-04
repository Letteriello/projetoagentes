import * as React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Settings2, AlertTriangle } from 'lucide-react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { SavedAgentConfiguration } from '@/types/agent-configs-new';
// Assuming InfoIconComponent and showHelpModal might be needed later or passed if help content exists
// import { InfoIcon as InfoIconComponent } from '@/components/ui/InfoIcon';
// import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';

// interface AdvancedSettingsTabProps {
//   showHelpModal?: (contentKey: any) => void;
// }

const AdvancedSettingsTab: React.FC = (/*props: AdvancedSettingsTabProps*/) => {
  const { control } = useFormContext<SavedAgentConfiguration>();

  return (
    <div className="space-y-6">
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Considerações de Segurança para RunConfig</AlertTitle>
        <AlertDescription>
          Parâmetros de RunConfig (como 'max_tokens' para limitar a geração de conteúdo, 'temperature' para controlar a aleatoriedade, ou configurações de 'compositional_function_calling' para controlar a complexidade e execução de múltiplas funções) podem impactar a segurança, o custo e o comportamento do agente. Revise estas configurações cuidadosamente, especialmente em ambientes de produção.
        </AlertDescription>
      </Alert>
      <Alert>
        <Settings2 className="h-4 w-4" />
        <AlertTitle>Configurações Avançadas</AlertTitle>
        <AlertDescription>
          Configure callbacks do ciclo de vida do agente ADK e outras opções avançadas.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Callbacks do Ciclo de Vida ADK</CardTitle>
          <CardDescription>
            Especifique nomes de fluxos Genkit ou referências de funções para serem invocadas em pontos chave do ciclo de vida do agente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: "beforeAgent", label: "Callback Before Agent", description: "Invocado antes do agente principal processar a requisição. Útil para configuração, validação inicial ou **verificação de conformidade de segurança da requisição de entrada**." },
            { name: "afterAgent", label: "Callback After Agent", description: "Invocado após o agente principal concluir. Útil para formatação final, limpeza ou **registro de auditoria seguro da transação completa**." },
            { name: "beforeModel", label: "Callback Before Model", description: "Invocado antes de uma chamada ao LLM. Permite modificar o prompt ou configurações do modelo, **adicionar contexto de segurança ou verificar o prompt contra políticas de uso aceitável**." },
            { name: "afterModel", label: "Callback After Model", description: "Invocado após o LLM retornar uma resposta. Permite modificar ou validar a saída do LLM, **verificar conformidade com políticas de conteúdo ou remover informações sensíveis antes de serem usadas por uma ferramenta ou retornadas ao usuário**." },
            { name: "beforeTool", label: "Callback Before Tool", description: "Invocado antes da execução de uma ferramenta. Permite inspecionar/modificar argumentos, **validar permissões ou cancelar a execução por razões de segurança (ex: usando um fluxo Genkit de validação)**." },
            { name: "afterTool", label: "Callback After Tool", description: "Invocado após uma ferramenta ser executada. Permite inspecionar/modificar o resultado da ferramenta ou **realizar verificações de segurança nos dados retornados pela ferramenta antes de serem usados em etapas subsequentes**." },
          ].map(callback => (
            <FormField
              key={callback.name}
              control={control}
              name={`config.adkCallbacks.${callback.name}` as const}
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel htmlFor={field.name}>{callback.label}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Nome do fluxo Genkit ou ref da função"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground pt-1">{callback.description}</p>
                </FormItem>
              )}
            />
          ))}
        </CardContent>
      </Card>

      {/* Additional Security Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Segurança Adicionais</CardTitle>
          <CardDescription>
            Ajustes finos para segurança na execução de código e outras operações sensíveis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="config.sandboxedCodeExecution"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Habilitar Execução de Código em Sandbox
                  </FormLabel>
                  <p className="text-xs text-muted-foreground pt-1">
                    Quando habilitado, o código executado pela ferramenta codeExecutor será invocado em um ambiente sandbox simulado para maior segurança.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedSettingsTab;
