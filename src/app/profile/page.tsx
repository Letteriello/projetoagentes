"use client";

import * as React from "react";
// useForm and FormProvider will be removed as BaseForm handles them
import { SubmitHandler } from "react-hook-form"; // Keep SubmitHandler for typing
import { zodResolver } from "@hookform/resolvers/zod"; // Keep for schema
import { Button } from "@/components/ui/button"; // Keep for BaseForm's buttons, though BaseForm imports its own
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// Label is replaced by FormLabel
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { User, Brain, StickyNote, Save } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { profileFormSchema, ProfileFormData } from "@/lib/zod-schemas";
import withAuth from '@/components/auth/withAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import BaseForm from '@/components/shared/BaseForm'; // Import BaseForm

function ProfilePage() {
  const { toast } = useToast();
  const { saveProfile, loadProfile } = useUserProfile();

  // useForm and FormProvider are removed. BaseForm will handle this.
  // Default values will be passed to BaseForm.
  const defaultValues: ProfileFormData = {
    fullName: "",
    birthDate: "",
    email: "",
    agentInstructions: "",
    globalMemory: "",
    allowMemoryAccess: true,
  };

  // State for actual default values to be used by the form, loaded from localStorage
  const [formDefaultValues, setFormDefaultValues] = React.useState<ProfileFormData>(defaultValues);

  React.useEffect(() => {
    const loadedData = loadProfile();
    if (loadedData) {
      setFormDefaultValues(loadedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Load profile once on mount

  const handleProfileSubmit: SubmitHandler<ProfileFormData> = (data) => {
    saveProfile(data);
    // console.log("Validated profile data:", data);
    toast({
      title: "Perfil Atualizado!",
      description: "Suas informações foram salvas com sucesso no localStorage.",
    });
  };

  // The key for BaseForm ensures it re-initializes with new defaultValues when they change
  return (
    <BaseForm
      key={JSON.stringify(formDefaultValues)} // Re-initialize form when default values change after load
      onSubmit={handleProfileSubmit}
      defaultValues={formDefaultValues}
      validationSchema={profileFormSchema}
      className="space-y-8 p-4 md:p-6 lg:p-8"
      submitButtonText="Salvar Alterações"
      hideCancelButton={true} // Assuming no cancel button for profile page for now
    >
      <header className="flex items-center gap-3">
        <User className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna de Informações Pessoais e Instruções */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} className="text-primary/80" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Gerencie suas informações pessoais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                // control prop is no longer needed here, BaseForm's FormProvider provides it
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="fullName">Nome Completo</FormLabel>
                    <FormControl>
                      <Input id="fullName" {...field} placeholder="Seu nome completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="birthDate">Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input id="birthDate" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="email">E-mail</FormLabel>
                      <FormControl>
                        <Input id="email" type="email" {...field} placeholder="seu.email@exemplo.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain size={20} className="text-primary/80" />
                Instruções para Agentes
              </CardTitle>
              <CardDescription>
                O que os agentes precisam saber sobre você para te ajudar
                melhor? (Semelhante às instruções personalizadas do ChatGPT)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                name="agentInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="agentInstructions" className="sr-only">Instruções para Agentes</FormLabel>
                    <FormControl>
                      <Textarea
                        id="agentInstructions"
                        {...field}
                        placeholder="Ex: Eu prefiro respostas concisas. Tenho interesse em tecnologia e ciência. Quando estiver falando sobre programação, use exemplos em Python..."
                        rows={8}
                        className="min-h-[150px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Coluna de Memória Global */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote size={20} className="text-primary/80" />
                Minha Memória Global
              </CardTitle>
              <CardDescription>
                Armazene informações importantes aqui que podem ser acessadas
                pelos seus agentes (se permitido).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col space-y-4">
              <FormField
                name="globalMemory"
                render={({ field }) => (
                  <FormItem className="flex-grow flex flex-col">
                    <FormLabel htmlFor="globalMemory" className="sr-only">Minha Memória Global</FormLabel>
                    <FormControl className="flex-grow">
                      <Textarea
                        id="globalMemory"
                        {...field}
                        placeholder="Ex: Meu time de futebol favorito é o Electron FC. Meu próximo projeto é sobre energias renováveis. Contato de emergência: João (11) 99999-8888..."
                        rows={10}
                        className="flex-grow min-h-[200px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="allowMemoryAccess"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-auto">
                     <FormLabel htmlFor="allowMemoryAccess" className="text-sm mb-0">
                      Permitir que agentes acessem esta memória global
                    </FormLabel>
                    <FormControl>
                      <Switch
                        id="allowMemoryAccess"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Submit button is now rendered by BaseForm */}
    </BaseForm>
  );
}

export default withAuth(ProfilePage);
