"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog";
import { Button } from "./button";
import { Cpu, MessageSquare, KeyRound } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const steps = [
    {
      step: 1,
      title: "Criar Primeiro Agente",
      description: "Comece criando seu primeiro agente inteligente.",
      icon: <Cpu className="h-12 w-12 mb-4 text-primary" />,
      link: "/agent-builder",
      nextButtonText: "Próximo",
    },
    {
      step: 2,
      title: "Testar no Chat",
      description: "Interaja com seu agente e veja-o em ação.",
      icon: <MessageSquare className="h-12 w-12 mb-4 text-primary" />,
      link: "/chat",
      nextButtonText: "Próximo",
    },
    {
      step: 3,
      title: "Configurar Chaves API",
      description: "Configure suas chaves de API para conectar-se a serviços externos.",
      icon: <KeyRound className="h-12 w-12 mb-4 text-primary" />,
      link: "/api-key-vault",
      nextButtonText: "Concluir",
    },
  ];

  const currentStepData = steps[currentStep - 1];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl mb-2">
            {currentStepData.icon}
            {currentStepData.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>
        <div className="my-6 text-center">
          <Link href={currentStepData.link} passHref>
            <Button variant="outline" onClick={handleClose}>Ir para {currentStepData.title}</Button>
          </Link>
        </div>
        <DialogFooter className="flex justify-between w-full">
          {currentStep > 1 && (
            <Button variant="ghost" onClick={handlePrevious}>
              Anterior
            </Button>
          )}
          <div className="flex-grow"></div> {/* Spacer */}
          <Button onClick={handleNext}>
            {currentStepData.nextButtonText}
          </Button>
        </DialogFooter>
         <div className="flex justify-center mt-4">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className={`w-2 h-2 rounded-full mx-1 ${
                  currentStep === step.step ? "bg-primary" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
