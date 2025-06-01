---
trigger: manual
---

4.  **Consistência e Validação de Design:**
            * IA: "Se o Obsidian Vault descreve que o Módulo A NUNCA deve depender diretamente do Módulo C, mas eu encontrar tal dependência no código, posso sinalizar uma inconsistência e atualizar o grafo (ou sugerir correção no código/documentação)."
    -   **Boas Práticas de Modelagem no Grafo:**
        * **Vocabulário/Ontologia Consistente:** Defina (talvez no Obsidian Vault) os tipos de entidades e relações que serão usados. Ex: `Service`, `Repository`, `Controller`, `USES`, `IMPLEMENTS`, `EXTENDS`.
        * **Granularidade Apropriada:** Não modele cada variável, mas componentes significativos.
        * **Manutenção Contínua (CRUCIAL):**
            * IA: "Após refatorações significativas, adição/remoção de módulos, ou mudanças na forma como os componentes interagem, devo ser instruído a atualizar o grafo."
            * Use `create_entities`, `create_relations`, `add_observations` para adições/atualizações.
            * Use `delete_entities` (remove a entidade e suas relações), `delete_relations` (remove relações específicas), `delete_observations` (remove atributos/detalhes de uma entidade) quando componentes são removidos ou suas interações mudam fundamentalmente. "Manter o grafo sincronizado com o código é vital para sua utilidade."
    -   **IA e o Grafo (Proatividade):**
        * IA: "Ao analisar novo código ou modificações, posso propor proativamente a criação de novas entidades/relações no grafo. Ex: 'Detectei uma nova classe `PaymentProcessor` que interage com `OrderService` e `ExternalGatewayAPI`. Devo criar estas entidades e as relações `INITIATES_PAYMENT (OrderService, PaymentProcessor)` e `CALLS_API (PaymentProcessor, ExternalGatewayAPI)` no grafo de conhecimento?'"
        * "Posso também adicionar `observations` a entidades existentes. Ex: `add_observations entity_name:'OrderService' observations:['is_critical_service=true', 'handles_order_lifecycle=true']`."

-   **Diretriz Geral:** Cada MCP Tool tem um propósito. Usá-las corretamente e em combinação maximiza a eficiência e a qualidade do trabalho do agente de IA. As `globalrules` introduziram as ferramentas; aqui, focamos em nuances e melhores práticas no contexto do workspace.

1.  **`desktop-commander` (DC) - Seu canivete suíço para o sistema de arquivos e comandos:**
    -   **Princípio Chave:** SEMPRE use caminhos absolutos para confiabilidade. Verifique `allowedDirectories` com `DC: get_config` se encontrar problemas de acesso.
    -   `read_file` / `read_multiple_files`:
        * IA: "Use para ler configs, código fonte, docs do Obsidian Vault. Lembre-se do `fileReadLineLimit`. Para arquivos muito grandes, leia em chunks se precisar processar todo o conteúdo, ou use `offset` e `length` para leituras parciais."
    -   `write_file`:
        * IA: "**Revisão Profunda do Chunking:** Qualquer conteúdo > `fileWriteLineLimit` (padrão 50 linhas) ou > ~30 linhas / 2000 palavras (como heurística segura) DEVE ser escrito em chunks.
            1.  `DC: write_file path:"abs/path" content:"chunk1" mode:"rewrite"`
            2.  `DC: write_file path:"abs/path" content:"chunk2" mode:"append"`
            3.  ... e assim por diante.
        * "Sempre verifique o resultado. Se a escrita for truncada (apesar do chunking), use `DC: read_file` para ver o que foi escrito, identifique o ponto de truncamento e continue com `mode:'append'` apenas para o restante do conteúdo, possivelmente com chunks ainda menores (15-20 linhas)."
    -   `edit_block`:
        * IA: "Para modificações cirúrgicas. A chave é um `old_string` que seja **único e preciso**, incluindo indentação e linhas de contexto (1-3 antes/depois).
        * Se `expected_replacements` não for fornecido (padrão 1), e `old_string` aparecer múltiplas vezes, a ferramenta pode falhar ou editar a primeira ocorrência. Seja explícito.
        * Para múltiplas edições distintas no mesmo arquivo, prefira múltiplas chamadas `edit_block` menores em vez de uma grande com um `old_string` e `new_string` gigantescos. É mais seguro e fácil de depurar."
    -   `search_code` (ripgrep):
        * IA: "Muito mais poderoso que `grep` simples. Use para encontrar padrões de código, TODOs, usos de uma função específica, etc. Forneça `query` (pode ser regex) e `path` (diretório `src` ou específico). Ex: `DC: search_code query:"def minha_funcao\\(" path:"/abs/path/to/src"`."
    -   `execute_command`:
        * IA: "**ÚLTIMO RECURSO para operações de arquivo.** Prefira sempre as ferramentas DC especializadas (`read_file`, `write_file`, `list_directory`, etc.)."
        * "Use para:
            * Rodar linters, formatadores, scripts de build/teste (ex: `npm run lint`, `pytest`).
            * Comandos Git (já detalhado).
            * Outros comandos CLI para os quais não há ferramenta DC específica.
        * **SEGURANÇA:** "NUNCA execute comandos desconhecidos ou potencialmente destrutivos (`rm -rf`, etc.) sem sua aprovação explícita e confirmação. Se um comando parecer arriscado, avisarei."
        * Use `read_output` para capturar a saída de comandos de longa duração ou interativos. `force_terminate` se um comando travar.

2.  **`context7-mcp` - Seu especialista em documentação de bibliotecas:**
    -   `resolve-library-id`:
        * IA: "Ao analisar a resposta, não olhe apenas para o nome. Considere a descrição, contagem de snippets (indicativo de quão bem documentada está na plataforma Context7) e o trust score. Se houver múltiplas correspondências boas, posso apresentar as top 2-3 para você decidir, ou prosseguir com a mais provável justificando."
    -   `get-library-docs`:
        * IA: "A documentação retornada pode ser extensa. Analisarei as seções relevantes para a tarefa (ex: API de um método específico, guia de setup). Extrairei os pontos chave e os usarei para informar minha implementação."