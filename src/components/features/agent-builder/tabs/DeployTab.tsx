import * as React from 'react';
import { Controller, useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
// Label replaced by FormLabel
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle } from 'lucide-react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { SavedAgentConfiguration } from '@/types/agent-configs-new'; // For type context

// Define options based on Zod schema for deploymentConfig.targetPlatform
const targetPlatformOptions = [
  { value: "gcp_cloud_run", label: "Google Cloud Run" },
  { value: "gcp_gke", label: "Google Kubernetes Engine (GKE)" },
  { value: "aws_lambda", label: "AWS Lambda" },
  { value: "aws_ecs", label: "AWS ECS" },
  { value: "azure_functions", label: "Azure Functions" },
  { value: "azure_container_apps", label: "Azure Container Apps" },
  { value: "docker", label: "Docker Container" },
  { value: "local_node", label: "Local Node.js Server" },
  { value: "custom_script", label: "Custom Deployment Script" },
];


const DeployTab: React.FC = () => {
  const { control, watch } = useFormContext<SavedAgentConfiguration>(); // Added watch

  const { fields: envVarFields, append: appendEnvVar, remove: removeEnvVar } = useFieldArray({
    control,
    name: "deploymentConfig.envVars", // Updated path to match zod schema
  });

  const targetPlatform = watch("deploymentConfig.targetPlatform");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Deploy</CardTitle>
          <CardDescription>
            Defina as configurações para a implantação do seu agente em diferentes plataformas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="deploymentConfig.targetPlatform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plataforma Alvo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a plataforma" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {targetPlatformOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {targetPlatform === 'docker' && (
            <FormField
              control={control}
              name="deploymentConfig.dockerfilePath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caminho do Dockerfile (opcional)</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} placeholder="Dockerfile" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {targetPlatform === 'custom_script' && (
            <FormField
              control={control}
              name="deploymentConfig.customScriptPath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caminho do Script de Deploy Customizado</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} placeholder="./scripts/deploy.sh" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={control}
            name="deploymentConfig.port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Porta da Aplicação (se aplicável)</FormLabel>
                <FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseInt(e.target.value,10) || undefined)} placeholder="Ex: 8080" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Variáveis de Ambiente</FormLabel>
            {envVarFields.map((item, index) => (
              <div key={item.id} className="flex items-start space-x-2">
                <FormField
                  control={control}
                  name={`deploymentConfig.envVars.${index}.key`}
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      {index === 0 && <FormLabel className="text-xs text-muted-foreground">Chave</FormLabel>}
                      <FormControl><Input {...field} placeholder="CHAVE_DA_VARIAVEL" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`deploymentConfig.envVars.${index}.value`}
                  render={({ field }) => (
                     <FormItem className="flex-grow">
                       {index === 0 && <FormLabel className="text-xs text-muted-foreground">Valor</FormLabel>}
                      <FormControl><Input {...field} placeholder="Valor da variável" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" onClick={() => removeEnvVar(index)} aria-label="Remover Variável" className="mt-auto pb-3"> {/* Adjusted margin for alignment */}
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendEnvVar({ key: '', value: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Variável
            </Button>
          </div>

          <div className="space-y-2">
            <FormLabel>Requisitos de Recurso (Estimativas)</FormLabel>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="deploymentConfig.resourceRequirements.cpu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor={`cpuRequirements-${field.name}`}>CPU</FormLabel> {/* Unique ID for label if needed */}
                    <FormControl><Input {...field} id={`cpuRequirements-${field.name}`} placeholder="Ex: 1, 500m" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="deploymentConfig.resourceRequirements.memory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor={`memoryRequirements-${field.name}`}>Memória</FormLabel>
                    <FormControl><Input {...field} id={`memoryRequirements-${field.name}`} placeholder="Ex: 512Mi, 2Gi" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeployTab;
