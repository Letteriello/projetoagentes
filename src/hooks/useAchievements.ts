"use client";

import { useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Trophy } from 'lucide-react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  unlocked: boolean;
}

const PREDEFINED_ACHIEVEMENTS: Omit<Achievement, 'unlocked'>[] = [
  {
    id: 'agent-created',
    name: 'Primeiro Agente Criado',
    description: 'Você construiu seu primeiro agente!',
    icon: <Trophy className="h-4 w-4" />
  },
  {
    id: 'first-chat',
    name: 'Primeira Conversa',
    description: 'Você iniciou sua primeira conversa com um agente!',
    icon: <Trophy className="h-4 w-4" />
  },
  {
    id: 'five-agents',
    name: 'Construtor Ativo',
    description: 'Você criou 5 agentes!',
    icon: <Trophy className="h-4 w-4" />
  },
  {
    id: 'tool-used',
    name: 'Primeira Ferramenta Usada',
    description: 'Seu agente utilizou uma ferramenta pela primeira vez!',
    icon: <Trophy className="h-4 w-4" />
  },
  // Future achievements can be added here
  // {
  //   id: 'api-key-configured',
  //   name: 'API Configurada',
  //   description: 'Você configurou sua primeira chave de API!',
  //   icon: <KeyRound className="h-4 w-4" />,
  // },
  // {
  //   id: 'agent-published',
  //   name: 'Agente Publicado',
  //   description: 'Você publicou um agente na comunidade!',
  //   icon: <Share2 className="h-4 w-4" />,
  // },
];

const LOCAL_STORAGE_KEY = 'unlockedAchievements';

export const useAchievements = () => {
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const initialAchievements = PREDEFINED_ACHIEVEMENTS.map(ach => ({ ...ach, unlocked: false }));
    if (typeof window === 'undefined') {
      return initialAchievements;
    }
    try {
      const storedUnlockedIds = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedUnlockedIds) {
        const unlockedIds = JSON.parse(storedUnlockedIds) as string[];
        return initialAchievements.map(ach =>
          unlockedIds.includes(ach.id) ? { ...ach, unlocked: true } : ach
        );
      }
    } catch (error) {
      console.error("Failed to load achievements from localStorage:", error);
    }
    return initialAchievements;
  });

  useEffect(() => {
    // This effect can be used if we need to react to changes that might affect achievements
    // For now, initialization is done directly in useState's initial function.
    // If localStorage could be updated by another tab, we might need to listen to storage events.
  }, []);

  const updateLocalStorage = (unlockedIds: string[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(unlockedIds));
    }
  };

  const unlockAchievement = (id: string) => {
    setAchievements(prevAchievements => {
      const achievementToUnlock = prevAchievements.find(ach => ach.id === id);
      if (achievementToUnlock && !achievementToUnlock.unlocked) {
        const newAchievements = prevAchievements.map(ach =>
          ach.id === id ? { ...ach, unlocked: true } : ach
        );
        const unlockedIds = newAchievements.filter(ach => ach.unlocked).map(ach => ach.id);
        updateLocalStorage(unlockedIds);

        toast({
          title: "Conquista Desbloqueada!",
          description: (
            <div className="flex items-center">
              {achievementToUnlock.icon && <span className="mr-2">{achievementToUnlock.icon}</span>}
              {achievementToUnlock.name}
            </div>
          ),
        });
        return newAchievements;
      }
      return prevAchievements;
    });
  };

  const getUnlockedAchievements = (): Achievement[] => {
    return achievements.filter(ach => ach.unlocked);
  };

  const resetAchievements = () => {
    setAchievements(prev => prev.map(ach => ({ ...ach, unlocked: false })));
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    toast({
      title: "Conquistas Resetadas",
      description: "Todas as suas conquistas foram bloqueadas.",
    });
  };

  return { achievements, unlockAchievement, getUnlockedAchievements, resetAchievements };
};
