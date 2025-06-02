import React, { useEffect } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Copy } from 'lucide-react'; // Import Copy icon
import { useToast } from "@/hooks/use-toast"; // Import useToast
import JsonEditorField from '@/components/ui/JsonEditorField'; // Assuming this path is correct
import { generateGenkitToolStub } from '@/lib/agent-genkit-utils'; // Import the new utility

// Define the schema for form validation using Zod
const customToolSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  inputSchema: z.string().refine(
    (val) => {
      if (!val) return false; // Disallow empty string
      try {
        JSON.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: 'Deve ser um JSON válido.' }
  ),
  outputSchema: z.string().refine(
    (val) => {
      if (!val) return false; // Disallow empty string
      try {
        JSON.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: 'Deve ser um JSON válido.' }
  ),
});

export interface CustomToolData {
  id?: string; // Optional: only present when editing
  name: string;
  description: string;
  inputSchema: string; // JSON string
  outputSchema: string; // JSON string
}

interface CustomToolDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CustomToolData, id?: string) => void; // Pass id if editing
  initialData?: CustomToolData; // Should include id if editing
}

const CustomToolDialog: React.FC<CustomToolDialogProps> = ({
  isOpen,
  onOpenChange,
  onSave,
  initialData,
}) => {
  const { toast } = useToast(); // Initialize toast
  const methods = useForm<CustomToolData>({
    resolver: zodResolver(customToolSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      inputSchema: '{}', // Default to an empty JSON object
      outputSchema: '{}', // Default to an empty JSON object
    },
    mode: 'onChange', // Enable onChange mode for isValid to update dynamically
  });

  const { control, handleSubmit, reset, formState: { errors, isValid }, getValues } = methods;

  useEffect(() => {
    if (isOpen) { // Reset form when dialog opens
      if (initialData) {
      reset(initialData);
    } else {
      reset({
        name: '',
        description: '',
        inputSchema: '{}',
        outputSchema: '{}',
      });
    }
    }
  }, [initialData, reset, isOpen]);

  const onSubmit = (data: CustomToolData) => {
    onSave(data, initialData?.id); // Pass id from initialData if present
    // onOpenChange(false); // Dialog is typically closed by the onSave handler
  };

  const handleCopyGenkitCode = async () => {
    const { name, description, inputSchema, outputSchema } = getValues();
    if (!name || !description || !inputSchema || !outputSchema) {
      toast({
        title: "Faltam Informações",
        description: "Por favor, preencha nome, descrição e os esquemas antes de copiar o código.",
        variant: "destructive",
      });
      return;
    }
    try {
      // Ensure schemas are valid JSON before proceeding
      JSON.parse(inputSchema);
      JSON.parse(outputSchema);
    } catch (error) {
      toast({
        title: "Esquema JSON Inválido",
        description: "Por favor, corrija os esquemas de entrada/saída antes de copiar o código.",
        variant: "destructive",
      });
      return;
    }

    const codeStub = generateGenkitToolStub(name, description, inputSchema, outputSchema);
    try {
      await navigator.clipboard.writeText(codeStub);
      toast({
        title: "Código Genkit Copiado!",
        description: "O código stub da ferramenta foi copiado para a sua área de transferência.",
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Falha ao Copiar",
        description: "Não foi possível copiar o código para a área de transferência.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{initialData ? 'Edit Custom Tool' : 'Create Custom Tool'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input id="name" {...field} className="col-span-3" />
                  )}
                />
                {errors.name && <p className="col-span-4 text-red-500 text-sm">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right mt-2">
                  Description
                </Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea id="description" {...field} className="col-span-3" rows={3} />
                  )}
                />
                {errors.description && <p className="col-span-4 text-red-500 text-sm">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="inputSchema">Input Schema (JSON)</Label>
                <Controller
                  name="inputSchema"
                  control={control}
                  render={({ field }) => (
                    <JsonEditorField
                      id="inputSchema"
                      value={field.value}
                      onChange={field.onChange}
                      height="150px"
                      error={errors.inputSchema?.message}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="outputSchema">Output Schema (JSON)</Label>
                <Controller
                  name="outputSchema"
                  control={control}
                  render={({ field }) => (
                    <JsonEditorField
                      id="outputSchema"
                      value={field.value}
                      onChange={field.onChange}
                      height="150px"
                      error={errors.outputSchema?.message}
                    />
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCopyGenkitCode}
                disabled={!isValid} // Enable only if form is valid
                className="mr-auto" // Push other buttons to the right
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar Código Genkit
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!isValid}>Salvar</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default CustomToolDialog;
