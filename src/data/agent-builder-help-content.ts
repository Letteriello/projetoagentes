// src/data/agent-builder-help-content.ts

interface HelpContent {
  tooltip?: string;
  modal?: {
    title: string;
    body: string | React.ReactNode; // Allow for JSX for richer content
    footer?: string | React.ReactNode;
  };
}

export const agentBuilderHelpContent: Record<string, Record<string, HelpContent>> = {
  generalTab: {
    agentName: {
      tooltip: "Choose a unique and descriptive name for your agent. This name will be used to identify the agent within the platform.",
      modal: {
        title: "Agent Name Guidelines",
        body: `
          <p>The agent name is a crucial identifier. Consider these points:</p>
          <ul>
            <li><strong>Clarity:</strong> Should reflect the agent's primary function (e.g., "SalesInquiryResponder", "DataAnalysisBot").</li>
            <li><strong>Uniqueness:</strong> Must be unique within your set of agents.</li>
            <li><strong>Naming Conventions:</strong> Follow any team-specific naming conventions.</li>
          </ul>
          <p>In Genkit, this name might be used for logging or identifying the agent flow if you deploy it as a distinct service.</p>
        `,
      },
    },
    description: {
      tooltip: "Briefly describe the agent's purpose, capabilities, and limitations.",
      modal: {
        title: "Writing Effective Agent Descriptions",
        body: `
          <p>A good description helps users and other developers understand what your agent does.</p>
          <ul>
            <li><strong>Purpose:</strong> What is the agent designed to achieve?</li>
            <li><strong>Capabilities:</strong> What can it do? (e.g., "Answers questions based on product documentation," "Generates Python code snippets").</li>
            <li><strong>Limitations:</strong> What are its known limitations? (e.g., "Does not handle real-time data," "Only understands English").</li>
            <li><strong>Genkit/ADK Context:</strong> This description can be used to generate system prompts for your Genkit agent or inform the metadata for an ADK agent. A well-crafted description can significantly improve the agent's performance and alignment with its intended role.</li>
          </ul>
        `,
      },
    },
  },
  behaviorTab: {
    agentTone: {
      tooltip: "Defines the communication style of the agent.",
      modal: {
        title: "Understanding Agent Tone",
        body: `
          <p>The agent's tone dictates its personality and how it interacts with users. This setting often influences the system prompt provided to the underlying Language Model (LLM).</p>
          <p><strong>Examples:</strong></p>
          <ul>
            <li><strong>Professional:</strong> Formal, precise, and avoids colloquialisms. Suitable for business applications.</li>
            <li><strong>Friendly:</strong> Warm, approachable, and may use casual language. Good for customer service bots.</li>
            <li><strong>Technical:</strong> Focuses on accuracy and detail, using domain-specific terminology. Ideal for expert systems.</li>
          </ul>
          <p><strong>Genkit & ADK:</strong></p>
          <p>In Genkit, the selected tone can be used to construct or modify the <code>systemInstruction</code> part of a prompt for a model like Gemini. The ADK might provide pre-configured "persona" settings that include tone, which this selection would map to.</p>
          <p>Choosing an appropriate tone is key to user experience and ensuring the agent behaves as expected.</p>
        `,
      },
    },
    creativityLevel: {
      tooltip: "Controls the randomness and predictability of the agent's responses. Higher values mean more creative/varied responses.",
      modal: {
        title: "Creativity Level (Temperature)",
        body: `
          <p>This setting typically corresponds to the "temperature" parameter of a Language Model (LLM).</p>
          <ul>
            <li><strong>Low Creativity (e.g., 0.0 - 0.3):</strong> Responses will be more deterministic, focused, and less random. Good for factual Q&A or tasks requiring precision.</li>
            <li><strong>Medium Creativity (e.g., 0.4 - 0.7):</strong> A balance between predictability and creativity. Suitable for most general applications.</li>
            <li><strong>High Creativity (e.g., 0.8 - 1.0+):</strong> Responses will be more diverse, imaginative, and potentially unexpected. Useful for brainstorming, content generation, or more human-like conversation.</li>
          </ul>
          <p><strong>Genkit & ADK:</strong></p>
          <p>When using Genkit with models like Gemini, this value would directly map to the <code>temperature</code> configuration parameter for the model. The ADK might abstract this, but the underlying principle remains the same: controlling the LLM's output variability.</p>
          <p>Be cautious with very high values, as they can lead to less coherent or off-topic responses.</p>
        `,
      },
    },
  },
  toolsTab: {
    availableToolsSection: {
        modal: {
            title: "Understanding Agent Tools",
            body: `
                <p>Tools are extensions that grant your agent new capabilities beyond simple text generation. They allow agents to interact with external systems, access data, perform calculations, or execute code.</p>
                <p><strong>Key Concepts:</strong></p>
                <ul>
                    <li><strong>Function Calling:</strong> Many advanced LLMs can "call functions" (tools) by outputting a structured request. The AgentVerse platform (using Genkit) interprets this request, executes the corresponding tool, and returns the result to the LLM to inform its next response.</li>
                    <li><strong>Genkit Tools:</strong> Genkit provides a framework for defining and using tools. These can be native Genkit tools (like web search) or custom tools you define (e.g., to interact with your company's internal API).</li>
                    <li><strong>ADK Tool Abstractions:</strong> The ADK may offer higher-level abstractions or pre-built integrations for common tools, simplifying their use in agent development.</li>
                </ul>
                <p><strong>Examples of Tools:</strong></p>
                <ul>
                    <li>Web Search: To find real-time information.</li>
                    <li>Calculator: For mathematical operations.</li>
                    <li>Database Access: To query or update data.</li>
                    <li>Custom API Tool: To connect to any external service with an API.</li>
                </ul>
                <p>Configuring tools correctly is essential for building powerful and effective agents.</p>
            `,
        },
    },
    // Specific tool examples will be added once the actual tool list is more concrete
  },
  ragTab: {
    enableRagIntegration: {
        modal: {
            title: "Retrieval Augmented Generation (RAG)",
            body: `
                <p>Retrieval Augmented Generation (RAG) enhances your agent's knowledge by allowing it to retrieve information from external data sources and use that information to formulate responses.</p>
                <p><strong>How it works:</strong></p>
                <ol>
                    <li>When a user asks a question, the agent first retrieves relevant documents or data snippets from a configured knowledge base (e.g., a vector database).</li>
                    <li>This retrieved context is then provided to the Language Model (LLM) along with the original question.</li>
                    <li>The LLM uses both the question and the retrieved context to generate a more informed and accurate answer.</li>
                </ol>
                <p><strong>Benefits:</strong></p>
                <ul>
                    <li><strong>Reduces Hallucinations:</strong> Grounds responses in factual data.</li>
                    <li><strong>Access to Current Information:</strong> Can use up-to-date knowledge beyond the LLM's training data.</li>
                    <li><strong>Domain-Specific Knowledge:</strong> Allows agents to answer questions about private or specialized topics.</li>
                </ul>
                <p><strong>Genkit & ADK:</strong></p>
                <p>Genkit provides tools and patterns for implementing RAG pipelines, including indexing documents and retrieving them (e.g., using <code>genkit-tools/vertexai</code> for Vertex AI Search or integrating with vector databases). The ADK may offer simplified RAG setup or pre-built components for common RAG scenarios.</p>
                <p>Configuring RAG involves setting up a vector store, indexing your documents, and defining how the agent should query this store.</p>
            `,
        },
    },
    vectorStoreUrl: {
        tooltip: "The API endpoint of your vector database/store.",
        modal: {
            title: "Vector Store URL",
            body: `
                <p>A vector store (or vector database) is a specialized database designed to store and search vector embeddings, which are numerical representations of text or other data.</p>
                <p><strong>Purpose:</strong> In RAG, your documents are converted into vector embeddings and stored here. When a query comes in, it's also converted to an embedding, and the vector store finds the most similar (relevant) document embeddings.</p>
                <p><strong>URL Format:</strong> The URL should be the main API endpoint for your chosen vector store provider (e.g., Pinecone, Weaviate, Vertex AI Vector Search, a self-hosted solution).</p>
                <p>Examples:</p>
                <ul>
                    <li>Pinecone: <code>https://{index_name}-{project_id}.svc.{environment}.pinecone.io</code></li>
                    <li>Weaviate: <code>http://localhost:8080</code> (for local) or your cloud endpoint.</li>
                    <li>Vertex AI Vector Search: Typically managed via GCP project/region and index ID, Genkit tools will abstract the direct URL.</li>
                </ul>
                <p>Ensure the AgentVerse backend has network access to this URL and any necessary authentication is configured (often via API keys set elsewhere).</p>
            `,
        },
    },
    collectionName: {
        tooltip: "The specific index or collection within your vector store.",
        modal: {
            title: "Collection/Index Name",
            body: `
                <p>Most vector stores allow you to organize your data into multiple collections (sometimes called indexes or tables).</p>
                <p>Specify the name of the collection that contains the documents relevant to this agent's RAG task.</p>
                <p>This ensures the agent searches only the appropriate subset of your data.</p>
                <p><strong>Genkit/ADK Context:</strong> When using Genkit retrieval tools, this collection name is often a required parameter for the retrieval function.</p>
            `,
        },
    },
    // Query Parameters content can be added later
  },
  deploy: {
    tabOverall: { // General help for the Deploy tab itself
      tooltip: "Configure settings related to deploying your agent to various platforms.",
      modal: {
        title: "Deploy Tab Overview",
        body: `
          <p>This section allows you to specify configurations for deploying your agent.</p>
          <ul>
            <li><strong>Plataforma Alvo:</strong> Choose the intended deployment platform.</li>
            <li><strong>Variáveis de Ambiente:</strong> Define necessary environment variables for your agent in production.</li>
            <li><strong>Requisitos de Recurso:</strong> Estimate CPU and Memory needed for your agent.</li>
          </ul>
          <p>In the future, this section might assist in generating Dockerfiles or apphosting.yaml.</p>
        `
      }
    },
    targetPlatform: {
      tooltip: "Select the target platform where your agent will be deployed.",
      modal: {
        title: "Plataforma Alvo",
        body: "<p>Choose the environment where your agent is intended to run. Options include Cloud Run, Vertex AI Agent Engine, Google Kubernetes Engine (GKE), or 'Outro' for custom environments. This helps in planning and potential future automated setup.</p>"
      }
    },
    environmentVariables: {
      tooltip: "Define key-value pairs for environment variables.",
      modal: {
        title: "Variáveis de Ambiente Necessárias",
        body: "<p>List any environment variables that your agent will require to function correctly in a production environment. These could include API keys, configuration paths, or other settings. For each variable, provide a 'Chave' (name) and 'Valor' (value).</p>"
      }
    },
    resourceRequirements: {
      tooltip: "Estimate the CPU and Memory resources your agent will need.",
      modal: {
        title: "Requisitos de Recurso",
        body: "<p>Provide an estimation of the CPU and Memory resources your agent is expected to consume. Examples for CPU: '1', '500m' (0.5 CPU). Examples for Memory: '512Mi', '2Gi'. These are typically used for capacity planning on platforms like Cloud Run or GKE.</p>"
      }
    }
  },
  // Placeholder for other tabs
  stateMemoryTab: {},
  artifactsTab: {},
  a2aConfigTab: {},
  multiAgentTab: {},
};

// Example of how to use React components in modal body (requires careful handling during rendering)
// const SampleReactBody = () => (
//   <div>
//     <h4>Advanced Configuration</h4>
//     <p>You can also use <code>JSX</code> for more complex content.</p>
//     <Button onClick={() => alert('Action!')}>Click me</Button>
//   </div>
// );
// agentBuilderHelpContent.generalTab.agentName.modal.body = <SampleReactBody />;

export interface TutorialStep {
  title: string;
  content: string | React.ReactNode; // HTML string or JSX
  visual?: string; // Placeholder for image/diagram path or component
}

export interface GuidedTutorial {
  id: string;
  title: string;
  goal: string;
  steps: TutorialStep[];
}

export const guidedTutorials: GuidedTutorial[] = [
  {
    id: "rag-basics",
    title: "Guided Tutorial: Creating Your First RAG Agent",
    goal: "Guide the user through the essential steps of setting up a basic Retrieval Augmented Generation (RAG) agent.",
    steps: [
      {
        title: "What is a RAG Agent?",
        content: "<p>Retrieval Augmented Generation (RAG) enhances your agent's knowledge by allowing it to retrieve information from external data sources and use that information to formulate responses. It helps agents answer questions using custom knowledge, reducing errors and providing up-to-date information.</p><p>Essentially: User Query ➡️ System Retrieves Relevant Docs ➡️ LLM Uses Docs + Query ➡️ Informed Answer.</p>",
      },
      {
        title: "Navigate to Agent Builder",
        content: "<p>Let's start by going to the Agent Builder. If you're already here, great! We'll be creating a new agent or editing an existing one to add RAG capabilities.</p>",
      },
      {
        title: "General Configuration (New Agent)",
        content: "<p>If creating a new agent: In the 'General' tab, give your RAG agent a name (e.g., 'DocQA_Agent') and a description (e.g., 'Answers questions based on uploaded product manuals'). Click the (i) icons next to the fields if you need more details.</p>",
      },
      {
        title: "Enabling RAG",
        content: "<p>Go to the 'RAG' tab for your chosen agent. Toggle the 'Enable RAG Integration' switch on. This will reveal the RAG configuration options. You can click the (i) icon next to the switch for a detailed explanation of RAG.</p>",
      },
      {
        title: "Configuring the Vector Store",
        content: "<p>You'll need a vector store where your documents are indexed.</p><ul><li><strong>Vector Store URL:</strong> Enter the URL of your vector database. (Click the info icon for details).</li><li><strong>Collection Name:</strong> Specify the name of the collection/index within your vector store.</li></ul><p><em>Note: For this tutorial, we assume you have a vector store ready. If not, please consult our documentation on setting one up.</em></p>",
      },
      {
        title: "Testing Your RAG Agent",
        content: "<p>Save your agent configuration. Now, navigate to the 'Chat' or 'Test' section. Ask your agent a question that can only be answered using the information in your indexed documents (e.g., if you indexed a product manual, ask 'What is the warranty period for product X?').</p>",
      },
      {
        title: "Conclusion & Next Steps",
        content: "<p>Congratulations! You've set up a basic RAG agent. Explore further by adding more documents, refining query parameters, or integrating other tools. Check out the full RAG documentation for advanced settings.</p>",
      },
    ],
  },
  {
    id: "a2a-basics",
    title: "Guided Tutorial: Setting Up Agent-to-Agent (A2A) Communication",
    goal: "Show the user how to configure one agent to communicate with (or delegate tasks to) another agent.",
    steps: [
      {
        title: "What is Agent-to-Agent (A2A) Communication?",
        content: "<p>A2A allows agents to collaborate. A primary agent can delegate tasks to specialized sub-agents. Use cases: complex task decomposition, leveraging multiple expert agents.</p><p>Flow: Main Agent ➡️ Sub-Agent 1 / Sub-Agent 2</p>",
      },
      {
        title: "Prerequisites",
        content: "<p>A2A involves at least two agents: a primary (orchestrator) and one or more sub-agents.</p><p>Ensure you have at least two agents. For example: <code>OrchestratorAgent</code> (we'll configure this) and <code>TaskSpecificAgent</code> (e.g., a 'DataLookupAgent').</p>",
      },
      {
        title: "Configuring the Primary Agent",
        content: "<p>Open your <code>OrchestratorAgent</code> in the Agent Builder.</p>",
      },
      {
        title: "Enabling A2A Communication",
        content: "<p>Navigate to the 'A2A Configuration' (or 'Multi-Agent') tab. Toggle 'Enable Agent-to-Agent Communication' on. Click the (i) icon for details on A2A.</p>",
      },
      {
        title: "Selecting Sub-Agents",
        content: "<p>In 'Select Sub-Agents', choose <code>TaskSpecificAgent</code>. This makes the sub-agent's capabilities available to the primary agent, often as a tool.</p>",
      },
      {
        title: "Defining Interaction Logic (Conceptual)",
        content: "<p>The actual call to a sub-agent is part of your agent's custom behavior (e.g., system prompt, Genkit flow logic).</p><ul><li><strong>Tool-based:</strong> The sub-agent might appear as a tool for the primary agent.</li><li><strong>Flow-based:</strong> The primary agent's Genkit flow explicitly calls the sub-agent's flow.</li></ul><p><em>This tutorial covers enabling the connection. Invocation logic is part of advanced design.</em></p>",
      },
      {
        title: "Testing A2A",
        content: "<p>Save <code>OrchestratorAgent</code>. In chat, give it a task requiring the sub-agent (e.g., 'Lookup sales figures for product Y' if using a <code>DataLookupAgent</code>).</p>",
      },
      {
        title: "Conclusion & Next Steps",
        content: "<p>You've enabled A2A! This allows for sophisticated, modular agent systems. Explore different orchestration patterns and prompt engineering for advanced use.</p>",
      },
    ],
  },
];
