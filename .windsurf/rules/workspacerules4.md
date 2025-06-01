---
trigger: always_on
---

  2.  **Docstrings / JSDoc / XML Docs (para Funções, Métodos, Propriedades Públicas):**
        * Propósito: Documentar a API de cada unidade de código. Essencial para ferramentas de documentação automática e para a compreensão de outros desenvolvedores (ou de mim mesmo no futuro).
        * Conteúdo Obrigatório:
            * Breve resumo do que a função/método faz.
            * Descrição de cada parâmetro (nome, tipo esperado, propósito).
            * Descrição do valor de retorno (tipo esperado, o que representa).
            * Quaisquer exceções que podem ser lançadas explicitamente.
            * (Opcional, mas útil) Um pequeno
 * IA: "Gerarei Docstrings meticulosamente para todas as funções e métodos públicos que criar ou modificar significativamente, seguindo o formato padrão da linguagem (ex: Google Style para Python Docstrings, JSDoc para JavaScript)."
    3.  **Comentários Inline (para Lógica Complexa):**
        * Propósito: Explicar o "PORQUÊ" de um trecho de código específico que não é imediatamente óbvio, ou para destacar uma decisão de design particular, um workaround, ou uma otimização.
        * IA: "Usarei comentários inline com moderação, apenas onde a lógica for intrincada. Ex: `# Optou-se por X em vez de Y devido ao requisito de performance Z.` ou `# TODO: Refatorar esta seção quando a API externa for atualizada.`"
-   **Uso de Linters e Formatadores (com `desktop-commander`):**
    -   IA: "Se o projeto usa ferramentas de linting (ex: ESLint, Pylint, Flake8) ou formatação (ex: Prettier, Black, gofmt), devo usá-las para garantir a conformidade."
    -   "Como usar:
        1.  Verifique se há scripts no `package.json` ou arquivos de configuração que indiquem as ferramentas usadas.
        2.  Use `DC: execute_command command_line:"npm run lint"` ou `DC: execute_command command_line:"black ."` para invocar a ferramenta.
        3.  Analise a saída: Se houver erros ou avisos, tentarei corrigi-los automaticamente (se a ferramenta permitir, ex: `eslint --fix`) ou manualmente.
        4.  Se uma regra do linter conflitar com uma instrução explícita sua, priorizarei sua instrução, mas o informarei sobre o conflito para que possamos decidir (ex: desabilitar a regra para aquela linha com um comentário específico, se o linter suportar)."
-   **Lidando com Código Legado ou Despadronizado:**
    -   IA: "Ao trabalhar em código legado que não segue os padrões atuais, adotarei uma das seguintes estratégias, dependendo da sua orientação ou da política do projeto:
        1.  **Regra do Escoteiro (Boy Scout Rule):** 'Deixar a área de código um pouco melhor do que a encontrei'. Isso pode envolver pequenas refatorações e melhorias de comentários na seção específica que estou modificando.
        2.  **Consistência Local:** Se a refatoração for muito arriscada ou fora do escopo, seguirei o padrão (ou falta dele) do código imediatamente circundante para manter a consistência local naquela seção.
        3.  **Refatoração Planejada:** Se uma refatoração maior for necessária para alinhar o código legado aos padrões, informarei você e poderemos planejá-la como uma tarefa separada usando `sequential-thinking`."

  **Diretriz Fundamental:** O controle de versão é essencial para rastrear o histórico, colaborar, gerenciar diferentes versões do software e reverter para estados anteriores se necessário. Git é o padrão da indústria.
-   **Configuração Inicial e Identidade (Lembrete para o Usuário):**
    -   IA: "Lembre-se de que para fazer commits, o Git precisa de uma identidade configurada. Se for a primeira vez usando Git nesta máquina, ou se eu detectar que não está configurado, lembrarei você de executar `git config --global user.name \"Seu Nome\"` e `git config --global user.email \"seu.email@example.com\"` no seu terminal. Eu, como agente, não configuro isso."
-   **Fluxos de Trabalho Git (Entendimento Conceitual):**
    -   IA: "Estou ciente dos principais fluxos de trabalho Git. Por favor, informe-me qual fluxo o projeto adota, ou tentarei inferir e confirmar:
        1.  **Feature Branch Workflow (Padrão para muitos projetos):**
            * `main` (ou `master`): Contém código estável e de produção.
            * `develop` (Opcional, mas comum): Branch de integração para features concluídas, representa a próxima release.
            * `feature/nome-descritivo-da-feature`: Criada a partir de `develop` (ou `main`). Todo o trabalho da feature é feito aqui. Merge de volta para `develop` via Pull Request.
        2.  **GitFlow (Mais estruturado, para projetos com releases formais):**
            * Além de `main`, `develop`, `feature/*`, usa `release/versao` (para preparar uma release) e `hotfix/descricao-do-bug` (para correções rápidas em produção, saindo de `main` e mergeando de volta para `main` e `develop`).

