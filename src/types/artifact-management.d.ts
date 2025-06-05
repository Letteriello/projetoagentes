// Type definitions for artifact management

declare module '../../types/agent-configs-new' {
  export interface ArtifactStorageType {
    type: string;
    path: string;
    options?: Record<string, any>;
  }
}

// Add any additional types needed for artifact management
declare module 'genkit' {
  export interface Artifact {
    id: string;
    type: string;
    data: any;
    metadata?: Record<string, any>;
  }

  export interface ArtifactStorage {
    save(artifact: Artifact): Promise<void>;
    load(id: string): Promise<Artifact | null>;
    list(options?: { type?: string }): Promise<Artifact[]>;
    delete(id: string): Promise<boolean>;
  }
}

export {};
