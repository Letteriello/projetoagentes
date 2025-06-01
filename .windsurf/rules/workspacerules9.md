---
trigger: always_on
---

9.  **Guia de Instalação Passo a Passo:**
        * Comandos exatos para clonar o repositório, instalar dependências, configurar o ambiente.
        * IA: "Posso gerar os comandos `git clone`, `npm install`, `pip install -r requirements.txt` etc., usando `DC: execute_command` como referência de sintaxe."
    10. **Guia de Uso/Execução:**
        * Como rodar o projeto localmente para desenvolvimento (ex: `npm run dev`, `python app.py`).
        * Como executar as tarefas mais comuns. Principais scripts do `package.json` ou `Makefile`.
    11. **Como Rodar Testes:**
        * Comando para executar a suíte de testes completa e, se aplicável, testes específicos.
    12. **Guia de Contribuição:**
        * Um link para o arquivo `CONTRIBUTING.md` (se existir) ou uma seção breve: como reportar bugs, sugerir features, fluxo de PRs, padrões de código.
        * IA: "Posso ajudar a rascunhar um `CONTRIBUTING.md` básico seguindo as `globalrules` e `workspacerules`."
    13. **(Opcional) Roadmap:**
        * Visão de futuras features ou direções do projeto.
    14. **Licença:**
        * Nome da licença (ex: MIT, Apache 2.0) e um link para o arquivo `LICENSE` no repositório.
        * IA: "Posso adicionar um texto padrão para licenças comuns se você me disser qual é."
    15. **Contato / Autores / Agradecimentos:**
-   **Manutenção Contínua do README pela IA:**
    * IA: "Após cada nova feature significativa, atualização de dependência chave, ou mudança no processo de build/teste, lembrarei de verificar se o `README.md` precisa ser atualizado usando `DC: read_file` e `DC: edit_block` ou `DC: write_file`."

-   **Diretriz Fundamental:** Manter um `CHANGELOG.md` claro e bem formatado é essencial para que usuários e contribuidores entendam a evolução do projeto, as novidades de cada versão e as correções implementadas.
-   **Formato "Keep a Changelog" (keepachangelog.com) (OBRIGATÓRIO):**
    * IA: "Seguirei estritamente o formato 'Keep a Changelog'."
    * Estrutura:
        ```markdown
        # Changelog
        Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

        O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
        e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/v2.0.0.html).

        ## [Unreleased]
        ### Added (para novas funcionalidades)
        ### Changed (para mudanças em funcionalidades existentes)
        ### Deprecated (para funcionalidades que serão removidas em breve)
        ### Removed (para funcionalidades removidas)
        ### Fixed (para correção de bugs)
        ### Security (em caso de vulnerabilidades)

        ## [1.0.0] - YYYY-MM-DD
        ### Added
        - Lançamento inicial.
        ```
-   **Relação com Versionamento Semântico (SemVer - MAJOR.MINOR.PATCH):**
    * `MAJOR`: Mudanças incompatíveis com versões anteriores (breaking changes).
    * `MINOR`: Adição de funcionalidades de forma compatível com versões anteriores.
    * `PATCH`: Correções de bugs compatíveis com versões anteriores.
    * IA: "Ao preparar uma nova release, o tipo de mudanças na seção `[Unreleased]` ajudará a determinar o incremento da versão (MAJOR, MINOR, ou PATCH)."
-   **Processo de Atualização do Changelog pela IA:**
    1.  **Durante o Desenvolvimento:**
        * IA: "Após cada tarefa significativa (derivada do `sequential-thinking` e resultando em um ou mais commits), adicionarei uma entrada concisa e focada no impacto para o usuário/desenvolvedor na seção apropriada (`Added`, `Changed`, `Fixed`, etc.) dentro de `[Unreleased]`."
        * "A entrada pode ser derivada da mensagem de commit (especialmente se usar Conventional Commits) ou do resumo da tarefa. Ex: `- Fixed: Usuários não conseguiam resetar senha se o email contivesse caracteres especiais.`"
    2.  **Preparação de uma Release:**
        * IA: "Quando você decidir fazer uma nova release:
            a.  Todas as mudanças planejadas devem estar mergeadas e suas entradas no changelog em `[Unreleased]`.
            b.  Substituirei `[Unreleased]` pela nova tag de versão e a data atual (ex: `## [1.2.0] - 2025-06-15`).
            c.  Criarei uma nova seção `## [Unreleased]` vazia no topo do arquivo.
            d.  Esta atualização do `CHANGELOG.md` deve ser parte do commit da release."
        * "Posso automatizar parcialmente este processo de 'release' do changelog com sua instrução."