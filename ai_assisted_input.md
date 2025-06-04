# AI-Assisted Input Generation

This document details the "AI-Assisted Input Generation" feature, designed to help users craft more effective configurations for their agents and related entities within the platform.

## 1. Concept and User Benefit

*   **Purpose:**
    *   **Reduce Cognitive Load:** Simplify the process of filling complex input fields, especially those requiring specific syntax or detailed articulation.
    *   **Overcome "Blank Page" Syndrome:** Help users get started when they are unsure how to phrase a prompt, describe a task, or define a schema.
    *   **Improve Effectiveness:** Guide users (especially beginners, but also useful for advanced users) towards creating more precise, comprehensive, and effective inputs for their agents and tools.
    *   **Accelerate Configuration:** Speed up the agent creation and task definition process.

*   **How it Works:**
    *   Users provide a basic idea, keywords, or a rough natural language description related to an input field.
    *   An AI model, contextualized by the specific field and the broader task, processes this input.
    *   The AI generates one or more specific, well-formed suggestions that the user can then accept, modify, or discard.

*   **User Experience:**
    *   The feature is designed to be seamlessly integrated into the user interface.
    *   Assistance is readily available but not intrusive, appearing as an optional aid.
    *   The goal is to empower users, making complex configurations feel more approachable and manageable.

## 2. Eligible Input Fields for AI Assistance

AI assistance can be beneficial in various parts of the platform:

*   **Agent Creation (Beginner Mode - Implicit):**
    *   The "Builder Bot" inherently uses AI-assisted input generation. The entire conversational flow where the Builder Bot suggests prompts, identifies tools, and clarifies requirements is a form of AI assistance for defining the agent.

*   **Agent Creation (Advanced Mode - Explicit):**
    *   **Core Agent Prompt:**
        *   *Use Case:* User types "agent to summarize daily financial news" -> AI suggests a detailed prompt like "You are a financial news analyst agent. Your primary goal is to read the top 10 financial news headlines from reputable sources every morning, provide a 3-sentence summary for each, and list any potential impacts on the stock market."
    *   **Tool Parameters:**
        *   *Use Case:* For a tool requiring a complex JSON input (e.g., a custom API call). User describes "I need to query user data for 'John Doe' in 'New York'" -> AI suggests the JSON structure: `{"filters": [{"field": "name", "value": "John Doe"}, {"field": "city", "value": "New York"}]}`.
    *   **Agent Name:**
        *   *Use Case:* Based on the core prompt and selected tools, AI can suggest creative and descriptive names like "NewsSummarizerPro" or "FinanceBriefBot."
    *   **Agent Description:**
        *   *Use Case:* AI can generate a concise description based on the agent's purpose and core prompt for display in agent listings.

*   **Task Creation (in To-Do Interface):**
    *   **Task Title / Description:**
        *   *Use Case:* User types "remind team about report" -> AI suggests "Schedule a reminder for the #engineering team to submit their weekly status reports by Friday 5 PM, including a link to the submission portal."
    *   **Breaking Down Tasks (Sub-tasks):**
        *   *Use Case:* User creates a task "Launch new product feature." -> AI suggests sub-tasks like: "1. Finalize development. 2. Complete QA testing. 3. Prepare marketing materials. 4. Announce to users."

*   **Custom Tool Configuration (Advanced):**
    *   **Input/Output Schema (JSON Schema):**
        *   *Use Case:* User describes "This tool takes a product ID (string) and quantity (integer) and returns a status (boolean) and message (string)." -> AI generates a draft JSON schema:
            ```json
            // Input Schema
            {
              "type": "object",
              "properties": {
                "product_id": { "type": "string" },
                "quantity": { "type": "integer" }
              },
              "required": ["product_id", "quantity"]
            }
            // Output Schema
            {
              "type": "object",
              "properties": {
                "status": { "type": "boolean" },
                "message": { "type": "string" }
              }
            }
            ```
    *   **Tool Description:**
        *   *Use Case:* Based on the tool's endpoint and schemas, AI can help draft a clear, concise description for the tool's entry in the Tool Hub.

## 3. Interaction Flow for AI Assistance

*   **Initiation:**
    *   **Iconography:** A small, unobtrusive icon (e.g., ✨, "AI", "Suggest," "Generate") is placed next to eligible input fields.
    *   **Contextual Prompts:** For empty or minimally filled fields, a subtle prompt might appear on focus, e.g., "Need help getting started? Type a general idea and click the ✨ icon for AI suggestions."
    *   The feature is opt-in; users are not forced to use it.

*   **Input from User (Triggering AI):**
    *   **Option 1: Inline Input (Most Common):**
        1.  User types a few keywords, a sentence, or a rough idea directly into the target input field (e.g., the agent core prompt textarea).
        2.  User clicks the "AI Assist" icon associated with that field.
        3.  The content currently in the field is used as the primary input for the AI.
    *   **Option 2: Dedicated Popup/Modal (For more complex requests or when the field is blank):**
        1.  User clicks the "AI Assist" icon.
        2.  If the field is empty, or if the interaction model prefers it, a small popup/modal appears.
        3.  The modal might have a prompt like: "Describe what you want this [field type, e.g., 'agent prompt'] to achieve." or "Give the AI some context to generate suggestions."
        4.  User types their request into this modal.

*   **AI Generation Process:**
    1.  The platform captures the user's input (from the field or the modal) and relevant context.
    2.  Context includes:
        *   The specific type of field (e.g., "agent_core_prompt," "json_schema_tool_input," "task_description").
        *   Other related data already entered (e.g., if generating a prompt, the agent's name or selected tools might be used as context).
        *   The overall goal (e.g., creating an agent, defining a task).
    3.  This information is packaged into a carefully engineered prompt (meta-prompt) sent to a dedicated AI model.
    4.  The AI model processes the meta-prompt and generates one or more suggestions.

*   **Displaying Suggestions to the User:**
    *   **Single, High-Confidence Suggestion:**
        *   The AI-generated content directly replaces or fills the content of the input field.
        *   An "Undo" (Ctrl+Z or button) option must be readily available.
        *   A small notification (e.g., a toast message) might appear: "AI suggestion applied. You can edit it or undo."
    *   **Multiple Suggestions:**
        *   **Dropdown List:** Suggestions appear in a dropdown menu attached to the input field. User can hover to preview and click to apply.
        *   **Modal List:** A modal window displays a list of suggestions, each with a preview and an "Apply this suggestion" button.
        *   **Inline Comparison (for significant changes):** Show a "diff" view or side-by-side comparison if the suggestion is a major rewrite of existing content.
    *   **Common Actions for Suggestions:**
        *   "Use this" / "Apply": Inserts the suggestion into the field.
        *   "Insert" (if field not empty): Inserts suggestion at cursor or appends.
        *   "Refine...": Allows user to provide feedback to get a revised suggestion.
        *   "Discard" / "Dismiss": Closes the suggestions UI.
        *   "Generate more": Asks for new alternative suggestions.

*   **Refinement (Iterative Process):**
    1.  Once a suggestion is applied, the input field contains the AI-generated text, which is now fully editable by the user.
    2.  The user can manually tweak the text.
    3.  The "AI Assist" icon remains available. If clicked again, the current content of the field (which might be an edited AI suggestion) serves as the new baseline input for the AI to provide further refinements or alternative ideas.
    4.  This allows for an iterative cycle of AI suggestion -> user modification -> AI refinement.

## 4. Underlying AI Model Considerations

*   **Model Choice:**
    *   A powerful, general-purpose Large Language Model (LLM) is suitable for most suggestion tasks due to its versatility in understanding context and generating human-like text and code-like structures (JSON).
    *   **Fine-Tuning (Optional):** For highly specialized or critical fields (e.g., generating secure tool configurations or complex, domain-specific JSON schemas), consider fine-tuning smaller, specialized models. This can improve accuracy, reduce latency, and lower costs, but requires more initial investment in data collection and training.
    *   **Model Endpoint:** The AI assistance feature will likely call a dedicated internal API endpoint that wraps the chosen LLM(s).

*   **Prompting the Meta-AI (The AI that generates suggestions):**
    *   The quality of AI-generated suggestions heavily depends on the "meta-prompts" (prompts sent to the LLM by the platform). These need to be carefully engineered and should include:
        *   **User's Raw Input:** The text provided by the user.
        *   **Field Type/Target:** A clear identifier for what kind of input is needed (e.g., `target_field_type: "agent_core_prompt"`).
        *   **Contextual Information:**
            *   For agent prompts: agent's purpose, selected tools, desired persona.
            *   For tool parameters: tool name, specific action, examples of valid parameters.
            *   For JSON schemas: natural language description of data structure, examples of data.
        *   **Output Format Instructions:** Specify if the output should be plain text, JSON, a list of suggestions, etc.
        *   **Constraints & Guidelines:** Any specific rules (e.g., "keep prompt under 200 words," "generate valid JSON schema").
        *   **Few-Shot Examples (Optional but often effective):** Include 2-3 examples of good user inputs and desired AI outputs for the specific field type. This helps the LLM understand the expected style and quality.

*   **Conciseness, Relevance, and Safety:**
    *   AI suggestions should be concise, directly usable, and highly relevant to the user's input and the field's purpose.
    *   Avoid overly verbose, generic, or off-topic suggestions.
    *   Implement safety filters to prevent the generation of harmful, biased, or inappropriate content, especially in free-form text fields like agent prompts or task descriptions.

## 5. UI/UX Considerations

*   **Clarity & Discoverability:**
    *   The "AI Assist" feature should be clearly indicated by a consistent icon or text label, but it should not dominate the interface.
    *   Tooltips on the icon can explain its function on hover.
*   **User Control & Trust:**
    *   Users must always feel in control. AI suggestions are strictly *suggestions*.
    *   The feature should be opt-in for each use.
    *   It must be easy to dismiss, ignore, or undo AI suggestions.
    *   Users should be able to easily edit any AI-generated content.
*   **Speed & Performance:**
    *   The generation of suggestions should be quick (ideally within 1-3 seconds) to avoid disrupting the user's workflow.
    *   Use asynchronous calls and loading indicators if generation might take longer.
*   **Feedback Mechanism:**
    *   Consider including a simple feedback mechanism (e.g., thumbs up/down icons next to suggestions).
    *   This feedback can be used to monitor the quality of suggestions and collect data for improving the underlying AI models and meta-prompts.
*   **Transparency (Optional):**
    *   For some users, it might be helpful to understand *why* an AI suggested a particular input. This could be a future enhancement, possibly showing keywords or logic from the meta-prompt that led to the suggestion.
*   **Consistency:** The look, feel, and interaction pattern for AI assistance should be consistent across all eligible input fields within the platform.
