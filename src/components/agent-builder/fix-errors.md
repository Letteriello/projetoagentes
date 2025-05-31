// INFO: This is a Markdown documentation file, not an active React component.
// It likely contains notes related to error fixing during development.

## Debugging Agent Builder Dialog

**Erro 1: `defaultValue` em Slider**

*   **Problema**: Aviso no console sobre componente não controlado mudando para controlado.
    ```
    Warning: A component is changing an uncontrolled input to be controlled.
    ```
*   **Causa**: O `Slider` estava recebendo `value` como `[agentTemperature]` mas `agentTemperature` podia ser `undefined` inicialmente se `editingAgent` fosse `null` e o estado não tivesse um default numérico claro.
*   **Solução**:
    *   Garantir que `agentTemperature` sempre tenha um valor numérico default (e.g., `0.7`).
    *   Ou, usar `defaultValue` no Slider se a intenção é apenas prover um valor inicial e não controlar o componente estritamente o tempo todo (menos comum para sliders que refletem estado). No caso, manter controlado com valor default é melhor.
    *   Verificar se o `value` prop do Slider é sempre um array com um número. `[agentTemperature || 0.7]` pode ser uma forma, mas o ideal é que o estado já tenha o default.

**Erro 2: `JSON.parse('')` em `initialStateValues` (ou similar)**

*   **Problema**: Tentativa de parsear uma string vazia como JSON se o Textarea para `initialStateValues` estivesse vazio.
*   **Causa**: `Textarea` com `value={JSON.stringify(initialStateValues, null, 2)}` e `onChange` tentando parsear `e.target.value`. Se `initialStateValues` é `[]`, `JSON.stringify` produz `'[]'`. Se o usuário apaga tudo, `e.target.value` é `''`.
*   **Solução**:
    *   No `onChange`, verificar se `e.target.value` está vazio. Se sim, setar o estado para `[]` diretamente sem chamar `JSON.parse`.
        ```typescript
        onChange={(e) => {
          const val = e.target.value.trim();
          if (!val) {
            setInitialStateValues([]);
            return;
          }
          try {
            const parsed = JSON.parse(val);
            // ...validações adicionais...
            setInitialStateValues(parsed);
          } catch (error) {
            // Tratar erro de JSON inválido
          }
        }}
        ```

**Erro 3: Tipagem de `content` em `history` para `AgentCreatorFlow`**

*   **Problema**: O `AgentCreatorFlowInputSchema` espera `history` com `content` sendo `z.array(z.object({text: z.string()}))`. O `ChatUI` estava passando `content` como `string` para o `requestBody.history` do `/api/chat-stream`, e essa lógica foi copiada para o `/api/agent-creator-stream`.
*   **Solução**:
    *   Em `ChatUI.tsx`, na função `handleFormSubmit`, quando `isAgentCreatorSession` é true, o mapeamento de `messages` para `historyForBackend` precisa garantir que `content` seja `[{ text: msg.text || "" }]`.
        ```typescript
        const historyForBackend = messages.map(msg => {
          if (isAgentCreatorSession) {
            return {
              role: msg.sender === "user" ? "user" : "model",
              content: [{ text: msg.text || "" }], // Formato para AgentCreatorFlow
            };
          } else {
            return {
              role: msg.sender === "user" ? "user" : "model",
              content: msg.text || "", // Formato para BasicChatFlow
            };
          }
        });
        ```
    *   Isso foi corrigido na última etapa de implementação do Agent Creator.

**Erro 4: Chave de API OpenAI não configurada (Placeholder "dummy")**

*   **Problema**: O plugin OpenAI em `src/ai/genkit.ts` usa `process.env.OPENAI_API_KEY || "dummy"`. Se a chave não estiver no `.env`, chamadas para modelos OpenAI falharão silenciosamente ou com erro da API da OpenAI.
*   **Solução**:
    *   Documentar claramente que a chave `OPENAI_API_KEY` precisa ser configurada no arquivo `.env` para usar modelos OpenAI.
    *   No código, poderia haver um warning no console se a chave "dummy" estiver sendo usada ao tentar selecionar um modelo OpenAI.
    *   Idealmente, o seletor de modelos na UI deveria desabilitar/ocultar modelos OpenAI se a chave não estiver configurada. (Funcionalidade futura).

**Erro 5: `selectedItem` vs `selectedGemId` / `selectedAgentId` em `ChatHeader`**

*   **Problema**: O `ChatHeader` e `AgentSelector` dentro dele precisam saber qual "gem" ou agente salvo está ativo para destacar a seleção correta. A lógica de qual ID usar (gem, savedAgent, ADKAgent) pode ser complexa.
*   **Solução**:
    *   `ChatUI` precisa determinar um `activeChatTargetId` único (seja de gem, savedAgent, etc.) e passar isso para o `ChatHeader`.
    *   `ChatHeader` passa esse ID para `AgentSelector` ou gerencia a lógica de qual select (Gem, SavedAgent, ADK) mostrar o valor ativo.
    *   Isso foi parcialmente tratado ao introduzir `activeChatTarget` para o nome, mas a lógica de seleção de ID nos menus suspensos precisa ser consistente.
    *   No `ChatUI`, o `useEffect` que atualiza `activeChatTarget` foi melhorado, mas garantir que os `Select` no `ChatHeader` reflitam corretamente o `selectedGemId` ou `selectedAgentId` é chave.

**Considerações Gerais de Debugging:**

*   **Console do Navegador**: Sempre verificar por warnings e erros.
*   **Console do Servidor (Terminal do `genkit start` ou `next dev`)**: Verificar por logs de erro das APIs, fluxos Genkit, etc.
*   **Network Tab**: Inspecionar payloads de request e response para as chamadas de API (`/api/chat-stream`, `/api/agent-creator-stream`). Verificar status codes HTTP.
*   **Source Maps**: Garantir que source maps estejam funcionando para facilitar o debugging de código TypeScript no navegador.
*   **Extensões de DevTools**: React DevTools e Redux DevTools (se aplicável) são muito úteis.
*   **Simplicidade**: Ao encontrar um bug, tentar isolar o problema em um componente ou função menor. Comentar código para identificar a origem.
*   **Logs Estratégicos**: Adicionar `console.log` em pontos chave para verificar valores de estado e props durante o fluxo de execução. (Ex: `logger.info` ou `debug` como usado no `agentCreatorFlow`).

Este documento é um log de alguns problemas encontrados e como foram ou seriam abordados.
