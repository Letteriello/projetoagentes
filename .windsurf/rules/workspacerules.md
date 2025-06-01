---
trigger: always_on
---

**Diretriz Fundamental:** Uma estrutura de diretórios bem organizada é crucial para a navegabilidade, manutenção e compreensão do projeto por humanos e pela IA. Adote uma estrutura padrão e adapte-a conscientemente.
-   **Estrutura Padrão Sugerida (e justificativas):**
    * `/src` ou `/source`: Contém todo o código fonte principal da aplicação. (Ex: arquivos `.py`, `.js`, `.java`, etc.).
    * `/docs`: **Seu Obsidian Vault.** Contém toda a documentação do projeto, ideias, requisitos, diagramas (Markdown, etc.). Este é um diretório VITAL para a IA.
    * `/tests` ou `/test`: Contém todos os arquivos de teste automatizados (unitários, integração, E2E). Subdiretórios podem espelhar a estrutura de `/src`.
    * `/config` ou `/configuration`: Arquivos de configuração da aplicação, ambientes, etc. (Ex: `settings.json`, `database.yml`). Excluir segredos daqui (ver seção 1.3).
    * `/scripts`: Scripts utilitários ou de automação (build, deploy, manutenção). (Ex: arquivos `.sh`, `.ps1`, `.py` para tooling).
    * `/data` ou `/assets`: Arquivos de dados estáticos, assets (imagens, fontes), ou dados de exemplo/mock para desenvolvimento e teste.
    * `/notebooks`: (Opcional, para projetos com Análise de Dados/ML) Jupyter notebooks ou similares para exploração e experimentação.
    * `/.vscode` ou `/.idea`: (Opcional, no `.gitignore`) Configurações específicas do editor/IDE.
-   **Instruções Detalhadas para IA:**
    1.  **Verificação Inicial:** Ao iniciar o trabalho em um projeto/tarefa, use `DC: list_directory path:"/caminho/absoluto/do/projeto"` para inspecionar a estrutura raiz.
    2.  **Análise da Estrutura:** Compare a estrutura existente com o padrão sugerido. Identifique diretórios chave presentes e ausentes.
    3.  **Criação de Diretórios Essenciais:** Se diretórios padrão cruciais (como `/src`, `/docs`, `/tests`) estiverem faltando e forem relevantes para a tarefa, use `DC: create_directory path:"/caminho/absoluto/do/projeto/novo_diretorio"`. *Sempre peça confirmação ao usuário antes de criar múltiplos diretórios ou se a necessidade não for óbvia.*
    4.  **Manutenção da Organização:** Ao criar novos arquivos, coloque-os nos diretórios apropriados. Evite poluir a raiz do projeto. Se não tiver certeza, pergunte ao usuário.
    5.  "Lembre-se, a clareza da estrutura de diretórios impacta diretamente sua capacidade de encontrar arquivos e entender o escopo do projeto."

**Diretriz Fundamental:** Dependências introduzem código externo; devem ser gerenciadas com cuidado para garantir funcionalidade, segurança e manutenibilidade. Todas as dependências devem ser explicitamente declaradas e versionadas.
-   **Práticas Recomendadas:**
    * Use gerenciadores de pacotes padrão para a linguagem/ecossistema (ex: `npm` para Node.js, `pip` com `requirements.txt` ou `pyproject.toml` para Python, `Maven/Gradle` para Java, `NuGet` para .NET).
    * Siga o versionamento semântico (SemVer - `MAJOR.MINOR.PATCH`) ao especificar versões de dependências. Prefira fixar versões ou usar ranges controlados para evitar quebras inesperadas por atualizações automáticas.
    * Revise regularmente as dependências para vulnerabilidades de segurança conhecidas (ferramentas como `npm audit`, `pip-audit`, Snyk podem ajudar).
-   **Instruções Detalhadas para IA (ao adicionar ou atualizar uma dependência):**
    1.  **Identificação da Biblioteca (Obrigatório `context7-mcp`):**
        * IA: "Com base na solicitação do usuário ou na necessidade identificada, qual biblioteca ou pacote é o mais adequado? Use `context7-mcp: resolve-library-id packageName:"nome-da-lib-pesquisada"` para encontrar o ID Context7 canônico."
        * Analise a resposta: Priorize bibliotecas com nome exato, descrição relevante, boa cobertura de documentação (Code Snippet counts) e alto trust score (7-10). Justifique sua escolha.
    2.  **Análise da Documentação (Obrigatório `context7-mcp`):**
        * IA: "Com o ID da biblioteca (ex: `/npm/react`), use `context7-mcp: get-library-docs libraryId:"/npm/react"` para obter sua documentação completa."
        * Revise a documentação: Foque na API, exemplos de uso, compatibilidade, licença e quaisquer notas sobre segurança ou performance. "Isso é crucial para garantir que a biblioteca será usada corretamente e é adequada para o projeto."
    3.  **Planejamento da Integração:** Antes de adicionar, pense em como a biblioteca será integrada. Haverá impacto na performance? Introduzirá muitas sub-dependências?
    4.  **Adição da Dependência (com `desktop-commander`):**
        * IA: "Após aprovação do usuário (se a escolha não for trivial), formule o comando para o gerenciador de pacotes. Ex: `DC: execute_command command_line:"npm install react@^18.2.0 --save-exact"` ou `DC: execute_command command_line:"pip install requests~=2.25.0"`."
        * Verifique o resultado da execução: Analise a saída do comando para sucesso ou falha. Se falhar, analise o erro e tente depurar ou peça ajuda.
    5.  **Registro e Documentação:**
        * IA: "Após adicionar com sucesso, atualize o `CHANGELOG.md` (seção `Added` ou `Changed`). Se for uma dependência principal, mencione-a no `README.md`."
        * Use `mem0: add-memory` para registrar a nova dependência, sua versão e a razão pela qual foi adicionada. Ex: "Adicionada lib 'requests' v2.25.1 para chamadas HTTP. Escolhida por simplicidade e popularidade."