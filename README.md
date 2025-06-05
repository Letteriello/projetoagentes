# AI Agent Platform - Design Specification

## Introduction

This project aims to define the design specifications for an innovative AI Agent Platform. The platform is envisioned to empower users to easily create, manage, and deploy AI agents, leveraging the capabilities of a foundational Agent Development Kit (ADK) like Google's. A core goal is to make agent creation accessible to laypeople through intuitive interfaces and AI assistance, while also providing robust features and deep control for advanced users and developers.

The design is guided by the following core principles:
*   **Simplicity & Minimalism:** Striving for clean, uncluttered interfaces where every element serves a clear purpose.
*   **Intuitiveness:** Ensuring interactions are predictable, easy to learn, and reduce cognitive load.
*   **AI-Assisted:** Integrating AI help throughout the platform to simplify complex configurations and inspire users.
*   **Collaborative:** Enabling agents to communicate and work together (Agent-to-Agent or A2A) to solve complex tasks.
*   **User Empowerment:** Providing users with control, confidence, and a clear understanding of their agents' capabilities and operations.

This document, and its linked sub-documents, outline the key functional and design aspects of the platform.

## Table of Contents / Document Structure

This design specification is broken down into the following detailed documents:

1.  **[Core Platform Features](./core_platform_features.md)**
    *   *Description:* Defines and elaborates on the fundamental features of the platform, including agent creation modes, tool integration, AI-assisted input, task management, agent loop orchestration, A2A communication, and UI/UX principles.
2.  **[Agent Creation Process](./agent_creation_process.md)**
    *   *Description:* Details the step-by-step process for creating agents in both "Beginner Mode" (conversational AI builder) and "Advanced Mode" (detailed configuration interface).
3.  **[Tool Integration Mechanism](./tool_integration_mechanism.md)**
    *   *Description:* Specifies how users add, configure, and manage tools (both standard and custom/MCP), and how agents invoke these tools, including security considerations. This also covers the platform's support for (simulated) streaming tools that can return continuous data.
4.  **[AI-Assisted Input](./ai_assisted_input.md)**
    *   *Description:* Outlines the feature that helps users formulate effective prompts and configurations via AI-generated suggestions within various input fields across the platform.
5.  **[Task Management Interface](./task_management_interface.md)**
    *   *Description:* Designs a To-Do list style interface for users to create, assign, and track tasks for their agents, including agent interaction with these tasks.
6.  **[Agent Loop Orchestration](./agent_loop_orchestration.md)**
    *   *Description:* Proposes a strategy for how users can define and manage the execution lifecycle of their agents, including triggers, goals, state management, and error handling for autonomous operations.
7.  **[A2A Communication](./a2a_communication.md)**
    *   *Description:* Plans the integration of Agent-to-Agent communication, leveraging Google's A2A protocol, covering discovery, message formats, collaboration, user controls, and security.
8.  **[UI/UX Guidelines](./ui_ux_guidelines.md)**
    *   *Description:* Establishes the core aesthetic and usability principles for the platform, drawing inspiration from Apple and Google's design philosophies to ensure a simple, minimalist, and intuitive user experience.

## Overall Architecture (High-Level)

*Placeholder for a high-level architecture summary or diagram.*

Conceptually, the platform can be envisioned as a layered architecture:
*   **Foundation (ADK):** At the core lies Google's Agent Development Kit, providing the underlying engine for agent execution, core loop (e.g., ReAct cycles), and fundamental tool usage capabilities.
*   **Platform Services:** Built on top of the ADK, the platform provides services for:
    *   Agent Definition & Configuration (handling Beginner and Advanced modes).
    *   Tool Management & Secure Invocation.
    *   Task Storage & Agent Assignment.
    *   A2A Communication Bus & Discovery Registry.
    *   Orchestration Engine (managing triggers, schedules, and workflows).
    *   Support for advanced agent capabilities, including (simulated) custom audio input streaming and video event stream monitoring.
*   **User Interface Layer:** The web-based UI, guided by the UI/UX principles, provides users access to all platform features, including AI-assisted input generation.
*   **AI Assistance Layer:** A dedicated AI model (or models) that power the "AI-Assisted Input" feature and the "Builder Bot" in Beginner Mode, interacting with various platform services to provide contextual help.

These components work in concert to allow users to define agents (their prompts, tools, and desired autonomy), assign them work or set them to respond to events, and observe their activity, all within a user-friendly environment. The platform's architecture is designed to be extensible, demonstrated by its (simulated) support for streaming tools like the `video-stream-tool.ts` (which uses `AsyncGenerator` to yield continuous data) and custom media inputs like mock audio Data URIs. This showcases readiness for more complex, real-time interactions.

## Next Steps (Conceptual)

This design specification serves as a comprehensive blueprint and foundation for subsequent phases of the project, which would typically include:

1.  **Detailed Technical Design:** Specifying the precise technologies, database schemas, API contracts, and infrastructure.
2.  **Prototyping:** Developing interactive prototypes for key user flows to test and refine UI/UX concepts.
3.  **Implementation:** Phased development of the platform features.
4.  **Testing & Iteration:** Continuous testing (unit, integration, user acceptance) and iterative refinement based on feedback.

This document aims to provide a clear vision to guide these future efforts.

### Tipos de Agentes no AgentVerse

O AgentVerse permite a criação de diferentes tipos de agentes, cada um adequado para cenários específicos:

- **Agente LLM**:
    - **Descrição:** Utiliza Modelos de Linguagem Grande (LLMs) para raciocinar, planejar, gerar respostas e utilizar ferramentas. A descrição do agente é usada por outros agentes LLM para decidir se devem delegar tarefas a ele.
    - **Exemplo de Uso:**
        - **Cenário:** Um agente de suporte ao cliente que responde a Perguntas Frequentes (FAQs) sobre um produto.
        - **Configuração:** Um prompt bem definido que instrui o agente sobre seu papel e tom. Acesso a uma base de conhecimento (via RAG) contendo informações detalhadas do produto. Ferramentas básicas como busca interna na base de conhecimento.
        - **Interação:** Usuário pergunta: "Como faço para resetar minha senha?". O agente consulta sua base de conhecimento e fornece os passos necessários.
    - **Melhores Práticas:**
        - **Instruções Claras:** Forneça prompts detalhados e sem ambiguidades.
        - **Ferramentas Bem Definidas:** Garanta que as ferramentas sejam específicas e retornem informações consistentes.
        - **Refinamento Iterativo:** Teste e refine os prompts e configurações do agente continuamente.
        - **Ajuste de Temperatura:** Configure a temperatura do modelo para balancear a criatividade e a precisão das respostas.
    - **Link para Documentação ADK:** `[Consulte a Documentação do ADK para Agentes LLM (link em breve)]`
    *Exemplo Visual:* [Link para Vídeo/GIF de Demonstração: Agente LLM em Ação (conteúdo a ser adicionado)]

- **Agente de Fluxo de Trabalho (Workflow)**:
    - **Descrição:** Controla a execução de sub-agentes com base em lógica predefinida (sequencial, paralela, loop), sem consultar um LLM para a orquestração em si.
    - **Exemplo de Uso:**
        - **Cenário:** Um agente de onboarding que guia um novo usuário através das etapas de configuração inicial da plataforma.
        - **Configuração:** Um fluxo sequencial: 1. Enviar mensagem de boas-vindas (ferramenta de notificação). 2. Solicitar informações básicas do perfil do usuário (ferramenta de formulário ou sub-agente de coleta de dados). 3. Explicar os próximos passos e funcionalidades principais (ferramenta de informação).
        - **Interação:** O usuário inicia o fluxo de onboarding. O agente executa cada etapa na ordem definida, aguardando a conclusão de uma antes de iniciar a próxima.
    - **Melhores Práticas:**
        - **Modularidade:** Divida processos complexos em etapas menores e gerenciáveis.
        - **Robustez de Cada Etapa:** Garanta que cada ferramenta ou sub-agente no fluxo seja confiável.
        - **Tratamento de Erros:** Implemente mecanismos claros para lidar com falhas em qualquer etapa do fluxo.
    - **Link para Documentação ADK:** `[Consulte a Documentação do ADK para Agentes de Workflow (link em breve)]`
    *Exemplo Visual:* [Link para Vídeo/GIF de Demonstração: Agente de Workflow (conteúdo a ser adicionado)]

- **Agente Customizado**:
    - **Descrição:** Permite implementar lógica operacional única e fluxos de controle específicos, geralmente orquestrando outros agentes e gerenciando estado. Requer desenvolvimento de um fluxo Genkit customizado.
    - **Exemplo de Uso:**
        - **Cenário:** Um agente de processamento de dados que busca informações de uma API externa, realiza transformações nesses dados e os salva em um banco de dados.
        - **Configuração:** Um fluxo Genkit customizado com etapas específicas: 1. Chamar a API externa (usando uma ferramenta HTTP). 2. Aplicar lógica de transformação nos dados recebidos (código TypeScript no fluxo). 3. Conectar e escrever os dados no banco de dados (usando uma ferramenta de banco de dados).
        - **Interação:** O agente pode ser disparado por um gatilho (trigger) agendado (ex: a cada hora) ou por um evento específico na plataforma.
    - **Melhores Práticas:**
        - **Design Modular:** Crie fluxos Genkit bem estruturados e reutilizáveis.
        - **Gerenciamento Eficiente de Estado:** Utilize os mecanismos do Genkit para gerenciar o estado do agente de forma eficaz.
        - **Interações Seguras com APIs:** Armazene chaves de API de forma segura e valide as respostas das APIs.
    - **Link para Documentação ADK:** `[Consulte a Documentação do ADK para Agentes Customizados (link em breve)]`
    *Exemplo Visual:* [Link para Vídeo/GIF de Demonstração: Agente Customizado (conteúdo a ser adicionado)]

- **Agente A2A (Agent-to-Agent)**:
    - **Descrição:** Um tipo especializado de Agente Customizado focado na comunicação e coordenação com outros agentes.
    - **Exemplo de Uso:**
        - **Cenário:** Um "Agente Despachante de Tarefas" que recebe solicitações complexas dos usuários e as decompõe em sub-tarefas, delegando-as para agentes especializados.
        - **Configuração:**
            - O Agente Despachante possui canais A2A definidos para se comunicar com um "Agente de Pesquisa" e um "Agente Escritor de Conteúdo".
            - Possui lógica para interpretar a solicitação do usuário e encaminhar as partes relevantes para o agente apropriado.
            - Os Agentes de Pesquisa e Escritor também são habilitados para A2A, capazes de receber tarefas e retornar resultados para o Despachante.
        - **Interação:** Um usuário pede ao Agente Despachante: "Pesquise sobre as últimas tendências em energia solar e escreva um resumo." O Despachante envia uma mensagem A2A para o Agente de Pesquisa. Após receber os resultados da pesquisa, envia outra mensagem A2A para o Agente Escritor com as informações para criar o resumo. Finalmente, o Despachante consolida e entrega a resposta ao usuário.
    - **Melhores Práticas:**
        - **Formatos de Mensagem Padronizados:** Utilize schemas claros e consistentes para as mensagens trocadas entre agentes.
        - **Contratos Claros:** Defina explicitamente as capacidades e as interfaces de comunicação de cada agente.
        - **Gerenciamento de Dependências:** Monitore e gerencie as dependências entre agentes para evitar falhas em cascata.
        - **Prevenção de Deadlocks:** Projete interações para evitar situações onde agentes ficam esperando indefinidamente uns pelos outros.
    - **Link para Documentação ADK:** `[Consulte a Documentação do ADK para Comunicação A2A (link em breve)]`
    *Exemplo Visual:* [Link para Vídeo/GIF de Demonstração: Agente A2A (conteúdo a ser adicionado)]

## FAQ e Solução de Problemas

### Perguntas Frequentes (FAQ)

- **P1: O que é o AgentVerse?**
    - R: O AgentVerse é uma plataforma que facilita a criação, configuração e gerenciamento de agentes de Inteligência Artificial, utilizando o Google ADK e o framework Genkit. Seu objetivo é tornar o desenvolvimento de agentes acessível para todos os níveis de usuários.
- **P2: Preciso saber programar para usar o AgentVerse?**
    - R: Para criar agentes básicos e utilizar a interface visual, não é necessário conhecimento profundo em programação. No entanto, para desenvolver agentes customizados, fluxos Genkit complexos ou novas ferramentas, será necessário conhecimento em TypeScript/JavaScript e no framework Genkit.
- **P3: Quais modelos de IA são suportados pelo AgentVerse?**
    - R: O AgentVerse, através do Genkit, está configurado para suportar modelos do Google AI (como Gemini), OpenAI e Ollama (para modelos locais). Você pode selecionar o modelo desejado ao configurar um agente LLM.
- **P4: Onde consigo as chaves de API necessárias para os modelos de IA e ferramentas?**
    - R: Você precisará obter as chaves diretamente dos provedores:
        - **Google AI (Gemini)**: No Google AI Studio ou Google Cloud Console.
        - **OpenAI**: Na plataforma da OpenAI.
        - **Google Custom Search (para Busca na Web)**: No Google Programmable Search Engine para o CSE ID e no Google Cloud Console para a API Key.
    - Essas chaves devem ser configuradas no seu arquivo `.env` local ou gerenciadas através do "Cofre de Chaves API" da plataforma, dependendo da configuração da ferramenta.
- **P5: Como configuro o Ollama para usar modelos de IA locais?**
    - R: Você precisa ter o Ollama instalado e em execução em sua máquina ou em um servidor acessível. No arquivo `.env` do AgentVerse, configure a variável `OLLAMA_API_HOST` com o endereço do seu servidor Ollama (ex: `http://localhost:11434`).
- **P6: Qual a diferença entre os tipos de agentes (LLM, Workflow, Customizado, A2A)?**
    - R: **Agente LLM** usa modelos de linguagem para decisão e interação. **Agente de Workflow** orquestra outros agentes ou ferramentas de forma determinística (sequencial, paralela, loop). **Agente Customizado** permite lógica própria via fluxos Genkit. **Agente A2A** é um tipo de agente customizado focado na comunicação com outros agentes.
- **P7: Como uma ferramenta de agente funciona? Eu preciso implementar o backend dela?**
    - R: As ferramentas são funcionalidades que os agentes podem usar (ex: buscar na web). No AgentVerse, elas são implementadas como "tools" do Genkit no backend (veja `src/ai/tools/`). Se você quiser adicionar uma nova ferramenta customizada, precisará implementá-la usando Genkit.
- **P8: O que é RAG e como meu agente pode usá-lo?**
    - R: RAG (Retrieval-Augmented Generation) permite que seu agente acesse e use conhecimento de fontes externas (documentos, websites) para gerar respostas mais precisas. Você pode configurar fontes de conhecimento na aba "Memória e Conhecimento" do Construtor de Agentes.
- **P9: Minhas conversas no chat são salvas? Onde?**
    - R: Sim, as conversas e suas mensagens são salvas localmente no seu navegador utilizando `localStorage`.
- **P10: O novo dashboard mostra "25% dos primeiros passos". Como este progresso é calculado?**
    - R: Atualmente, a barra de progresso no dashboard é um indicador visual estático definido para 25% para incentivar a exploração. Ele ainda não rastreia dinamicamente as ações do usuário. Atualizações futuras podem incluir o rastreamento dinâmico do progresso.
- **P11: O tour da aplicação não iniciou automaticamente. Como posso acioná-lo?**
    - R: O tour é projetado para rodar automaticamente na sua primeira visita. Se você o completou ou pulou, ele não será exibido novamente. Para re-executar o tour, você pode limpar o `localStorage` do seu navegador para este site (procure por uma chave chamada `hasCompletedTour`) e atualizar a página.
- **P12: Um elemento destacado pelo tour não foi encontrado ou estava incorreto.**
    - R: Isso pode acontecer se a estrutura da aplicação mudou. Por favor, reporte este problema para que possamos atualizar os passos do tour.
- **P13: Eu vejo a mensagem "Nenhuma Chave API Configurada" no Cofre de Chaves API. O que isso significa?**
    - R: Isso significa que você ainda não adicionou nenhuma configuração de chave API. Clique no botão "Adicionar Chave API" e siga as instruções. A página também fornece links para guias sobre como obter chaves de provedores comuns como Google AI Studio e OpenAI.
- **P14: Quão preciso é o contador de tokens na entrada do chat?**
    - R: O contador de tokens fornece uma contagem *estimada* baseada em uma biblioteca como `gpt-3-encoder`. A contagem real de tokens usada pelo modelo pode variar um pouco devido a diferenças nos processos de tokenização por diferentes modelos ou provedores. É um guia útil para gerenciar o tamanho da entrada e custos potenciais.
- **P15: O contador de tokens não está visível.**
    - R: Certifique-se de que você está na página de chat e que o componente `MessageInputArea.tsx` carregou corretamente. Se o problema persistir, pode ser um bug.

### Solução de Problemas (Troubleshooting)

- **Problema: O servidor Genkit (`npm run genkit:dev`) não inicia ou apresenta erros.**
    - **Solução**:
        - Verifique se o arquivo `.env` está presente na raiz do projeto e se todas as chaves de API necessárias (GOOGLE_API_KEY, OPENAI_API_KEY, OLLAMA_API_HOST se usado) estão corretamente configuradas.
        - Se estiver usando Ollama, certifique-se de que o serviço Ollama está em execução e acessível no endereço especificado em `OLLAMA_API_HOST`.
        - Verifique o console do terminal para mensagens de erro específicas que possam indicar o problema (ex: conflito de porta, dependências ausentes).
- **Problema: A aplicação Next.js (`npm run dev`) não inicia ou a página não carrega.**
    - **Solução**:
        - Certifique-se de que todas as dependências foram instaladas corretamente com `npm install`.
        - Verifique se não há conflito de portas (o AgentVerse usa a porta 9002 por padrão para o Next.js).
        - Abra o console do desenvolvedor no navegador (geralmente F12) para verificar se há erros de JavaScript.
- **Problema: O agente não responde como esperado no chat ou apresenta erros.**
    - **Solução**:
        - **Verifique a configuração do agente**: No Construtor de Agentes, revise o prompt de sistema, o modelo selecionado, as ferramentas associadas e suas configurações.
        - **Logs do Genkit**: Verifique o terminal onde o servidor Genkit (`npm run genkit:dev`) está rodando. Ele geralmente exibe logs detalhados sobre a execução dos fluxos e ferramentas, incluindo possíveis erros.
        - **Configuração de Ferramentas**: Se o agente utiliza ferramentas que requerem chaves API (como a Busca na Web), certifique-se de que as chaves estão corretas e foram salvas no Cofre de Chaves API ou configuradas diretamente na ferramenta, conforme aplicável.
        - **Rota de Streaming**: Se estiver recebendo erros como "HTTP error" ou "Failed to get readable stream", verifique a rota `/api/chat-stream/route.ts` e o fluxo `basicChatFlow` (`src/ai/flows/chat-flow.ts`) para possíveis problemas na comunicação ou processamento da stream.
        - **Rate Limit**: Você pode ter atingido o limite de requisições para a API de chat. Verifique o console para mensagens de erro `429 Too Many Requests`.
- **Problema: Uma ferramenta específica não funciona (ex: Busca na Web).**
    - **Solução**:
        - **Chaves API**: Verifique se as chaves API para a ferramenta (ex: Google API Key e CSE ID para Busca na Web) estão corretas e foram inseridas no local apropriado (seja no `.env` para o backend Genkit, ou no modal de configuração da ferramenta no Agent Builder).
        - **Permissões da API**: Certifique-se de que a chave API tem as permissões necessárias para usar o serviço (ex: Custom Search API habilitada no Google Cloud Project).
        - **Logs do Genkit**: Analise os logs do servidor Genkit para mensagens de erro específicas da ferramenta.
- **Problema: Problemas visuais ou componentes da UI não carregam corretamente.**
    - **Solução**:
        - Tente limpar o cache do seu navegador.
        - Verifique o console do desenvolvedor do navegador por erros de JavaScript ou CSS.
        - Certifique-se de que as dependências do projeto estão atualizadas (`npm install`).
