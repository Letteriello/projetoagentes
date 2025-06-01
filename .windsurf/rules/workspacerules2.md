---
trigger: always_on
---

-   **Diretriz Fundamental:** Antes de escrever ou modificar qualquer linha de código, um entendimento profundo da tarefa, do contexto do projeto e da visão do usuário é essencial. Este processo de planejamento minimiza retrabalho, desalinhamentos e erros.

**2.1.0. Leitura e Análise Profunda do Obsidian Vault (Diretório: `/docs`):**
    -   **Importância Primordial:** O diretório `/docs` (seu Obsidian Vault) é considerado a **fonte da verdade** para a visão do usuário, requisitos, ideias de design, fluxos de trabalho e arquitetura conceitual. O conteúdo aqui tem precedência sobre interpretações ou informações menos diretas.
    -   **Instruções Detalhadas para IA (Ação Obrigatória no Início de Cada Tarefa Relevante):**
        a.  **Localização e Listagem:**
            * IA: "Verificando a existência e o conteúdo do Obsidian Vault em `/docs`..."
            * Use `DC: list_directory path:"/caminho/absoluto/projeto/docs" recursive:true` para obter uma lista de todos os arquivos e subdiretórios dentro do vault. Filtre por arquivos `.md`.
        b.  **Leitura Completa e Estratégica:**
            * IA: "Iniciando a leitura dos arquivos Markdown do vault..."
            * Use `DC: read_multiple_files file_paths:["/path/to/doc1.md", "/path/to/doc2.md", ...]` para ler todos os arquivos `.md` identificados. Para vaults muito grandes, priorize arquivos com nomes relevantes à tarefa atual ou modificados recentemente, mas informe ao usuário se estiver fazendo uma leitura parcial.
        c.  **Interpretação e Análise do Conteúdo Markdown:**
            * IA: "Analisando o conteúdo do vault... Buscando títulos, seções, listas, links, blocos de código, e referências a diagramas (ex: Mermaid, Excalidraw) para entender a estrutura da informação."
            * "Preste atenção especial a:
                * **Requisitos Funcionais:** O que o sistema deve fazer (ex: "Usuário deve poder resetar senha").
                * **Requisitos Não Funcionais:** Qualidades do sistema (ex: "Página deve carregar em <2s", "Sistema deve ser seguro contra XSS").
                * **Fluxos de Usuário/Processo:** Sequências de ações ou etapas descritas.
                * **Modelos de Dados/Entidades:** Descrições de estruturas de dados ou objetos de negócio.
                * **Decisões de Arquitetura/Design:** Justificativas para escolhas técnicas ou de design.
                * **Objetivos Gerais do Projeto:** A "big picture" e o problema que o projeto visa resolver."
        d.  **Extração e Registro de Conhecimento (Memória Primária):**
            * IA: "Registrando os principais insights e requisitos do Obsidian Vault na memória..."
            * Use `mem0: add-memory` para cada insight ou requisito chave. Ex: `mem0: add-memory memory_text:"OBSIDIAN_VAULT_REQ: O sistema deve permitir que administradores gerenciem usuários (CRUD) - conforme /docs/admin_features.md"`.
            * "Seções ou diagramas complexos podem ser resumidos, mas sempre referencie o arquivo de origem. Se encontrar diagramas Mermaid ou Excalidraw (ou links para eles), tente interpretá-los conceitualmente ou peça ao usuário para explicá-los se forem cruciais."
        e.  **Esclarecimento de Ambiguidades:**
            * IA: "Se encontrar informações conflitantes, desatualizadas, ambíguas ou incompletas no vault, liste-as e peça esclarecimentos ao usuário. Ex: 'No arquivo `feature_x.md`, o fluxo Y está descrito de duas formas diferentes. Qual devo seguir?'"
        f.  **Impacto no Desenvolvimento:**
            * IA: "O conhecimento adquirido do Obsidian Vault será a principal diretriz para minhas decisões de design, implementação e teste. Todas as funcionalidades desenvolvidas devem estar alinhadas com esta fonte."

**2.1.1. Consulta a Memórias Adicionais e Contexto Histórico:**
    -   **Diretriz:** Após absorver o conhecimento do Obsidian Vault, complemente-o com o histórico do projeto e decisões anteriores armazenadas na memória.
    -   **Instruções Detalhadas para IA:**
        * IA: "Consultando memórias (`mem0: search-memories`) para buscar contexto adicional..."
        * Formule queries específicas para `mem0: search-memories` usando palavras-chave da tarefa atual, termos do Obsidian Vault, ou nomes de módulos/componentes relevantes. Ex: `mem0: search-memories query:"decisões anteriores sobre autenticação"`, `mem0: search-memories query:"problemas conhecidos módulo de pagamento"`.
        * "Cruze as informações: Como as memórias existentes se relacionam com o que foi encontrado no Obsidian Vault? Há consistência? Alguma memória antiga é invalidada pelo vault mais recente?"

**2.1.2. Análise da Estrutura Técnica Existente e Pontos de Impacto:**
    -   **Diretriz:** Entenda a base de código atual para planejar como as novas alterações se encaixarão.
    -   **Instruções Detalhadas para IA:**
        * IA: "Analisando a estrutura técnica do projeto com `memory` (grafo de conhecimento)..."
        * Use `memory: search_nodes query:"nome_modulo_relevante"` ou `memory: read_graph` (se o grafo for pequeno/médio e uma visão geral for útil) para entender as principais entidades de código (classes, funções, módulos) e suas interconexões.
        * "Identifique os arquivos e componentes que provavelmente serão afetados pela tarefa atual. Quais são as dependências diretas e indiretas? Existem riscos de efeitos colaterais?"
        * Use `DC: search_code query:"padrao_de_codigo_relacionado" path:"/caminho/absoluto/src"` para encontrar exemplos de implementações similares ou áreas que precisarão de modificação.