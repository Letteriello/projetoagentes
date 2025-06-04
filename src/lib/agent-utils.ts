import { SavedAgentConfiguration } from '@/types/agent-configs-new';
import * as yaml from 'js-yaml';

interface AgentCardMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  a2aEnabled?: boolean;
  a2aCommunicationChannels?: SavedAgentConfiguration['config']['a2a']['communicationChannels'];
  // Add other relevant fields for interoperability as they are defined.
  // For example, public keys, endpoint URLs, etc.
  // Assuming 'config.security.publicKey' might be a field for a public key
  publicKey?: string;
  // Assuming 'config.connectors.http.endpoint' might be an endpoint
  httpEndpoint?: string;
}

const selectAgentMetadata = (agentData: SavedAgentConfiguration): AgentCardMetadata => {
  const metadata: AgentCardMetadata = {
    id: agentData.id,
    name: agentData.name,
    description: agentData.description,
    version: agentData.version,
  };

  if (agentData.config?.a2a?.enabled) {
    metadata.a2aEnabled = true;
    metadata.a2aCommunicationChannels = agentData.config.a2a.communicationChannels?.map(channel => ({
      id: channel.id,
      name: channel.name,
      direction: channel.direction,
      messageFormat: channel.messageFormat,
      syncMode: channel.syncMode,
      targetAgentId: channel.targetAgentId,
      schema: channel.schema, // Include schema if present
    }));
  }

  // Example of how to include other potential metadata:
  if (agentData.config?.security?.publicKey) {
    metadata.publicKey = agentData.config.security.publicKey;
  }

  if (agentData.config?.connectors?.http?.endpoint) {
    metadata.httpEndpoint = agentData.config.connectors.http.endpoint;
  }

  // Add more fields as they become standardized in SavedAgentConfiguration
  // e.g., from agentData.config.capabilities, agentData.config.tools, etc.

  return metadata;
};

export const generateAgentCardJson = (agentData: SavedAgentConfiguration): string => {
  const metadata = selectAgentMetadata(agentData);
  return JSON.stringify(metadata, null, 2);
};

export const generateAgentCardYaml = (agentData: SavedAgentConfiguration): string => {
  const metadata = selectAgentMetadata(agentData);
  return yaml.dump(metadata);
};
