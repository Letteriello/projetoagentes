---
trigger: always_on
---

 3.  **Trunk-Based Development (TBD):**
            * Todos os desenvolvedores colaboram em uma única branch chamada `trunk` (geralmente `main`). Commits pequenos e frequentes. Features longas são gerenciadas com *feature flags*."
-   **Estratégias de Branching (Operacional com `desktop-commander`):**
    -   IA: "Sempre trabalharei em feature branches para novas funcionalidades ou correções, a menos que instruído de outra forma para TBD."
    -   Nomenclatura: "Usarei nomes de branch descritivos e consistentes, prefixados com `feature/`, `fix/`, `chore/`, etc. Ex: `feature/user-login-oauth2`, `fix/incorrect-tax-calculation`."
    -   Criação: `DC: execute_command command_line:"git checkout -b feature/nova-feature develop"` (assumindo `develop` como base).
    -   Listagem: `DC: execute_command command_line:"git branch"` para ver branches locais.
    -   Troca: `DC: execute_command command_line:"git switch feature/outra-feature"`.
-   **Commits Atômicos e Mensagens de Commit (Padrão Conventional Commits):**
    -   IA: "Cada commit deve representar uma unidade lógica e funcional de trabalho. Evitarei commits gigantes com múltiplas alterações não relacionadas."
    -   **Formato Conventional Commits (OBRIGATÓRIO):** `<type>[optional scope]: <description>\n\n[optional body]\n\n[optional footer(s)]`
        * `type`: `feat` (nova feature), `fix` (correção de bug), `docs` (mudanças na documentação), `style` (formatação, semântica de código inalterada), `refactor` (reescrita de código sem mudar comportamento), `perf` (melhora de performance), `test` (adição ou correção de testes), `build` (mudanças no sistema de build ou dependências), `ci` (mudanças em scripts de CI/CD), `chore` (manutenção, tarefas que não afetam código de produção).
        * `scope` (Opcional): Módulo ou parte do projeto afetado (ex: `auth`, `api`, `ui`).
        * `description`: Resumo conciso da mudança em imperativo presente (ex: "Adiciona endpoint de login" em vez de "Adicionado..." ou "Adicionando..."). Primeira letra minúscula, sem ponto final.
        * `body` (Opcional): Explicação mais detalhada, motivação, contraste com comportamento anterior.
        * `footer(s)` (Opcional): Para referenciar Issues (ex: `Closes #123`), Breaking Changes (ex: `BREAKING CHANGE: A API X agora requer o parâmetro Y`).
        * IA: "Gerarei mensagens de commit neste formato. Ex: `feat(auth): implementa fluxo de login com OAuth2\n\nAdiciona suporte para login via Google e GitHub. Inclui tratamento de erros e redirecionamento.\n\nCloses #42`"
        * Uso: `DC: execute_command command_line:"git add ."` (ou arquivos específicos), seguido por `DC: execute_command command_line:"git commit -m \"mensagem formatada\""`.
-   **Sincronização com Repositório Remoto (Origem - `origin`):**
    -   IA: "Manterei meu branch local sincronizado com o remoto."
    -   `DC: execute_command command_line:"git fetch origin"`: Buscar atualizações do remoto.
    -   `DC: execute_command command_line:"git pull origin nome-da-branch --rebase"`: Antes de começar a trabalhar ou antes de fazer push, para atualizar a branch local com as últimas mudanças do remoto, aplicando meus commits locais por cima (rebase mantém histórico linear). Se o rebase causar conflitos complexos ou se a branch for compartilhada e outros já tiverem feito pull sem rebase, usarei `git pull origin nome-da-branch` (que faz um merge).
    -   `DC: execute_command command_line:"git push origin nome-da-branch"`: Enviar meus commits para o repositório remoto. Se for a primeira vez fazendo push de uma nova branch: `git push -u origin nome-da-branch`.
-   **Pull/Merge Requests (PRs/MRs) - Preparação:**
    -   IA: "Quando uma feature/fix estiver completa e testada na sua branch, prepararei a informação para um Pull Request (PR) ou Merge Request (MR)."
    -   "A descrição do PR deve incluir:
        1.  Link para a Issue ou tarefa que está sendo resolvida.
        2.  Um resumo das mudanças implementadas (baseado no `sequential-thinking` e nos commits).
        3.  Como as mudanças foram testadas.
        4.  Quaisquer notas para o revisor (ex: áreas que precisam de atenção especial, decisões de design importantes)."
    -   "Após o PR ser aberto, monitorarei o feedback. Se forem necessárias alterações, farei novos commits na mesma feature branch e farei push novamente."
-   **Resolução de Conflitos (Abordagem da IA):**
    -   IA: "Se `git pull --rebase` ou `git merge` (ao integrar `develop` na minha feature branch, por exemplo) resultar em conflitos de merge:"
        1.  "Usarei `DC: execute_command command_line:"git status"` para identificar os arquivos conflitantes."
        2.  "Lerei os arquivos conflitantes usando `DC: read_file` para examinar os marcadores de conflito (`<<<<<<<`, `=======`, `>>>>>>>`)."
        3.  "Para conflitos simples e óbvios (ex: uma mudança trivial em uma linha vs. outra), posso propor uma resolução e pedir sua confirmação antes de aplicar com `DC: edit_block` e `DC: execute_command command_line:"git add arquivo-resolvido"`."
        4.  "Para conflitos complexos ou que exijam entendimento do domínio que eu não possua, listarei os arquivos e as seções conflitantes e pedirei que você resolva manualmente. Após você resolver e commitar, eu continuarei o processo (ex: `git rebase --continue`)."
        5.  "NUNCA forçarei um push ou merge com conflitos não resolvidos ou automaticamente 'resolvidos' de forma arriscada."