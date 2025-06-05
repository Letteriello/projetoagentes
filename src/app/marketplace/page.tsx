"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Cpu, MessageSquareText, BarChart3, Icon as LucideIcon, Store, LayoutGrid, ShoppingBag, HelpCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { SavedAgentConfiguration, AgentConfig, AgentFramework, AvailableTool } from '@/types/agent-types'; // Adjusted imports

// Helper to get icon component
const iconMap: Record<string, LucideIcon> = {
  MessageSquareText,
  BarChart3,
  Cpu,
  Default: HelpCircle, // Fallback icon
};

const getIconComponent = (iconName?: string): React.ReactNode => {
  const Icon = iconName ? iconMap[iconName] : iconMap.Default;
  return Icon ? <Icon className="w-8 h-8 mr-4 text-primary" /> : <HelpCircle className="w-8 h-8 mr-4 text-primary" />;
};


interface MarketplaceAgent extends Partial<SavedAgentConfiguration> {
  isTemplate?: boolean;
  tags?: string[];
  icon?: string; // Icon name as string
  // Ensure config is at least AgentConfig or a more specific type if possible
  config: AgentConfig;
  tools?: string[]; // Representing tool IDs
}


const mockMarketplaceAgents: MarketplaceAgent[] = [
  {
    id: 'template-chat-assistant-01', // This will be the template ID
    agentName: 'Friendly Chatbot',
    agentDescription: 'A simple chatbot for engaging conversations, powered by Gemini Flash.',
    icon: 'MessageSquareText',
    isTemplate: true,
    config: {
      agentType: 'llm', // Corrected: 'type' should be 'agentType' based on AgentConfig
      framework: 'genkit' as AgentFramework,
      agentName: 'Friendly Chatbot (Copy)', // Default name for installed copy
      agentDescription: 'A simple chatbot for engaging conversations, powered by Gemini Flash.',
      agentGoal: 'Be a friendly and helpful chatbot.',
      agentModel: 'googleai/gemini-1.5-flash-latest',
      agentPersonality: 'Friendly and approachable',
      agentVersion: '1.0.0', // Added version
      // agentTools: [], // tools are listed separately in MarketplaceAgent for clarity
    } as AgentConfig, // Cast to base AgentConfig, specific types like LLMAgentConfig can be used if all fields are present
    tools: [],
    tags: ['chatbot', 'gemini', 'assistant'],
  },
  {
    id: 'template-data-processor-01',
    agentName: 'CSV Data Processor',
    agentDescription: 'Analyzes CSV files to extract key information. Uses a calculator tool.',
    icon: 'BarChart3',
    isTemplate: true,
    config: {
      agentType: 'workflow',
      framework: 'genkit' as AgentFramework,
      agentName: 'CSV Data Processor (Copy)',
      agentDescription: 'Analyzes CSV files to extract key information. Uses a calculator tool.',
      agentGoal: 'Process CSV data and provide a summary.',
      workflowDescription: '1. Load CSV. 2. Calculate column averages. 3. Output summary.',
      agentVersion: '1.0.0',
      // agentTools: ['calculator'],
    } as AgentConfig,
    tools: ['calculator'],
    tags: ['data', 'csv', 'analyzer', 'workflow'],
  },
];

const localStorageKey = 'userInstalledAgents';

export default function MarketplacePage() {
  const { toast } = useToast();
  const [installedAgents, setInstalledAgents] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    // Check localStorage for already installed agents to update button states
    const storedAgents = localStorage.getItem(localStorageKey);
    if (storedAgents) {
      try {
        const parsedAgents: SavedAgentConfiguration[] = JSON.parse(storedAgents);
        const installedMap: Record<string, boolean> = {};
        parsedAgents.forEach(agent => {
          if (agent.templateId) { // Assuming we store templateId when installing
            installedMap[agent.templateId] = true;
          }
        });
        setInstalledAgents(installedMap);
      } catch (e) {
        console.error("Failed to parse stored agents from localStorage", e);
      }
    }
  }, []);

  const handleInstallAgent = (templateAgent: MarketplaceAgent) => {
    if (!templateAgent.id) {
      toast({ title: 'Error', description: 'Template agent has no ID.', variant: 'destructive' });
      return;
    }

    const newAgentId = uuidv4(); // Generate a unique ID for the new instance

    // Create a new agent configuration based on the template
    const newAgentConfig: SavedAgentConfiguration = {
      ...templateAgent.config, // Spread the config from the template
      id: newAgentId,          // Assign the new unique ID
      templateId: templateAgent.id, // Store original template ID
      agentName: templateAgent.config.agentName || `${templateAgent.agentName} (Installed)`, // Ensure agentName exists
      agentDescription: templateAgent.config.agentDescription || templateAgent.agentDescription || '', // Ensure description
      agentVersion: templateAgent.config.agentVersion || '1.0.0',
      tools: templateAgent.tools || [], // Add tools to the root of SavedAgentConfiguration
      toolsDetails: [], // Typically populated later or if detailed tool info is in template
      toolConfigsApplied: {}, // Default empty config
      // Ensure all required fields from SavedAgentConfiguration are present
      agentType: templateAgent.config.agentType,
      // framework: templateAgent.config.framework, // framework is not in SavedAgentConfiguration, it's part of AgentConfig
    };

    try {
      const storedAgents = localStorage.getItem(localStorageKey);
      const agentsList: SavedAgentConfiguration[] = storedAgents ? JSON.parse(storedAgents) : [];

      // Check if an agent from this template ID was already installed (optional, good for UI)
      // This specific check might be redundant if button is disabled, but good for robustness
      const alreadyExists = agentsList.some(agent => agent.templateId === templateAgent.id && agent.id !== newAgentId);
      if (alreadyExists && installedAgents[templateAgent.id]) {
         // If we want to prevent re-installation from the same template shown in UI
         // toast({ title: 'Already Installed', description: `An agent from template "${templateAgent.agentName}" is already installed.`, variant: 'default' });
         // return;
         // For now, let's allow multiple installs from the same template, each gets a new ID.
      }

      agentsList.push(newAgentConfig);
      localStorage.setItem(localStorageKey, JSON.stringify(agentsList));

      setInstalledAgents(prev => ({ ...prev, [templateAgent.id!]: true }));
      toast({ title: 'Agent Installed', description: `"${newAgentConfig.agentName}" added to your agents.` });

    } catch (error: any) {
      console.error('Failed to install agent:', error);
      toast({ title: 'Installation Failed', description: error.message || 'Could not save agent to local storage.', variant: 'destructive' });
    }
  };

  return (
    <main className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Agent Marketplace</h1>
        <p className="text-muted-foreground mt-1">Discover and install ready-to-use agent templates.</p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Agent Templates</h2>
        {mockMarketplaceAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockMarketplaceAgents.map((agent) => (
              <Card key={agent.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-start">
                  {getIconComponent(agent.icon)}
                  <div>
                    <CardTitle>{agent.agentName}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-3">{agent.agentDescription}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  {/* <p className="text-sm text-muted-foreground">Version: {agent.config.agentVersion || 'N/A'}</p> */}
                  {agent.tags && agent.tags.length > 0 && (
                    <div className="mt-2">
                      {agent.tags.map(tag => (
                        <span key={tag} className="inline-block bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full mr-1 mb-1">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                   {agent.tools && agent.tools.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-foreground mb-1">Tools:</h4>
                      <ul className="list-disc list-inside pl-1 text-sm text-muted-foreground">
                        {agent.tools.map(toolId => <li key={toolId}>{toolId}</li>)}
                      </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleInstallAgent(agent)}
                    disabled={installedAgents[agent.id!]} // Disable if this template ID has been installed
                    className="w-full"
                  >
                    {installedAgents[agent.id!] ? 'Installed' : 'Install Agent'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No agent templates available at the moment.</p>
        )}
      </section>
    </main>
  );
}
