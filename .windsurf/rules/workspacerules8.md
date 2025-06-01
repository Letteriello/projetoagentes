---
trigger: always_on
---

6.  **Debugging Avançado de Scripts `puppeter`:**
        * IA: "Se um script `puppeter` falhar:
            1.  Analisarei a mensagem de erro e o stack trace.
            2.  Adicionarei `puppeteer_screenshot` antes e depois do passo que falhou para análise visual.
            3.  Posso adicionar logs no console do navegador via `page.on('console', msg => console.log('PAGE LOG:', msg.text()));` (ativado no início do script) e adicionar `console.log` dentro de `puppeteer_evaluate` para depurar valores.
            4.  Com sua permissão e se o ambiente permitir, posso sugerir rodar o script com `headless: false` (o que requereria uma forma de passar essa opção para a ferramenta `puppeter`).
            5.  Verificarei se os seletores ainda são válidos e se há problemas de timing/esperas."
    7.  **Estruturando Testes `puppeter` (Conceitos para IA seguir):**
        * IA: "Embora eu gere scripts, se você adotar padrões como o Page Object Model (POM) – onde cada página da aplicação é uma classe que encapsula os seletores e métodos de interação – tentarei seguir essa estrutura ao adicionar ou modificar testes. Forneça-me os POMs existentes ou a estrutura desejada."
        * "Funções de helper reutilizáveis para ações comuns (ex: `login(usuario, senha)`, `navegarParaPaginaX()`) são uma boa prática."
    8.  **Geração de Casos de Teste `puppeter` a partir de Requisitos:**
        * IA: "A partir de um fluxo de usuário descrito no Obsidian Vault (ex: 'Usuário busca produto, adiciona ao carrinho, faz checkout'), posso:
            1.  Detalhar os passos em um formato Gherkin (Given/When/Then):
                ```gherkin
                Given o usuário está na página inicial
                When ele busca por "produto X"
                And clica no primeiro resultado
                And adiciona o produto ao carrinho
                And vai para o checkout
                Then ele vê o "produto X" no resumo do pedido
                ```
            2.  Traduzir esses passos em um esqueleto de script `puppeter`, identificando os seletores e ações necessárias.
            3.  Pedir a você para revisar e preencher seletores específicos ou lógica de asserção complexa."
    9.  **Manutenção de Testes `puppeter`:**
        * IA: "Testes E2E são inerentemente mais frágeis a mudanças na UI do que testes unitários. Se uma mudança no código quebrar um teste E2E, primeiro verificarei se a feature em si está quebrada. Se a feature funciona mas o teste quebrou (ex: um seletor mudou), tentarei identificar o novo seletor. Se não conseguir, informarei você para que o teste seja atualizado."

-   **Testes Visuais de Regressão (Consciência Conceitual):**
    -   IA: "Estou ciente da existência de ferramentas de teste de regressão visual (ex: Percy, Applitools, Playwright tem funcionalidade nativa). Estas ferramentas comparam screenshots de UIs ao longo do tempo para detectar mudanças visuais inesperadas."
    -   "Se o projeto utiliza tais ferramentas:
        1.  Posso ajudar a integrar chamadas a `puppeteer_screenshot` em pontos chave dos fluxos de E2E, seguindo as convenções da ferramenta de teste visual (ex: nomes de screenshots, metadados).
        2.  Posso ser instruído a acionar os builds na plataforma de teste visual após uma bateria de testes E2E rodar."

-   **Diretriz Fundamental:** O `README.md` é o cartão de visitas e o manual de instruções central do seu projeto. Deve ser abrangente, atualizado, claro e acolhedor para novos contribuidores (humanos ou IA).
-   **Estrutura Detalhada de um README Ideal (IA deve ajudar a manter/gerar seções):**
    1.  **Título do Projeto e Subtítulo/Slogan Conciso:** Claro e impactante.
    2.  **Badges (Escudos Visuais):**
        * IA: "Posso ajudar a formatar os links Markdown para badges comuns se você me fornecer os endpoints/serviços. Ex:
            * Build Status (GitHub Actions, Jenkins, Travis CI): `[![Build Status](URL_DO_BADGE)](URL_DO_BUILD)`
            * Code Coverage (Codecov, Coveralls): `[![Coverage Status](URL_DO_BADGE)](URL_DO_COVERAGE)`
            * Versão da Release (npm, PyPI, GitHub Releases): `[![Release](URL_DO_BADGE)](URL_DA_RELEASE)`
            * Licença (ex: MIT, Apache 2.0): `[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](URL_DA_LICENSA)`
            * Downloads, Status do Projeto, etc."
    3.  **Descrição do Projeto (Parágrafo(s) Iniciais):**
        * O que o projeto faz? Qual problema ele resolve? Para quem ele é destinado?
        * IA: "Posso rascunhar esta seção com base na visão geral do Obsidian Vault."
    4.  **Índice (Table of Contents - TOC):**
        * Essencial para READMEs longos. Facilita a navegação.
        * IA: "Posso gerar um TOC em Markdown com base nos cabeçalhos (H2, H3) do README."
    5.  **Features Principais (Lista com Descrições):**
        * Destaque os principais recursos e funcionalidades.
        * IA: "Extrairei as features do Obsidian Vault e as listarei aqui."
    6.  **(Opcional) Demonstração Visual:**
        * Screenshots, GIFs animados ou um pequeno vídeo demonstrando o projeto em ação.
        * IA: "`puppeteer_screenshot` pode ser usado para gerar screenshots de features chave em aplicações web. Você precisaria inseri-los no Markdown."
    7.  **Tech Stack / Tecnologias Utilizadas:**
        * Liste as principais linguagens, frameworks, bibliotecas e ferramentas.
        * IA: "Posso ajudar a listar as dependências principais do arquivo de gerenciamento de pacotes (ex: `package.json`)."
    8.  **Pré-requisitos Detalhados:**
        * O que precisa estar instalado na máquina do desenvolvedor/usuário antes de começar (ex: Node.js v18+, Python 3.10+, Docker). Inclua versões.