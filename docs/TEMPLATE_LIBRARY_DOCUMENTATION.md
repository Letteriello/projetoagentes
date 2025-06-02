# Agent Template Library Documentation Notes

This document provides notes for updating the official project documentation regarding the new Agent Template Library feature.

## 1. Overview

The Agent Template Library is a new feature designed to accelerate the creation of new AI agents and inspire users by showcasing pre-configured examples. Users can browse a collection of templates, see their potential use cases and key configurations, and then use a template as a starting point for their own agent in the Agent Builder.

The library is accessible via the new route: `/agent-templates`.

## 2. For Users

### Accessing the Library

To access the Agent Template Library, navigate to the `/agent-templates` page in the application. This can typically be done via a main navigation link (e.g., "Templates" or "Agent Templates").

### Browsing Templates

The template library page displays available agent templates in a card-based layout. For each template, the following information is shown:

*   **Name:** The display name of the template.
*   **Description:** A brief description of the template's purpose.
*   **Version:** The version number of the template.
*   **Icon:** A visual icon representing the template.
*   **Use Cases:** (New Field) A list of tags or short phrases indicating potential applications or scenarios for the template (e.g., "customer_support", "code_generation"). Displayed as badges.
*   **Template Details Preview:** (New Field) A short paragraph providing a quick summary of key pre-configurations, such as specific tools enabled, RAG setup details, important model parameters, or example prompts.

**Searching Templates:**

*   A search bar is provided to filter templates.
*   Users can search by:
    *   Agent Name
    *   Agent Description
    *   Tags (if tags are part of `SavedAgentConfiguration` and indexed for search)
    *   Use Cases (if search is configured to include them)

**Sorting Templates:**

*   A dropdown menu allows users to sort the displayed templates.
*   Available sorting options include:
    *   Sort by Name (A-Z)
    *   Sort by Name (Z-A)
    *   Sort by Date (Newest First)
    *   Sort by Date (Oldest First) (based on `createdAt` field)

### Using a Template

*   Each template card has a "Use Template" (or similar) button.
*   Clicking this button will take the user to the Agent Builder page (`/agent-builder`).
*   The Agent Builder will be pre-filled with the configuration from the selected template.
*   This effectively "clones" the template into a new, editable agent configuration, allowing users to customize it further without altering the original template. The `templateId` field in the new agent configuration will reference the original template.

## 3. For Administrators (or Users Managing Templates)

### Creating Templates

Templates are not created directly. Instead, they are derived from existing agent configurations:

1.  Configure an agent as desired in the Agent Builder.
2.  Use the "Save as Template" option (typically available on an agent's card or in the agent editing interface).
3.  This will open a dialog where template-specific details can be added.

**New Fields for Templates:**

When saving an agent as a template, the following new fields can be specified:

*   **`useCases` (string[])**:
    *   **Purpose:** To provide quick, scannable keywords for what the template is good for.
    *   **Best Practices:**
        *   Use clear, concise, and action-oriented phrases or tags (e.g., "document_summarization", "task_automation", "data_analysis_assistant").
        *   Think of them as keywords that users might search for.
        *   Typically entered via a tag input field.
*   **`templateDetailsPreview` (string)**:
    *   **Purpose:** To offer a brief summary of the template's key pre-configurations. This helps users understand what makes the template special without needing to load it into the builder immediately.
    *   **Content Suggestions:**
        *   Mention specific tools that are enabled (e.g., "Includes Web Search and Calculator tools").
        *   Highlight RAG (Retrieval Augmented Generation) setup (e.g., "Pre-configured for RAG with a sample knowledge base").
        *   Note important model parameters if they are fine-tuned for a specific purpose (e.g., "Uses a higher temperature for creative text generation").
        *   Provide a snippet of an example prompt that works well with the template.
        *   Entered via a textarea.

### Managing Templates

(Note: The UI for direct template management beyond creation might be limited in the initial release. This section outlines potential future capabilities or administrative actions.)

*   **Editing Existing Template Details:** Functionality to update a template's name, description, use cases, preview, etc. (May require direct Firestore modification or a dedicated admin interface).
*   **Deleting Templates:** Functionality to remove templates from the library (May require direct Firestore modification or a dedicated admin interface).

### Firestore Data Model

*   Agent templates are stored in the `agent-templates` collection in Firestore.
*   Each document in this collection is a `SavedAgentConfiguration` object (from `src/types/agent-configs.ts`).
*   Key fields relevant to templates include:
    *   `id` (string): Unique ID of the template.
    *   `agentName` (string)
    *   `agentDescription` (string)
    *   `agentVersion` (string)
    *   `icon` (string, optional)
    *   `isTemplate` (boolean): Should be `true`.
    *   `config` (AgentConfig): The core agent configuration (LLM details, workflow, tools, etc.).
    *   `tools` (string[]): List of tool IDs enabled.
    *   `createdAt` (string): Timestamp of creation.
    *   `updatedAt` (string): Timestamp of last update.
    *   `userId` (string, optional): ID of the user who created the template.
    *   **`useCases` (string[], optional)**: (New Field) List of use case tags/phrases.
    *   **`templateDetailsPreview` (string, optional)**: (New Field) Short description of key configurations.

### Security Rules

The `firestore.rules` file governs access to the `agent-templates` collection:

*   **Read Access:** All authenticated users are allowed to read documents from the `agent-templates` collection.
    ```
    match /agent-templates/{templateId} {
      allow read: if request.auth != null;
      // ... other rules
    }
    ```
*   **Write Access:** Writing (creating, updating, deleting) to the `agent-templates` collection is restricted. The current placeholder rule requires the user to have an admin custom claim.
    ```
    match /agent-templates/{templateId} {
      // ... read rule
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    ```
    (Actual implementation of admin checks may vary.)

## 4. Developer Notes

*   **UI for Template Library:**
    *   `src/app/templates/page.tsx`: Contains the main React component for displaying, searching, and sorting templates.
*   **Dialog for Template Details:**
    *   `src/components/features/agent-builder/save-as-template-dialog.tsx`: The dialog component used when a user chooses to "Save as Template". This is where `useCases` and `templateDetailsPreview` are entered.
*   **Backend Services:**
    *   `src/lib/agentServices.ts`: Includes functions for interacting with Firestore for templates:
        *   `saveAgentTemplate()`: Saves a new template configuration.
        *   `getAgentTemplate()`: Fetches a single template by ID.
        *   `getUserAgentTemplates()`: Fetches templates created by a specific user.
        *   `getCommunityAgentTemplates()`: Fetches all templates (can be adapted for public/community views).
*   **Type Definitions:**
    *   `src/types/agent-configs.ts`: Defines the `SavedAgentConfiguration` interface, which includes the new `useCases` and `templateDetailsPreview` fields.

This documentation should be reviewed and integrated into the project's main user and developer guides.
