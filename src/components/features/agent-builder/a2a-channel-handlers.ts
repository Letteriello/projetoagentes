import { UseFormReturn } from "react-hook-form";
import {
  A2AConfig as A2AConfigType,
  CommunicationChannel,
} from '@/types/agent-configs-fixed';
import { SavedAgentConfiguration } from "@/types/agent-types";

export const handleAddCommunicationChannel = (
  methods: UseFormReturn<SavedAgentConfiguration>,
  currentConfig?: A2AConfigType,
) => {
  const currentChannels = currentConfig?.communicationChannels || [];
  const newChannel: CommunicationChannel = {
    id: `channel-${Date.now()}`,
    name: `Channel ${currentChannels.length + 1}`,
    direction: "bidirectional",
    messageFormat: "json",
    syncMode: "async",
  };

  methods.setValue("config.a2a.communicationChannels", [...currentChannels, newChannel], { shouldValidate: true, shouldDirty: true });
};

// Generic update function - can be kept if direct updates are still needed elsewhere,
// or removed if all updates go through specific handlers.
// For now, let's assume specific handlers will call this or directly setValue.
const updateChannelProperty = (
  methods: UseFormReturn<SavedAgentConfiguration>,
  currentConfig: A2AConfigType,
  index: number,
  channelUpdates: Partial<CommunicationChannel>,
) => {
  const currentChannels = currentConfig.communicationChannels || [];
  if (index < 0 || index >= currentChannels.length) return;

  const newChannels = [...currentChannels];
  newChannels[index] = { ...newChannels[index], ...channelUpdates };
  methods.setValue("config.a2a.communicationChannels", newChannels, { shouldValidate: true, shouldDirty: true });
};

export const handleUpdateChannelName = (
  methods: UseFormReturn<SavedAgentConfiguration>,
  currentConfig: A2AConfigType,
  index: number,
  name: string,
) => {
  updateChannelProperty(methods, currentConfig, index, { name });
};

export const handleUpdateChannelDirection = (
  methods: UseFormReturn<SavedAgentConfiguration>,
  currentConfig: A2AConfigType,
  index: number,
  direction: "inbound" | "outbound" | "bidirectional",
) => {
  updateChannelProperty(methods, currentConfig, index, { direction });
};

export const handleUpdateChannelMessageFormat = (
  methods: UseFormReturn<SavedAgentConfiguration>,
  currentConfig: A2AConfigType,
  index: number,
  messageFormat: "json" | "text" | "binary",
) => {
  updateChannelProperty(methods, currentConfig, index, { messageFormat });
};

export const handleUpdateChannelSyncMode = (
  methods: UseFormReturn<SavedAgentConfiguration>,
  currentConfig: A2AConfigType,
  index: number,
  syncMode: "sync" | "async",
) => {
  const currentChannels = currentConfig.communicationChannels || [];
  if (index < 0 || index >= currentChannels.length) return;
  const channel = currentChannels[index];
  const retryPolicy = syncMode === 'async' ? undefined : channel.retryPolicy;
  updateChannelProperty(methods, currentConfig, index, { syncMode, retryPolicy });
};

export const handleUpdateChannelRetryPolicy = (
  methods: UseFormReturn<SavedAgentConfiguration>,
  currentConfig: A2AConfigType,
  index: number,
  retryPolicy: CommunicationChannel['retryPolicy'],
) => {
  updateChannelProperty(methods, currentConfig, index, { retryPolicy });
};

export const handleUpdateChannelSchema = (
  methods: UseFormReturn<SavedAgentConfiguration>,
  currentConfig: A2AConfigType,
  index: number,
  schema: string,
) => {
  updateChannelProperty(methods, currentConfig, index, { schema });
};

export const handleUpdateChannelTargetAgentId = (
  methods: UseFormReturn<SavedAgentConfiguration>,
  currentConfig: A2AConfigType,
  index: number,
  targetAgentId: string | undefined,
) => {
  updateChannelProperty(methods, currentConfig, index, { targetAgentId });
};


// Note: The original handleUpdateChannel is effectively replaced by updateChannelProperty
// and the specific handlers. If it was directly used, those usages need to be updated.
// For this refactoring, we'll assume it's no longer directly called from the component.
// We can remove it if it's confirmed to be unused after refactoring a2a-config.tsx.
// For now, I'll leave it commented out or remove it if confident.
// export const handleUpdateChannel = (
//   methods: UseFormReturn<SavedAgentConfiguration>,
//   currentConfig: A2AConfigType, // Assuming currentConfig is always defined when updating
//   index: number,
//   updatedChannel: CommunicationChannel,
// ) => {
//   const currentChannels = currentConfig.communicationChannels || [];
//   const newChannels = [...currentChannels];
//   newChannels[index] = updatedChannel;
//   methods.setValue("config.a2a.communicationChannels", newChannels, { shouldValidate: true, shouldDirty: true });
// };


export const handleDeleteChannel = (
  methods: UseFormReturn<SavedAgentConfiguration>,
  currentConfig: A2AConfigType, // Assuming currentConfig is always defined when deleting
  index: number,
) => {
  const currentChannels = currentConfig.communicationChannels || [];
  const newChannels = [...currentChannels];
  newChannels.splice(index, 1);
  methods.setValue("config.a2a.communicationChannels", newChannels, { shouldValidate: true, shouldDirty: true });
};
