'use client';

import * as React from 'react';
import { useForm, useWatch, type FieldValues, type UseFormWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

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
  watch?: UseFormWatch<FeedbackFormData>;
}

const FeedbackModal = ({ isOpen, onOpenChange, watch }: FeedbackModalProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  
  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      rating: 5,
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
    setValue,
    getValues,
  } = form;

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      setIsSubmitting(true);
      
      // Simulando uma requisição assíncrona
      await new Promise<void>((resolve) => {
        console.log('Enviando feedback:', data);
        setTimeout(resolve, 1000);
      });
      
      // Mostrar mensagem de sucesso
      toast({
        title: 'Feedback enviado!',
        description: 'Obrigado pelo seu feedback.',
      });
      
      // Fechar o modal e resetar o formulário
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast({
        title: 'Erro ao enviar feedback',
        description: 'Ocorreu um erro ao enviar seu feedback. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
          <DialogDescription>
            Sua opinião é muito importante para nós. Conte-nos o que achou!
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
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              placeholder="Conte-nos o que você achou..."
              className="min-h-[100px]"
              {...register('message')}
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="text-sm text-red-500">{errors.message.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Avaliação *</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isSelected = getValues('rating') >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    className={`text-2xl transition-colors ${isSelected ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                    onClick={() => setValue('rating', star, { shouldValidate: true })}
                    disabled={isSubmitting}
                    aria-label={`Avaliar com ${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
                    aria-pressed={isSelected}
                  >
                    <span className="sr-only">{star} {star === 1 ? 'estrela' : 'estrelas'}</span>
                    <span aria-hidden="true">★</span>
                  </button>
                );
              })}
            </div>
            {errors.rating && (
              <p className="text-sm text-red-500">{errors.rating.message}</p>
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
};

FeedbackModal.displayName = 'FeedbackModal';

const FeedbackModalWithWatch: React.FC<Omit<FeedbackModalProps, 'watch'>> = ({
  isOpen,
  onOpenChange,
}) => {
  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      rating: 5,
    },
  });

  return (
    <FeedbackModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      watch={form.watch}
    />
  );
};

export default FeedbackModalWithWatch;
