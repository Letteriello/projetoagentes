import React from 'react';
import { useForm, FormProvider, SubmitHandler, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BaseFormProps<T extends FieldValues> {
  onSubmit: SubmitHandler<T>;
  onCancel?: () => void;
  defaultValues: T;
  validationSchema: z.ZodSchema<T>;
  children: React.ReactNode;
  className?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
  hideCancelButton?: boolean;
  formActionsContainerClassName?: string; // For styling the action buttons container
}

const BaseForm = <T extends FieldValues>({
  onSubmit,
  onCancel,
  defaultValues,
  validationSchema,
  children,
  className,
  submitButtonText = "Salvar",
  cancelButtonText = "Cancelar",
  hideCancelButton = false,
  formActionsContainerClassName = "flex justify-end gap-2 mt-6", // Default styling for actions
}: BaseFormProps<T>) => {
  const methods = useForm<T>({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const { handleSubmit, formState } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-6", className)}>
        {children}
        <div className={formActionsContainerClassName}>
          {!hideCancelButton && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {cancelButtonText}
            </Button>
          )}
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Salvando..." : submitButtonText}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default BaseForm;
