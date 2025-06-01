---
trigger: always_on
---

-   **Diretriz:** (Relembrando) Para qualquer tarefa não trivial, um planejamento passo a passo usando `sequential-thinking` é OBRIGATÓRIO. Este processo transforma o entendimento em um plano de ação concreto e documentado.
-   **Instruções Detalhadas para IA (Continuação):**
    * IA: "Continuando planejamento detalhado com `sequential-thinking` para a tarefa: [Nome/Descrição da Tarefa]."
    * **Estrutura dos Pensamentos e Uso de Parâmetros (Detalhado):**
        * `thought_number`: Use para numerar sequencialmente cada passo do seu raciocínio.
        * `total_thoughts`: Forneça uma estimativa inicial, mas ajuste-a dinamicamente (`total_thoughts` pode aumentar ou diminuir) à medida que a complexidade da solução se revela. Use `next_thought_needed: true` até que o plano esteja completo e verificado.
        * **Pensamento Não Linear e Adaptativo:**
            * `is_revision: true` e `revises_thought: N`: Use quando um novo insight ou a verificação da hipótese indicar que um pensamento anterior (N) precisa ser corrigido ou melhorado. Ex: "Revisando pensamento 3: a abordagem inicial para a função X não considerava o caso de borda Y. A função X deve também..."
            * `branch_from_thought: N` e `branch_id: "nome_alternativa"`: Use se precisar explorar uma abordagem alternativa ou um sub-problema sem descartar a linha de pensamento principal. Ex: "Considerando uma alternativa para o algoritmo de cache (branch 'alt_cache' do pensamento 5): poderíamos usar uma estratégia LRU em vez de FIFO. Prós e contras..."
        * **Documentação de Suposições:**
            * IA: "Durante o planejamento, se eu precisar fazer alguma suposição (ex: sobre o formato de dados de entrada não especificado, sobre o comportamento esperado de um componente externo), devo declará-la explicitamente em um pensamento. Ex: 'Suposição: A API externa XYZ sempre retorna um JSON com o campo `status`.'"
        * **Identificação de Dependências entre Subtarefas:**
            * IA: "Se a tarefa principal pode ser decomposta em subtarefas, o `sequential-thinking` deve identificar a ordem lógica e as dependências entre elas. Ex: 'A criação do endpoint da API (subtarefa A) deve preceder a implementação da UI que o consome (subtarefa B).'"
    * **Output, Documentação e Validação do Plano:**
        * IA: "O log completo e detalhado do `sequential-thinking` não é apenas para o `CHANGELOG.md` ou mensagens de commit. Ele serve como um **artefato de decisão crucial**."
        * "Este artefato pode ser:
            1.  Resumido e adicionado ao `mem0: add-memory` para referência futura sobre o 'porquê' de certas decisões de design.
            2.  Referenciado ou até mesmo incluído (se conciso) em seções relevantes do Obsidian Vault (`/docs`) para documentar o processo de design de uma feature.
            3.  **Apresentado ao usuário para validação ANTES de iniciar a codificação extensiva**, especialmente para features complexas. Ex: 'Este é o plano detalhado para implementar a feature X. Por favor, revise e aprove ou sugira modificações.'"
        * "Este ciclo de feedback sobre o plano economiza tempo, pois correções no papel são mais baratas do que correções no código."

-   **Diretriz Fundamental:** Código consistente, bem comentado e estilisticamente uniforme é mais fácil de ler, entender, depurar e manter, tanto por humanos quanto por outros agentes de IA. Aderência a padrões é um sinal de profissionalismo e facilita a colaboração.
-   **Padrões de Codificação Específicos do Projeto:**
    -   IA: "Além dos padrões gerais da linguagem, devo identificar e seguir os padrões de codificação e idioms específicos estabelecidos neste projeto."
    -   "Fontes para aprender esses padrões incluem:
        1.  **Obsidian Vault (`/docs`):** Pode haver uma seção sobre 'Convenções de Código' ou 'Guia de Estilo'.
        2.  **Arquivos de Configuração de Linters/Formatters:** (ex: `.eslintrc.js`, `pyproject.toml` para Black/Flake8, `.prettierrc`). Devo tentar usar esses arquivos para guiar minha formatação e identificar problemas.
        3.  **Código Existente:** Analise o código bem escrito existente no projeto para inferir padrões de nomenclatura, estrutura de classes/funções, tratamento de erros, etc. Em caso de dúvida, priorize a consistência com o código circundante ou peça orientação."
-   **Tipos de Comentários e Sua Finalidade (Detalhado):**
    -   IA: "Meus comentários devem ser precisos, concisos e agregar valor real. Evitarei comentários que apenas repetem o que o código já diz claramente."
    1.  **Comentários de Bloco/Cabeçalho (para Arquivos, Classes, Módulos):**
        * Propósito: Descrever o objetivo geral do arquivo/classe/módulo, seu autor (se relevante para o projeto), data de criação/modificação significativa, e sua interface pública principal ou responsabilidade.
        * Exemplo (Python):
            ```python
            # ----------------------------------------------------------------------
            # Nome do Arquivo: user_auth_service.py
            # Autor: Agente IA (assistido por [Nome do Usuário])
            # Data: 2025-06-01
            # Descrição: Este módulo lida com a lógica de autenticação e
            #            gerenciamento de sessão de usuários.
            # ----------------------------------------------------------------------
            ```