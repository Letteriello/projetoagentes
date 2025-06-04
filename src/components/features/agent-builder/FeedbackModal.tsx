'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

// Esquema de validação com Zod
const feedbackSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }).optional(),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido' }).optional(),
  message: z.string().min(10, { message: 'A mensagem deve ter pelo menos 10 caracteres' }),
  rating: z.number().min(1, { message: 'Por favor, avalie de 1 a 5 estrelas' }).max(5),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ isOpen, onOpenChange }: FeedbackModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      rating: 5,
    },
  });

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      setIsSubmitting(true);
      // Aqui você pode adicionar a lógica para enviar o feedback
      // Por exemplo, uma chamada para uma API
      console.log('Feedback enviado:', data);
      
      // Simulando uma requisição assíncrona
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Obrigado pelo seu feedback!',
        description: 'Sua opinião é muito importante para nós.',
      });
      
      // Fecha o modal e reseta o formulário
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao enviar seu feedback. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
          <DialogDescription>
            Sua opinião é muito importante para melhorarmos nossa plataforma.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome (opcional)</Label>
            <Input 
              id="name" 
              placeholder="Seu nome" 
              {...register('name')} 
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">E-mail (opcional)</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com" 
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rating">Avaliação</Label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <React.Fragment key={star}>
                  <input
                    type="radio"
                    id={`star${star}`}
                    value={star}
                    className="sr-only"
                    {...register('rating', { valueAsNumber: true })}
                  />
                  <label
                    htmlFor={`star${star}`}
                    className="text-2xl cursor-pointer"
                    title={`${star} estrela${star > 1 ? 's' : ''}`}
                  >
                    {star <= (watch ? watch('rating') : 5) ? '★' : '☆'}
                  </label>
                </React.Fragment>
              ))}
            </div>
            {errors.rating && (
              <p className="text-sm text-red-500">{errors.rating.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              placeholder="Conte-nos o que você achou..."
              className="min-h-[120px]"
              {...register('message')}
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="text-sm text-red-500">{errors.message.message}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Adiciona o hook watch para acompanhar as mudanças no formulário
function useWatchForm<T>(form: any, fieldName: string) {
  const [value, setValue] = React.useState<T>();
  
  React.useEffect(() => {
    const subscription = form.watch((value: any) => {
      setValue(value[fieldName]);
    });
    
    return () => subscription.unsubscribe();
  }, [form, fieldName]);
  
  return value;
}

// Componente auxiliar para usar o hook useWatch
function WatchForm({ form, fieldName, children }: { form: any; fieldName: string; children: (value: any) => React.ReactNode }) {
  const value = useWatchForm(form, fieldName);
  return <>{children(value)}</>;
}

// Adiciona o hook watch ao componente
FeedbackModal.displayName = 'FeedbackModal';
const FeedbackModalWithWatch = (props: FeedbackModalProps) => {
  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      rating: 5,
    },
  });
  
  const watch = form.watch;
  
  return (
    <WatchForm form={form} fieldName="rating">
      {(rating) => (
        <FeedbackModal {...props} watch={() => rating} />
      )}
    </WatchForm>
  );
};

export default FeedbackModalWithWatch;
