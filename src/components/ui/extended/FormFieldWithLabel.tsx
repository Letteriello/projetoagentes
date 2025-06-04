import * as React from 'react';
import {
  Controller,
  useFormContext,
  FieldPath,
  Control,
  ControllerProps,
  FieldValues, // Import FieldValues
} from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  // FormControl, // Not directly used as render prop handles control rendering
  FormMessage,
} from '@/components/ui/form';
// Label from '@/components/ui/label' is not explicitly used here, FormLabel is.
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react'; // Using Info icon for tooltip
import { cn } from '@/lib/utils';

// Define the props for the component
// Use a generic TFieldValues that extends FieldValues
export interface FormFieldWithLabelProps<TFieldValues extends FieldValues = FieldValues> {
  name: FieldPath<TFieldValues>;
  label: string;
  tooltipContent?: React.ReactNode;
  tooltipSide?: "top" | "bottom" | "left" | "right";
  control?: Control<TFieldValues>; // Optional: useFormContext can provide it
  render: ({
    field,
    fieldState,
    formState,
  }: {
    field: ReturnType<typeof Controller>['field'];
    fieldState: ReturnType<typeof Controller>['fieldState'];
    formState: ReturnType<typeof Controller>['formState'];
  }) => React.ReactElement;
  className?: string;
  labelClassName?: string;
  rules?: ControllerProps<TFieldValues>['rules'];
}

export function FormFieldWithLabel<TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  tooltipContent,
  tooltipSide = "right",
  control,
  render,
  className,
  labelClassName,
  rules,
}: FormFieldWithLabelProps<TFieldValues>) {
  const context = useFormContext<TFieldValues>(); // Get context if Control prop isn't provided
  const effectiveControl = control || context?.control;

  if (!effectiveControl) {
    // Consider a more user-friendly error or a way to handle this,
    // e.g. if not in FormProvider and no control prop.
    console.error("FormFieldWithLabel must be used within a FormProvider or have a Control prop.");
    // Potentially return null or a specific error component
    // For now, to avoid breaking apps, let RHF handle the error if control is undefined.
  }

  return (
    <FormField
      control={effectiveControl}
      name={name}
      rules={rules}
      render={({ field, fieldState, formState }) => (
        <FormItem className={cn("space-y-1", className)}>
          <div className="flex items-center">
            <FormLabel className={cn(labelClassName)} htmlFor={field.name}>
              {label}
            </FormLabel>
            {tooltipContent && (
              <TooltipProvider delayDuration={300}>
                <Tooltip side={tooltipSide}>
                  <TooltipTrigger asChild>
                    <Info className="ml-1.5 h-4 w-4 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {typeof tooltipContent === 'string' ? <p>{tooltipContent}</p> : tooltipContent}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {/* The render prop is responsible for rendering the actual input control */}
          {/* It receives field, fieldState, and formState */}
          {render({ field, fieldState, formState })}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Export default if it's the main export, or named if part of a larger UI kit
export default FormFieldWithLabel;
