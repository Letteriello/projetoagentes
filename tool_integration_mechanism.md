# Tool Integration Mechanism

This document outlines the mechanism for integrating, managing, and invoking tools within the agent platform. It covers the user's experience, how agents interact with tools, and critical security considerations.

## 1. User Perspective: Adding and Configuring Tools

This section describes how users discover, add, and configure tools for their agents.

*   **Tool Discovery/Marketplace:**
    *   A dedicated section within the platform, potentially named "Tool Hub," "Integrations," or "Tool Marketplace," serves as a central repository for users to browse and manage available tools.
    *   **Categorization:** Tools are organized into logical categories (e.g., "Productivity," "Data & Analysis," "Communication," "Development," "Web Utilities," "Enterprise Systems") to facilitate browsing.
    *   **Search and Filtering:** Users can search for tools by name, keyword, or category. Filtering options might include tool type (Standard/Custom), popularity, or recently added.
    *   **Tool Information:** Each tool listing provides a clear description, its purpose, version, publisher (for third-party tools), and any prerequisites.
    *   **Distinction:** A clear visual or textual distinction is made between "Standard/Pre-built" tools (vetted and maintained by the platform) and "Custom/MCP (Multi-Capability Platform)" tool integrations (which users might configure themselves or come from third-party developers).

*   **Adding a Standard Tool (Pre-built):**
    *   **Simple Activation:** Users can add a standard tool to their personal toolkit with a single "Add," "Enable," or "Connect" button.
    *   **Authentication & Authorization:**
        *   If a tool requires access to external services (e.g., Google Calendar, Slack, Twitter), the platform initiates an OAuth 2.0 flow or a similar secure authentication mechanism.
        *   The platform securely stores the resulting tokens (encrypted) and manages their lifecycle (e.g., refresh tokens).
        *   Users are clearly informed about the permissions being granted to the tool.
    *   **Configuration Options:** Some standard tools may have user-specific configuration options presented upon adding or via an "Edit Configuration" interface (e.g., selecting a default calendar for a calendar tool, choosing a default language for a translation tool).

*   **Adding a Custom/MCP Tool:**
    *   This functionality is typically aimed at more advanced users or developers.
    *   A dedicated interface (e.g., "Create Custom Tool," "Register MCP Tool") allows users to define the specifications for integrating external services or custom-built functionalities as tools.
    *   **Input Fields for Custom Tool Definition:**
        *   **Tool Name:** A user-friendly name for the tool.
        *   **Tool ID:** A unique identifier for the tool (can be auto-generated).
        *   **Description:** A brief explanation of what the tool does.
        *   **Authentication Method:**
            *   Selection from a list (e.g., API Key, OAuth 2.0 Client Credentials, Bearer Token, None).
            *   Secure input fields for providing credentials (e.g., API Key value, Client ID/Secret). These are stored encrypted.
            *   For OAuth, specifies the token URL.
        *   **API Endpoint (Base URL):** The base URL for the external API. Specific paths can be defined per action if the tool supports multiple actions.
        *   **Actions/Operations (if a tool can perform multiple):**
            *   For each action (e.g., `get_weather`, `send_message`):
                *   **Action Name:** e.g., `getCurrentWeather`.
                *   **HTTP Method:** GET, POST, PUT, DELETE, etc.
                *   **Path:** The specific API path for this action (e.g., `/weather`, `/chat/messages`).
                *   **Input Schema (JSON Schema):** Defines the expected parameters, data types, and structure for the request to this action. This is crucial for validation and for the agent to know how to call the tool.
                *   **Output Schema (JSON Schema):** Defines the expected structure and data types of the response from this action. This helps the platform (and agent) interpret the tool's output.
        *   **Rate Limiting (Optional):** User can specify known rate limits of the external API.
        *   **Headers (Optional):** Define static headers to be sent with every request (e.g., `Content-Type: application/json`).
    *   **Test Functionality:** Within the platform, users can test the tool configuration by providing sample inputs for an action and triggering a call to the actual external API. The platform displays the request sent and the raw/parsed response.

*   **Tool Permissions for Agents:**
    *   Adding a tool (Standard or Custom) makes it available within the user's account/workspace, but it's not automatically accessible by all agents.
    *   During agent creation or when editing an existing agent (typically in "Advanced Mode"), the user explicitly grants the agent permission to use specific tools from their collection of added/configured tools.
    *   This is managed via a checklist or a multi-select dropdown where users can pick the tools an agent is authorized to invoke.
    *   This principle of least privilege enhances security by ensuring agents can only access tools relevant to their defined function.

## 2. Agent Perspective: Invoking Tools

This section describes how agents request tool execution and how the platform facilitates this.

*   **Tool Invocation Language (Abstracted from Agent):**
    *   Agents do not directly make HTTP calls or manage authentication tokens. The ADK (Agent Development Kit) and the platform core abstract these complexities.
    *   The agent's underlying model (LLM) is trained or prompted to recognize when a tool is needed and to formulate a request in a specific, structured format.
    *   **Common Methods for Tool Invocation Request:**
        1.  **Function Calling/Structured Output:** The LLM is designed to output a specific JSON object or structured data when it determines a tool action is necessary. This output clearly specifies the `tool_name`, the `action_to_perform` (if the tool has multiple actions), and a dictionary of `parameters`.
            ```json
            {
              "tool_name": "weather_service",
              "action": "getCurrentWeather",
              "parameters": {
                "location": "San Francisco, CA",
                "unit": "celsius"
              }
            }
            ```
        2.  **Specially Formatted Strings (Less Preferred for complex tools):** The agent might output a placeholder string that the platform then parses. Example: `[[TOOL_CALL: search_web(query='latest AI advancements', region='US')]]`. This is generally less robust than structured output for complex parameter passing.

*   **Platform's Role in Invocation (The Tool Execution Runtime):**
    1.  **Detection & Parsing:** The platform continuously monitors the agent's output for tool invocation requests (e.g., the specific JSON structure).
    2.  **Permission Check:** The platform verifies that the specific agent instance has been granted permission to use the requested `tool_name` and `action`. If not, an error is returned to the agent.
    3.  **Configuration Retrieval:** The platform retrieves the tool's configuration, including its API endpoint for the specified action, authentication method, and stored credentials (e.g., API key, OAuth token).
    4.  **Parameter Validation (Optional but Recommended):** If an input schema is defined for the tool/action, the platform validates the parameters provided by the agent against this schema. If validation fails, an error is returned to the agent.
    5.  **API Call Execution:**
        *   The platform constructs the actual HTTP request (method, URL, headers, body) based on the tool's configuration and the agent's parameters.
        *   It securely injects the necessary authentication credentials (e.g., adding an `Authorization` header).
        *   It makes the call to the external tool's API endpoint.
    6.  **Response Handling:**
        *   The platform receives the HTTP response from the external tool.
        *   It handles potential network errors or non-2xx HTTP status codes.
    7.  **Output Transformation/Validation (Optional but Recommended):**
        *   If an output schema is defined, the platform can validate the structure of the received response.
        *   It may perform minor transformations if needed to fit a consistent format expected by the agent.
    8.  **Return to Agent:** The (potentially transformed) result from the tool, or a structured error message, is provided back to the agent as part of its context or input for its next reasoning step. For example, the tool's output might be injected as: `[[TOOL_RESPONSE: search_web(query='...') -> 'Page 1 content...']]` or as a structured JSON object.

*   **Error Handling:**
    *   If a tool call fails (e.g., API error, network issue, permission denied, validation error), the platform provides a structured and meaningful error message back to the agent.
    *   Example error format:
        ```json
        {
          "tool_name": "weather_service",
          "action": "getCurrentWeather",
          "status": "error",
          "error_type": "API_UNAVAILABLE",
          "message": "The weather service API is currently not responding."
        }
        ```
    *   The agent can then use this error information to decide on its next step: retry the call (perhaps with different parameters), inform the user of the failure, or attempt to use an alternative tool or strategy.

## 3. Security Considerations

Ensuring the secure integration and invocation of tools is paramount.

*   **Credential Management:**
    *   All sensitive credentials (API keys, OAuth tokens, passwords) must be stored encrypted at rest using strong encryption algorithms (e.g., AES-256).
    *   Utilize a dedicated secure vault system (e.g., HashiCorp Vault, AWS Secrets Manager, Google Cloud Secret Manager) for storing and managing these credentials.
    *   Access to raw credentials must be strictly limited, even for platform administrators. The platform should access them programmatically only when needed for a tool call.
    *   Regularly audit and rotate credentials where possible.

*   **Permissions & Scoping:**
    *   **Agent-Tool Permissions:** Users explicitly grant agents permission to use specific tools. Agents cannot access tools they haven't been authorized for.
    *   **Tool-Specific Scopes:** When tools use OAuth, request the narrowest possible permission scopes required for their functionality (e.g., a calendar tool might request read-only access if it only needs to fetch events).
    *   **User Context:** Ensure tools operate within the permissions context of the user who configured them or the user interacting with the agent, where applicable.

*   **Input Sanitization & Validation:**
    *   For custom/MCP tools, the platform *must* validate parameters provided by the agent against the tool's defined input schema before sending them to the external API. This helps prevent injection attacks (e.g., SQL injection, command injection if the tool were to pass data to a shell) and malformed requests.
    *   Consider sanitizing or validating responses from external tools before passing them back to the agent, especially if the content could be malicious or could influence the agent's core prompt or memory in undesirable ways.

*   **Rate Limiting & Quotas:**
    *   Implement platform-side rate limiting for tool calls on a per-user and/or per-agent basis to prevent abuse, ensure fair usage, and protect underlying external services.
    *   Allow administrators or users to configure quotas for tools that might incur costs or have strict external API limits.
    *   Provide clear feedback to agents/users when rate limits are hit.

*   **Sandboxing (for specific MCP/Custom Tools):**
    *   The primary model for MCP tools is API-based interaction.
    *   If a future scenario allows custom tools to execute arbitrary user-supplied code *within the platform infrastructure* (less common for typical API tools), this code MUST be run in a strictly sandboxed environment with tight restrictions on network access, file system access, and system calls.

*   **Auditing & Logging:**
    *   Maintain comprehensive audit logs for all tool invocations.
    *   Logs should include: timestamp, agent ID, user ID (if applicable), tool name, action invoked, parameters (with sensitive data like API keys or PII masked or redacted), success/failure status, and the source of the request.
    *   These logs are crucial for debugging issues, monitoring for suspicious activity, and security investigations.

*   **User Responsibility & Trust:**
    *   Clearly communicate to users their responsibilities when adding and configuring tools, especially Custom/MCP tools developed by third parties or themselves.
    *   Users should understand the permissions they are granting and the potential risks associated with connecting to external services.
    *   Provide guidance on evaluating the trustworthiness of third-party tools.

*   **HTTPS Enforcement:**
    *   All tool communication (platform to external tool API) must use HTTPS to ensure data is encrypted in transit.
    *   Discourage or block the configuration of tools using non-HTTPS endpoints.

By implementing these mechanisms and adhering to these security principles, the platform can provide a flexible and powerful tool integration system while minimizing risks.
