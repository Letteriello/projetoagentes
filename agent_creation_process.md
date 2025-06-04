# Agent Creation Process

This document details the agent creation process for both Beginner and Advanced modes, outlining the objectives, interaction flows, and key capabilities or configuration parameters for each.

## 1. Beginner Mode: Conversational AI Agent Builder

*   **Objective:** Allow users with no technical background to create effective agents by conversing in natural language with an AI-powered "Builder Bot."
*   **Interaction Flow:**
    1.  **Initiation:**
        *   User navigates to the agent creation section of the platform.
        *   User selects an option like "Create New Agent."
        *   The platform presents choices for creation mode: "Beginner Mode" or "Advanced Mode." User selects "Beginner Mode."
    2.  **Greeting & Goal Definition:**
        *   A specialized AI agent, the "Builder Bot," initiates a conversation.
        *   **Builder Bot:** "Hello! I'm here to help you build a new agent. To start, what is the main goal or primary function you want your agent to perform? For example, you could say 'I want an agent to help me summarize articles from the web,' or 'I need an agent to manage my social media posts.'"
        *   User describes their agent's purpose in natural language.
    3.  **Clarification & Probing:**
        *   The Builder Bot analyzes the user's initial statement and asks targeted clarifying questions to refine the requirements.
        *   **Example (Article Summarizer):**
            *   **Builder Bot:** "Okay, an article summarizer. That's useful! Could you tell me a bit more? What kind of articles will it summarize? Are they from specific websites, or should it be able to browse the web? Will you provide the text directly, or should it find articles based on topics?"
        *   **Example (Social Media Agent):**
            *   **Builder Bot:** "Social media management, got it. Which platforms are you thinking of (e.g., Twitter, LinkedIn)? What kind of posts will it handle (e.g., text, images, links)? Would you like it to suggest content, or will you provide it? Should it schedule posts or publish them immediately?"
    4.  **Prompt Suggestion/Generation:**
        *   Based on the clarified understanding, the Builder Bot proposes an initial core prompt for the new agent.
        *   **Builder Bot:** "Based on what you've told me, here's a suggested core prompt for your agent: 'You are an AI assistant designed to find and summarize articles from web URLs provided by the user. You should extract the key points and present a concise summary of about 100 words.' This prompt clearly defines its role and expected output. What do you think? We can revise it if you like."
        *   User can accept the suggestion, ask for modifications (e.g., "Can it make the summary longer?"), or provide their own version if they have one.
    5.  **Tool Identification & Suggestion:**
        *   The Builder Bot identifies potential tools the agent will need to accomplish its goal.
        *   **Builder Bot:** "To summarize articles from the web, your agent will likely need a 'Web Browser' tool to access the content. This tool allows the agent to fetch information from URLs. Does that sound right?"
        *   If more complex or custom tools are implied (e.g., accessing a specific proprietary database), the Builder Bot might state: "For accessing your company's internal product database, your agent would need a special tool. If you have an 'MCP Tool' for that, we can add it. Otherwise, this might be something to set up in Advanced Mode or with an administrator later."
        *   User confirms or discusses alternatives.
    6.  **Permissions & Constraints:**
        *   The Builder Bot discusses necessary permissions for the selected tools and any operational constraints.
        *   **Builder Bot:** "The 'Web Browser' tool will need permission to access the internet. For the 'Social Media Poster' tool, we'll need to grant it permission to post to your chosen accounts. Should the agent always ask for your confirmation before posting anything, or are there situations where it can post automatically?"
        *   User provides preferences.
    7.  **Naming & Avatar (Optional):**
        *   **Builder Bot:** "Great! We're almost there. What would you like to name your new agent? You can also choose an avatar for it if you like, or we can assign a default one."
        *   User provides a name and may select/upload an avatar.
    8.  **Review & Confirmation:**
        *   The Builder Bot provides a summary of the new agent's configuration.
        *   **Builder Bot:** "Okay, let's review. You're creating an agent named 'ArticleWhiz.' Its goal is to summarize web articles. The core prompt is: '...'. It will use the 'Web Browser' tool. It will ask for confirmation before summarizing. Does everything look correct?"
        *   User confirms the details.
    9.  **Creation & First Run (Optional):**
        *   The platform creates the agent based on the confirmed configuration.
        *   **Builder Bot:** "Excellent! Your agent 'ArticleWhiz' has been created. Would you like to give it a quick test? You can give me a URL, and we'll see how it does."
        *   User can opt for an initial test run.
*   **Key Capabilities of the Builder Bot:**
    *   Advanced natural language understanding (NLU) to interpret user requests and intentions.
    *   AI-driven, context-aware prompt generation, suggestion, and refinement.
    *   AI-driven tool recommendation based on agent goals.
    *   Ability to guide users through the setup of essential agent parameters (permissions, basic behaviors) in simple terms.
    *   Simplification of complex technical concepts into understandable conversational points.
    *   Maintains conversation context and allows for iterative refinement.

## 2. Advanced Mode: Detailed Configuration Interface

*   **Objective:** Provide users with technical knowledge, or those who have "graduated" from Beginner Mode, with comprehensive and granular control over all aspects of agent creation and configuration.
*   **Interface Options:** (The platform might offer one or a combination of these, or allow users to switch between them.)
    *   **A. Form-Based Interface:**
        *   A structured web interface with multiple sections, forms, and input fields. Each field corresponds to a specific agent parameter.
        *   Clear labels, tooltips, and inline documentation for each option.
        *   Validation and real-time feedback for inputs.
    *   **B. Visual Flow Builder (Potentially for future extension):**
        *   A drag-and-drop interface where users can visually map out the agent's logic, decision points, tool integrations, and conditional flows.
        *   Nodes could represent actions, tools, conditions, or other agents.
        *   While powerful, this might lean away from "minimalist" unless implemented very carefully.
    *   **C. Simplified Scripting/JSON/YAML Configuration:**
        *   Users can directly view, write, or edit a configuration file (e.g., in JSON or YAML format) that defines the agent's structure and parameters.
        *   The platform could provide a text editor with syntax highlighting, validation, and auto-completion.
        *   This mode is excellent for version control, templating, and programmatic agent management.

*   **Key Configuration Sections & Parameters (Common across interface options):**

    1.  **Core Definition:**
        *   **Agent Name:** User-defined name (e.g., "SalesDataAnalyzer").
        *   **Agent ID:** Unique identifier, potentially auto-generated but overridable by the user (with uniqueness checks).
        *   **Core Prompt / System Persona:** A multi-line text area for detailed instructions, defining the agent's personality, primary goals, operational rules, constraints, and how it should respond.
        *   **Description / Purpose:** A brief description of the agent's function for display in listings and management interfaces.
        *   **Tags/Categories:** For organizing and filtering agents.

    2.  **Tool Configuration:**
        *   **Tool Library:** Interface to browse, search, and select from available Standard Tools and registered MCP Tools.
        *   **Selected Tools:** A list of tools added to the agent.
        *   **Tool-Specific Parameters:** For each selected tool, dedicated fields to configure:
            *   API Keys / Credentials (securely managed, possibly referencing a central secrets store).
            *   Service URLs or endpoints.
            *   Custom settings relevant to that tool (e.g., default search domain for a web search tool, specific database name for a database connector).
        *   **Tool Permissions:** Granular toggles or checklists to define what actions each tool is permitted to perform on behalf of the agent (e.g., "read files," "write to database," "access user's calendar").

    3.  **AI Model & Parameters (If exposed by the underlying ADK):**
        *   **LLM Model Selection:** Dropdown to choose the specific Large Language Model (if multiple are available and compatible).
        *   **Inference Parameters:** Sliders or input fields for:
            *   Temperature (randomness/creativity).
            *   Top-p (nucleus sampling).
            *   Max new tokens (response length).
            *   Presence/Frequency penalties.
            *   Stop sequences.

    4.  **Memory & Context Management:**
        *   **Short-Term Memory:** Configuration for how conversational history is maintained within a session (e.g., number of turns, token limit).
        *   **Long-Term Memory (if supported):**
            *   Selection of a vector database or other storage mechanism.
            *   Configuration for embedding models.
            *   Strategies for when and what information the agent should commit to long-term memory.
        *   **Context Window Management:** Rules for how to manage information within the LLM's limited context window (e.g., summarization strategies for older messages).

    5.  **Agent Loop & Orchestration Settings:**
        *   **Triggers:**
            *   **Event-Based:** Configure agent to activate based on specific events (e.g., API call to an endpoint, message from another agent, new entry in a database).
            *   **Schedule-Based:** Set up cron-like schedules for periodic execution (e.g., "run every Monday at 9 AM").
            *   **Manual:** Agent only runs when manually initiated by a user.
        *   **Error Handling:** Define behavior on tool failure or unexpected errors (e.g., number of retry attempts, delay between retries, fallback actions, notification settings).
        *   **Logging & Auditing:**
            *   Set logging levels (e.g., DEBUG, INFO, WARN, ERROR).
            *   Specify what information should be logged (e.g., prompts, responses, tool calls, errors).

    6.  **A2A (Agent-to-Agent) Interaction Settings:**
        *   **Discoverability:** Whether this agent can be discovered by other agents.
        *   **Interaction Permissions:** Define which other agents (or groups of agents) are allowed to communicate with this agent.
        *   **Offered Services:** Define specific services or capabilities this agent exposes to other agents.
        *   **Request Handling:** Configuration for how incoming A2A requests are processed.

    7.  **Input/Output Schemas (Optional, but recommended for robust integrations):**
        *   **Input Schema:** Define the expected structure and data types for inputs the agent receives (e.g., using JSON Schema). This allows for validation of incoming data.
        *   **Output Schema:** Define the structure and data types for outputs the agent produces. This ensures consistency for downstream consumers or other agents.

    8.  **Security & Sandboxing:**
        *   Resource limits (CPU, memory, execution time).
        *   Network access policies.
        *   File system access restrictions.

*   **Advanced Mode Features:**
    *   Direct and granular editing of all available agent parameters.
    *   "AI-Assisted Input Generation" (as described in core features) still available for complex fields like the core prompt or tool-specific JSON/script configurations.
    *   Ability to import/export agent configurations (e.g., as JSON or YAML files), facilitating backup, sharing, and templating.
    *   Version control for agent configurations (either integrated or by encouraging export to external Git repos).
    *   Access to detailed logs, debugging consoles, and testing environments to iteratively develop and refine agents.
    *   Ability to clone existing agents to use as templates.
    *   Validation of configuration to prevent common errors before saving/deploying.
