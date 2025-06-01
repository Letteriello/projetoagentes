---
trigger: always_on
---

-   **Diretriz Fundamental:** O conhecimento adquirido pela IA (e as decisões tomadas) deve ser persistido para garantir consistência, aprendizado contínuo e evitar a repetição de análises ou erros. O Obsidian Vault é a fonte primária do usuário, mas `mem0` e `memory` (grafo) são as memórias de trabalho e estruturais da IA.
-   **`mem0-memory-mcp (add-memory)` (Uso Estratégico e Avançado):**
    -   IA: "`mem0` é minha memória de fatos, decisões, e contexto conversacional. Usarei `add-memory` criteriosamente para registrar informações valiosas e reutilizáveis."
    -   **Tipos de Informação a Priorizar para `mem0`:**
        1.  **Decisões de Design/Arquitetura e suas Justificativas:** O "PORQUÊ" profundo.
            * Ex: `DESIGN_DECISION_AUTH: Escolhido JWT stateless para autenticação devido à escalabilidade e desacoplamento de serviços, apesar da complexidade de invalidação. Ref: /docs/auth_strategy.md`
        2.  **"Gotchas" Específicos do Projeto/Workspace:** Problemas inesperados encontrados e suas soluções.
            * Ex: `PROJECT_GATCHA_BUILD: O build do módulo X falha no CI se a versão do Node for < 18.2 devido à dependência Y. Solução: Fixar Node v18.2+ no CI.`
        3.  **Soluções para Problemas Complexos:** Resumo da solução para um bug difícil ou um desafio técnico.
            * Ex: `COMPLEX_FIX_PERF: Otimizada query do dashboard Z (antes 30s, agora <2s) aplicando índice composto nas colunas A, B e refatorando o join. Commit: fedcba9`
        4.  **Feedback Importante do Usuário que Moldou uma Feature/Decisão:**
            * Ex: `USER_FEEDBACK_UX: Usuário [Nome] reportou que o fluxo de checkout era confuso. Simplificado em 3 passos conforme /docs/checkout_v2.md. Commit: abc1234`
        5.  **Resumos de Análises do Obsidian Vault:** Pontos chave de documentos extensos.
            * Ex: `OBSIDIAN_SUMMARY_MVP_REQS: Os requisitos MVP do projeto Z (/docs/mvp.md) são: login, CRUD de itens, busca básica. Performance e segurança são preocupações P0.`
    -   **Estruturando Memórias para Busca Eficaz (`search-memories`):**
        * IA: "Usarei prefixos/tags consistentes (como nos exemplos acima) para categorizar as memórias. Isso melhora a relevância das buscas com `search-memories query:'TAG: termo de busca'`."
        * "Serei específico, mas não excessivamente verboso. O objetivo é um lembrete útil, não um dump de informações."
    -   **Ciclo de Feedback e Refinamento de Memórias `mem0`:**
        * IA: "Se você perceber que uma memória que adicionei é incorreta, incompleta, desatualizada ou mal formulada, por favor, me corrija. Posso então usar `add-memory` para registrar a versão corrigida, e você pode me instruir a tentar ignorar a memória antiga nas minhas buscas futuras (embora eu não possa deletá-la de `mem0` diretamente)."

-   **`memory` (Knowledge Graph Tools: `create_entities`, `create_relations`, `add_observations`, `delete_*`) (Uso Estruturado e Avançado):**
    -   IA: "O grafo de conhecimento (`memory`) é usado para modelar as **relações estruturais e formais** entre os componentes do projeto (módulos, classes, funções, serviços, tabelas de BD, etc.). É uma representação viva da arquitetura."
    -   **Casos de Uso Detalhados e Avançados:**
        1.  **Mapear Dependências e Fluxos de Dados:**
            * Entidades: `Module`, `Service`, `Function`, `Class`, `DatabaseTable`, `APIEndpoint`.
            * Relações: `CALLS (ServiceA, FunctionB)`, `WRITES_TO (ServiceA, DatabaseTableX)`, `READS_FROM (ServiceA, DatabaseTableY)`, `PUBLISHES_TO (ModuleA, MessageQueueZ)`, `CONSUMES_FROM (ModuleB, MessageQueueZ)`.
        2.  **Análise de Impacto de Mudanças:**
            * IA: "Antes de modificar uma função crítica, posso consultar o grafo: `search_nodes query:'FIND_RELATIONS FROM FunctionX RELATION_TYPE:IS_CALLED_BY'`. Isso me ajuda a identificar quais outros componentes serão afetados."
        3.  **Documentação Arquitetural Interativa:**
            * IA: "O grafo complementa a documentação em prosa do Obsidian Vault. O vault descreve a intenção e o design conceitual; o grafo modela as conexões concretas. Posso usar informações do grafo para ajudar a gerar diagramas de arquitetura (ex: em formato DOT para Graphviz, ou Mermaid).*