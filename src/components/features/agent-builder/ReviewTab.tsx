"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import type { SavedAgentConfiguration } from '@/types/agent-configs-fixed';
import { Button } from "@/components/ui/button"; // Added import

interface ReviewTabProps {
  setActiveEditTab?: (tabName: string) => void;
}

const ReviewTab: React.FC<ReviewTabProps> = ({ setActiveEditTab }) => {
  const { watch } = useFormContext<SavedAgentConfiguration>();

  // Watch all form values
  const formData = watch();

  const renderValue = (value: any, fieldName?: string) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground">Not set</span>;
    }
    if (typeof value === 'boolean') {
      return value ? "Enabled" : "Disabled";
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground">Empty</span>;
      }
      // For specific arrays like tools, display them nicely.
      if (fieldName === "tools" && value.every(item => typeof item === 'string')) {
        return value.join(", ");
      }
      return (
        <pre className="whitespace-pre-wrap text-sm bg-muted p-2 rounded-md">
          <code>{JSON.stringify(value, null, 2)}</code>
        </pre>
      );
    }
    if (typeof value === 'object') {
      return (
        <pre className="whitespace-pre-wrap text-sm bg-muted p-2 rounded-md">
          <code>{JSON.stringify(value, null, 2)}</code>
        </pre>
      );
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Review Configuration</AlertTitle>
        <AlertDescription>
          Please review all the agent settings below before saving. This is a read-only summary.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="relative">
          <CardTitle>General Information</CardTitle>
          <CardDescription>Basic details and type of the agent.</CardDescription>
          {setActiveEditTab && (
            <Button variant="link" size="sm" onClick={() => setActiveEditTab("general")} className="absolute top-2 right-2 h-auto p-1">Edit</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div><strong>Agent Name:</strong> {renderValue(formData.agentName)}</div>
          <div><strong>Description:</strong> {renderValue(formData.agentDescription)}</div>
          <div><strong>Version:</strong> {renderValue(formData.agentVersion)}</div>
          <div><strong>Icon:</strong> {renderValue(formData.icon)}</div>
          <div><strong>Type:</strong> {renderValue(formData.config?.type)}</div>
          <div><strong>Framework:</strong> {renderValue(formData.config?.framework)}</div>
        </CardContent>
      </Card>

      <Separator />

      {formData.config?.type === "llm" && (
        <Card>
          <CardHeader className="relative">
            <CardTitle>LLM Configuration</CardTitle>
            <CardDescription>Settings specific to LLM agents.</CardDescription>
            {setActiveEditTab && (
              <Button variant="link" size="sm" onClick={() => setActiveEditTab("behavior")} className="absolute top-2 right-2 h-auto p-1">Edit</Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div><strong>Goal:</strong> {renderValue(formData.config.agentGoal)}</div>
            <div><strong>Tasks:</strong> {renderValue(formData.config.agentTasks, "agentTasks")}</div>
            <div><strong>Personality/Tone:</strong> {renderValue(formData.config.agentPersonality)}</div>
            <div><strong>Restrictions:</strong> {renderValue(formData.config.agentRestrictions)}</div>
            <div><strong>Model:</strong> {renderValue(formData.config.agentModel)}</div>
            <div><strong>Temperature:</strong> {renderValue(formData.config.agentTemperature)}</div>
            <div><strong>Generated System Prompt:</strong> <pre className="whitespace-pre-wrap text-sm bg-muted p-2 rounded-md"><code>{renderValue(formData.config.systemPromptGenerated)}</code></pre></div>
          </CardContent>
        </Card>
      )}

      {formData.config?.type === "workflow" && (
         <Card>
           <CardHeader className="relative">
             <CardTitle>Workflow Configuration</CardTitle>
             <CardDescription>Settings specific to Workflow agents.</CardDescription>
             {setActiveEditTab && (
               <Button variant="link" size="sm" onClick={() => setActiveEditTab("behavior")} className="absolute top-2 right-2 h-auto p-1">Edit</Button>
             )}
           </CardHeader>
           <CardContent className="space-y-3">
            <div><strong>Workflow Description:</strong> {renderValue(formData.config.workflowDescription)}</div>
            <div><strong>Detailed Workflow Type:</strong> {renderValue(formData.config.detailedWorkflowType)}</div>
            {formData.config.detailedWorkflowType === 'loop' && (
              <>
                <div><strong>Loop Max Iterations:</strong> {renderValue(formData.config.loopMaxIterations)}</div>
                <div><strong>Loop Termination Condition:</strong> {renderValue(formData.config.loopTerminationConditionType)}</div>
                <div><strong>Loop Exit Tool:</strong> {renderValue(formData.config.loopExitToolName)}</div>
                <div><strong>Loop Exit State Key:</strong> {renderValue(formData.config.loopExitStateKey)}</div>
                <div><strong>Loop Exit State Value:</strong> {renderValue(formData.config.loopExitStateValue)}</div>
              </>
            )}
           </CardContent>
         </Card>
      )}

      {formData.config?.type === "custom" && (
        <Card>
          <CardHeader className="relative">
            <CardTitle>Custom Logic Configuration</CardTitle>
            <CardDescription>Settings specific to Custom Logic agents.</CardDescription>
            {setActiveEditTab && (
              <Button variant="link" size="sm" onClick={() => setActiveEditTab("behavior")} className="absolute top-2 right-2 h-auto p-1">Edit</Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div><strong>Custom Logic Description:</strong> {renderValue(formData.config.customLogicDescription)}</div>
            <div><strong>Genkit Flow Name:</strong> {renderValue(formData.config.genkitFlowName)}</div>
          </CardContent>
        </Card>
      )}


      <Separator />

      <Card>
        <CardHeader className="relative">
          <CardTitle>Tools</CardTitle>
          <CardDescription>Selected tools and their configurations.</CardDescription>
          {setActiveEditTab && (
            <Button variant="link" size="sm" onClick={() => setActiveEditTab("tools")} className="absolute top-2 right-2 h-auto p-1">Edit</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div><strong>Selected Tools:</strong> {renderValue(formData.tools, "tools")}</div>
          <div>
            <strong>Tool Configurations Applied:</strong>
            {formData.toolConfigsApplied && Object.keys(formData.toolConfigsApplied).length > 0 ? renderValue(formData.toolConfigsApplied) : <span className="text-muted-foreground"> None</span>}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader className="relative">
          <CardTitle>Memory & Knowledge</CardTitle>
          <CardDescription>State persistence and RAG settings.</CardDescription>
          {setActiveEditTab && (
            <Button variant="link" size="sm" onClick={() => setActiveEditTab("memory_knowledge")} className="absolute top-2 right-2 h-auto p-1">Edit</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <section>
            <h4 className="font-semibold mb-2">State Persistence</h4>
            <div><strong>Enabled:</strong> {renderValue(formData.config?.statePersistence?.enabled)}</div>
            {formData.config?.statePersistence?.enabled && (
              <>
                <div><strong>Type:</strong> {renderValue(formData.config.statePersistence.type)}</div>
                <div><strong>Default Scope:</strong> {renderValue(formData.config.statePersistence.defaultScope)}</div>
                <div><strong>TTL (seconds):</strong> {renderValue(formData.config.statePersistence.timeToLiveSeconds)}</div>
                <div><strong>Initial State Values:</strong> {renderValue(formData.config.statePersistence.initialStateValues)}</div>
                <div><strong>Validation Rules:</strong> {renderValue(formData.config.statePersistence.validationRules)}</div>
              </>
            )}
          </section>
          <Separator />
          <section>
            <h4 className="font-semibold mb-2">Retrieval Augmented Generation (RAG)</h4>
            <div><strong>Enabled:</strong> {renderValue(formData.config?.rag?.enabled)}</div>
            {formData.config?.rag?.enabled && (
              <>
                <div><strong>Service Type:</strong> {renderValue(formData.config.rag.serviceType)}</div>
                <div><strong>Knowledge Sources:</strong> {renderValue(formData.config.rag.knowledgeSources)}</div>
                <div><strong>Persistent Memory:</strong> {renderValue(formData.config.rag.persistentMemory)}</div>
                <div><strong>Retrieval Parameters:</strong> {renderValue(formData.config.rag.retrievalParameters)}</div>
                <div><strong>Embedding Model:</strong> {renderValue(formData.config.rag.embeddingModel)}</div>
                <div><strong>Include Conversation Context:</strong> {renderValue(formData.config.rag.includeConversationContext)}</div>
              </>
            )}
          </section>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader className="relative">
          <CardTitle>Artifacts</CardTitle>
          <CardDescription>Settings for agent-generated artifacts.</CardDescription>
          {setActiveEditTab && (
            <Button variant="link" size="sm" onClick={() => setActiveEditTab("artifacts")} className="absolute top-2 right-2 h-auto p-1">Edit</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div><strong>Enabled:</strong> {renderValue(formData.config?.artifacts?.enabled)}</div>
          {formData.config?.artifacts?.enabled && (
            <>
              <div><strong>Storage Type:</strong> {renderValue(formData.config.artifacts.storageType)}</div>
              {formData.config.artifacts.storageType === 'cloud' && <div><strong>Cloud Storage Bucket:</strong> {renderValue(formData.config.artifacts.cloudStorageBucket)}</div>}
              {formData.config.artifacts.storageType === 'local' && <div><strong>Local Storage Path:</strong> {renderValue(formData.config.artifacts.localStoragePath)}</div>}
              <div><strong>Artifact Definitions:</strong> {renderValue(formData.config.artifacts.definitions)}</div>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader className="relative">
          <CardTitle>Agent-to-Agent (A2A) Communication</CardTitle>
          <CardDescription>Settings for communication with other agents.</CardDescription>
          {setActiveEditTab && (
            <Button variant="link" size="sm" onClick={() => setActiveEditTab("a2a")} className="absolute top-2 right-2 h-auto p-1">Edit</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div><strong>Enabled:</strong> {renderValue(formData.config?.a2a?.enabled)}</div>
          {formData.config?.a2a?.enabled && (
            <>
              <div><strong>Communication Channels:</strong> {renderValue(formData.config.a2a.communicationChannels)}</div>
              <div><strong>Default Response Format:</strong> {renderValue(formData.config.a2a.defaultResponseFormat)}</div>
              <div><strong>Max Message Size (bytes):</strong> {renderValue(formData.config.a2a.maxMessageSize)}</div>
              <div><strong>Logging Enabled:</strong> {renderValue(formData.config.a2a.loggingEnabled)}</div>
              <div><strong>Security Policy:</strong> {renderValue(formData.config.a2a.securityPolicy)}</div>
              <div><strong>API Key Header Name:</strong> {renderValue(formData.config.a2a.apiKeyHeaderName)}</div>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader className="relative">
          <CardTitle>Multi-Agent & Advanced</CardTitle>
          <CardDescription>Hierarchy, collaboration, and other advanced settings.</CardDescription>
          {setActiveEditTab && (
            <Button variant="link" size="sm" onClick={() => setActiveEditTab("multi_agent_advanced")} className="absolute top-2 right-2 h-auto p-1">Edit</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div><strong>Is Root Agent:</strong> {renderValue(formData.config?.isRootAgent)}</div>
          <div><strong>Sub-Agent IDs:</strong> {renderValue(formData.config?.subAgentIds, "subAgentIds")}</div>
          <div><strong>Global Instruction for Sub-Agents:</strong> <pre className="whitespace-pre-wrap text-sm bg-muted p-2 rounded-md"><code>{renderValue(formData.config?.globalInstruction)}</code></pre></div>
        </CardContent>
      </Card>

      <Separator />
      <Card>
        <CardHeader className="relative">
          <CardTitle>Advanced ADK Callbacks</CardTitle>
          <CardDescription>Configuration for ADK lifecycle callbacks.</CardDescription>
          {setActiveEditTab && (
            <Button variant="link" size="sm" onClick={() => setActiveEditTab("advanced")} className="absolute top-2 right-2 h-auto p-1">Edit</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div><strong>Before Agent:</strong> {renderValue(formData.config?.adkCallbacks?.beforeAgent)}</div>
          <div><strong>After Agent:</strong> {renderValue(formData.config?.adkCallbacks?.afterAgent)}</div>
          <div><strong>Before Model:</strong> {renderValue(formData.config?.adkCallbacks?.beforeModel)}</div>
          <div><strong>After Model:</strong> {renderValue(formData.config?.adkCallbacks?.afterModel)}</div>
          <div><strong>Before Tool:</strong> {renderValue(formData.config?.adkCallbacks?.beforeTool)}</div>
          <div><strong>After Tool:</strong> {renderValue(formData.config?.adkCallbacks?.afterTool)}</div>
        </CardContent>
      </Card>

    </div>
  );
};

export default ReviewTab;
