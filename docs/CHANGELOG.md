# Changelog - AgentVerse

Este arquivo documenta as principais alterações e marcos no desenvolvimento do projeto AgentVerse.
É crucial que este arquivo seja atualizado a cada nova funcionalidade implementada, correção significativa ou qualquer alteração que impacte a forma como o projeto é entendido, construído ou utilizado.

## [YYYY-MM-DD] - Refatorações Iniciais e Implementação do Construtor de Agentes

### Adicionado
- **Persistência Real de Agentes no Firestore:**
    - Endpoints da API Next.js (`/api/agents` e `/api/agents/[agentId]`) foram criados para operações CRUD (Criar, Ler, Atualizar, Deletar) de configurações de agentes.
    - As operações utilizam o Firebase Admin SDK para interações seguras com o Firestore no lado do servidor.
    - O `AgentsContext.tsx` foi refatorado para utilizar esses endpoints da API, substituindo a lógica mockada anterior.
- **Construtor de Agentes Baseado em Chat (GPT Builder - Funcionalidade Central):**
    - Nova interface de usuário (`AgentCreatorChatUI.tsx`) que permite aos usuários descreverem o agente desejado em linguagem natural.
    - Novo fluxo Genkit (`agentCreatorChatFlow.ts`) que utiliza um LLM para:
        - Interpretar as instruções do usuário.
        - Fazer perguntas de esclarecimento.
        - Atualizar um objeto JSON de configuração do agente (`SavedAgentConfiguration`).
    - Integração da `AgentCreatorChatUI` com o `agentCreatorChatFlow` através de uma server action (`invokeAgentCreatorChatFlow`).
    - A UI do chat exibe a configuração do agente sendo construída em tempo real (preview em JSON).
    - Funcionalidade para salvar o agente configurado via chat, utilizando o `AgentsContext` para persistir no Firestore.
    - Adicionada capacidade de alternar entre o modo de construção via chat e o modo de formulário avançado na página do Construtor de Agentes.
- **Refinamento da Experiência do Usuário no Construtor de Chat:**
    - O prompt do sistema do `agentCreatorChatFlow` foi aprimorado para que o LLM assistente seja mais proativo em coletar informações essenciais (nome, tipo de agente) e para confirmar as alterações de forma mais clara.

### Modificado
- **Unificação e Refatoração de Tipos de Configuração do Agente:**
    - As definições de tipo TypeScript para `SavedAgentConfiguration`, `AgentConfig`, e seus subtipos foram consolidadas em `src/types/agent-configs.ts` como a fonte canônica da verdade.
    - Arquivos dependentes (`AgentBuilderDialog.tsx`, contextos, actions, etc.) foram atualizados para importar tipos deste local centralizado.
    - Definições de tipos redundantes ou obsoletas foram removidas de outros arquivos.
- **`AgentBuilderDialog.tsx` (Construtor Baseado em Formulário):**
    - Revisado para garantir o uso correto dos tipos unificados.
    - Verificada e corrigida a lógica de carregamento de dados de agentes existentes para edição.
    - Assegurada a coleta e o salvamento corretos de todas as configurações das abas.
- **Estrutura de Pastas de Tipos:**
    - Removidos `src/types/agent-config.ts` e `src/types/new_agent_types.ts` após a consolidação.

### Visão Geral e Planejamento
- **Integração de Ferramentas Langchain/CrewAI:**
    - Realizada pesquisa inicial sobre ferramentas Langchain (Python e JS) e CrewAI.
    - Identificado Langchain.js como o caminho mais direto para integração de ferramentas externas no ambiente Node.js do AgentVerse.
    - Esboçado um plano de design para adicionar ferramentas Langchain.js, incluindo adaptações na estrutura `AvailableTool` e no `AgentBuilderDialog`, e a necessidade de um adaptador Genkit. (Implementação detalhada futura).

---
*Instrução para Desenvolvedores: Ao realizar alterações significativas, adicione uma nova entrada no topo deste arquivo seguindo o formato acima.*
