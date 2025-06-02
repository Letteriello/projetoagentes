import * as React from 'react';
import { Controller, useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle } from 'lucide-react'; // Icons

const DeployTab: React.FC = () => {
  const { control } = useFormContext(); // register is not used as all fields are controlled

  const { fields: envVarFields, append: appendEnvVar, remove: removeEnvVar } = useFieldArray({
    control,
    name: "deploymentConfig.environmentVariables",
  });

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
          {/* Target Platform */}
          <div className="space-y-2">
            <Label htmlFor="targetPlatform">Plataforma Alvo</Label>
            <Controller
              name="deploymentConfig.targetPlatform"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <SelectTrigger id="targetPlatform">
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloudRun">Cloud Run</SelectItem>
                    <SelectItem value="vertexAI">Vertex AI Agent Engine</SelectItem>
                    <SelectItem value="gke">Google Kubernetes Engine (GKE)</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Environment Variables */}
          <div className="space-y-2">
            <Label>Variáveis de Ambiente Necessárias</Label>
            {envVarFields.map((item, index) => ( // Renamed 'field' to 'item' to avoid conflict with controller's 'field'
              <div key={item.id} className="flex items-center space-x-2">
                <Controller
                  name={`deploymentConfig.environmentVariables.${index}.key`}
                  control={control}
                  defaultValue={item.key} // Corrected: use item.key
                  render={({ field: controllerField }) => (
                    <Input {...controllerField} placeholder="Chave" />
                  )}
                />
                <Controller
                  name={`deploymentConfig.environmentVariables.${index}.value`}
                  control={control}
                  defaultValue={item.value} // Corrected: use item.value
                  render={({ field: controllerField }) => (
                    <Input {...controllerField} placeholder="Valor" />
                  )}
                />
                <Button type="button" variant="ghost" onClick={() => removeEnvVar(index)} aria-label="Remover Variável">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendEnvVar({ key: '', value: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Variável
            </Button>
          </div>

          {/* Resource Requirements */}
          <div className="space-y-2">
            <Label>Requisitos de Recurso (Estimativas)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cpuRequirements">CPU</Label>
                <Controller
                  name="deploymentConfig.resourceRequirements.cpu"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="cpuRequirements" placeholder="Ex: 1, 500m" />
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="memoryRequirements">Memória</Label>
                <Controller
                  name="deploymentConfig.resourceRequirements.memory"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="memoryRequirements" placeholder="Ex: 512Mi, 2Gi" />
                  )}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeployTab;
