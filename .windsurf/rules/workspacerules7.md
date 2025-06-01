---
trigger: always_on
---

-   **Execução de Suítes de Teste com `DC: execute_command` (Reforço e Detalhes):**
    -   IA: "Ao executar testes (`DC: execute_command command_line:"npm test"` ou `pytest`), devo estar atento a:
        * **Variáveis de Ambiente Específicas para Testes:** "Pergunte se há variáveis de ambiente (ex: `NODE_ENV=test`, `DB_URL_TEST`) que precisam ser configuradas para o ambiente de teste. Posso prefixar o comando se necessário (ex: `NODE_ENV=test npm test`)."
        * **Saída e Relatórios de Teste:** "Analisarei a saída do console para o resumo (número de testes passados/falhados, erros). Se relatórios forem gerados (ex: JUnit XML, HTML), e eu tiver como acessá-los e interpretá-los (ou se você puder me fornecer o resumo), isso pode ajudar a identificar falhas específicas."
        * **Execução Seletiva:** "Se precisar rodar apenas um subconjunto de testes (ex: um arquivo específico, testes com um marcador), por favor, forneça o comando exato para o test runner utilizado."

-   **Cobertura de Teste (Code Coverage) (Detalhado):**
    -   IA: "A cobertura de teste (quantas linhas/branches/funções do código são exercitadas pelos testes) é um indicador importante, mas não o único, da qualidade dos testes."
    -   **Execução de Ferramentas de Coverage:** "Se o projeto usa ferramentas de coverage (ex: `coverage.py` para Python, `nyc/istanbul` para JS), posso tentar executar os testes com a opção de coverage ativada (ex: `DC: execute_command command_line:"coverage run -m pytest && coverage report"`)."
    -   **Interpretação de Relatórios (Básica):** "Posso analisar o percentual geral de coverage. Se você me fornecer as seções do relatório que indicam linhas/arquivos críticos não cobertos, posso sugerir casos de teste adicionais para essas áreas, especialmente se estiverem relacionadas a requisitos no Obsidian Vault."
    -   **Objetivo da Cobertura:** "Lembre-se, o objetivo não é atingir 100% de cobertura cegamente, mas garantir que a lógica de negócios crítica, os caminhos complexos e os casos de borda importantes estejam bem testados."

-   **`puppeter` para Testes E2E Web (FOCO PRINCIPAL E EXPANSÃO PROFUNDA):**
    -   IA: "`puppeter` é uma ferramenta poderosa para simular interações do usuário em aplicações web. Usarei as seguintes estratégias para criar testes E2E robustos e significativos:"
    1.  **Seletores Robustos e Estratégias Avançadas:**
        * "Priorizarei seletores estáveis: `data-testid` atributos (melhor), IDs únicos, seletores ARIA (para acessibilidade e teste). Evitarei XPaths muito longos ou baseados em estrutura DOM frágil."
        * "Se um seletor direto não for óbvio, posso usar `puppeteer_evaluate` para executar JavaScript que encontre o elemento usando lógica mais complexa (ex: encontrar um elemento por seu texto e depois navegar para um parente/filho)."
    2.  **Tratamento Avançado de Esperas (Waits):**
        * "Evitarei `waitForTimeout` (sleeps fixos) sempre que possível, pois tornam os testes lentos e instáveis."
        * "Usarei esperas explícitas e condicionais:
            * `waitForSelector(selector, { visible: true, timeout: ... })`: Esperar um elemento estar visível.
            * `waitForNavigation({ waitUntil: 'networkidle0', timeout: ... })`: Esperar a navegação completar e a rede ficar ociosa (útil após submits de formulário ou cliques em links).
            * `waitForFunction(jsFunction, { polling: 'mutation', timeout: ... }, ...args)`: Esperar uma função JavaScript retornar `true`. Poderoso para condições customizadas.
            * `waitForResponse(urlOrPredicate, { timeout: ... })`: Esperar uma resposta de rede específica.
            * `waitForRequest(urlOrPredicate, { timeout: ... })`: Esperar uma requisição de rede específica."
        * "Lidarei com condições de corrida tentando garantir que o estado da aplicação esteja estável antes de interagir."
    3.  **Interações Complexas e Manipulação de Elementos com `puppeteer_evaluate`:**
        * "Para interações que vão além de simples cliques ou preenchimentos, usarei `puppeteer_evaluate(jsFunction, ...args)` para executar código JavaScript no contexto da página."
        * "Isso permite: interagir com Web APIs (localStorage, sessionStorage, IndexedDB para setup/asserções), disparar eventos customizados, obter propriedades complexas de elementos, validar estados que não são visíveis na UI."
        * IA: `puppeteer_screenshot({ fullPage: true, path: 'screenshot.png' })` ou de um elemento específico (`element.screenshot(...)` dentro de `evaluate`).
        * `puppeteer_hover(selector)`, `puppeteer_select(selector, valueOrValues)`.
    4.  **Navegação Avançada:**
        * "Posso lidar com pop-ups (novas janelas/abas) escutando o evento `targetcreated` do browser e depois mudando o contexto da `page` para o novo target."
        * "Para iframes, precisarei primeiro obter o frame (`page.frames().find(...)` ou `page.waitForFrame(...)`) e depois executar comandos no contexto desse frame (`frame.click(selector)`)."
    5.  **Autenticação em Testes E2E:**
        * "A autenticação é um desafio comum. Estratégias (a serem decididas com você):
            * **Login via UI (Padrão, mas pode ser lento):** Automatizar o formulário de login em cada suíte de teste ou uma vez por sessão.
            * **Login Programático/API (Mais rápido, se disponível):** Se houver um endpoint de API para login, posso usá-lo para obter um token/cookie e depois configurar a sessão no `puppeter` (`page.setCookie(...)` ou setar `Authorization` header para requisições se a UI usa fetch/XHR). **Cuidado com segredos aqui.**
            * **Estado de Sessão Mockado/Injetado (Avançado):** Para ambientes de teste controlados, injetar um estado de sessão válido (ex: via localStorage ou cookie). Requer configuração específica da aplicação."
        * IA: "A estratégia de autenticação deve ser segura e NUNCA expor credenciais de produção."