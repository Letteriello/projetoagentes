---
trigger: manual
---

 **Diretriz Fundamental:** Testar não é uma fase final, mas uma atividade contínua para garantir a qualidade, prevenir regressões e fornecer confiança nas alterações. O objetivo é detectar bugs o mais cedo possível no ciclo de desenvolvimento.
-   **Princípios de Teste (FIRST):**
    -   IA: "Meus esforços de teste e a forma como ajudo a escrevê-los seguirão os princípios FIRST:
        * **F**ast (Rápidos): Testes devem rodar rapidamente para que não hesitemos em executá-los frequentemente.
        * **I**ndependent/Isolated (Independentes/Isolados): Testes não devem depender uns dos outros nem do estado deixado por outros testes. Cada teste deve configurar seu próprio ambiente e limpá-lo se necessário.
        * **R**epeatable (Repetíveis): Devem produzir os mesmos resultados toda vez que forem executados em qualquer ambiente (dev, CI, etc.).
        * **S**elf-Validating (Auto-Validáveis): Devem ter uma saída booleana clara (passou/falhou) sem necessidade de interpretação manual dos resultados.
        * **T**imely/Thorough (Oportunos/Completos): Escritos na hora certa (idealmente junto com o código ou antes - TDD) e devem cobrir os aspectos importantes do código."
-   **A Pirâmide de Testes (Compreensão e Aplicação Conceitual):**
    -   IA: "Entendo a estrutura da Pirâmide de Testes e sua importância para uma estratégia de testes eficiente e balanceada:"
        1.  **Testes Unitários (Base da Pirâmide - Muitos e Rápidos):**
            * Foco: Testar a menor unidade de código (função, método, classe) de forma isolada. Usam-se *mocks* (objetos simulados que você controla) e *stubs* (respostas pré-programadas) para isolar a unidade sob teste de suas dependências externas (banco de dados, APIs de terceiros, sistema de arquivos).
            * IA - Como posso ajudar: "Posso analisar uma função (especialmente funções puras ou aquelas com dependências claramente definidas) e seus requisitos (do Obsidian Vault ou Docstrings) e propor casos de teste unitários. Posso também rascunhar o código desses testes, incluindo a configuração de mocks básicos, se você me fornecer a biblioteca de mocking usada (ex: `unittest.mock` em Python, `Jest mocks` em JS)."
            * Exemplo de instrução para IA: "Para a função `calcular_desconto(preco, percentual)`: deve retornar `preco * (percentual / 100)`. `percentual` deve estar entre 0 e 100. Gere casos de teste unitários para cenários válidos, inválidos (percentual < 0 ou > 100 - esperando exceção ou valor específico) e casos de borda (0% e 100%)."
        2.  **Testes de Integração (Meio da Pirâmide - Menos numerosos, mais lentos que unitários):**
            * Foco: Verificar a interação entre dois ou mais componentes/módulos do sistema. Ex: Interação entre um serviço e seu repositório de dados, ou entre dois microsserviços. Ainda podem usar alguns mocks para dependências externas ao grupo integrado.
            * IA - Como posso ajudar: "Ao implementar uma feature que envolve a comunicação entre o Módulo A e o Módulo B, posso ajudar a identificar os pontos de contato e os contratos de dados entre eles, e sugerir cenários de teste de integração. Ex: 'Se o Módulo A chama a API do Módulo B para criar um usuário, um teste de integração verificaria se o usuário é criado corretamente no Módulo B e se o Módulo A recebe a resposta esperada.'"
        3.  **Testes End-to-End (E2E) (Topo da Pirâmide - Poucos, mais lentos e complexos):**
            * Foco: Simular um fluxo completo do usuário através da aplicação, interagindo com a UI (se houver), APIs, banco de dados, e todos os componentes integrados, como um usuário real faria. São os mais caros de escrever e manter, mas dão alta confiança.
            * IA - Como posso ajudar: "Com base nos fluxos de usuário descritos no Obsidian Vault, posso ajudar a definir cenários de teste E2E. Para aplicações web, posso rascunhar scripts `puppeter` para automatizar esses cenários (detalhes mais abaixo)."
-   **TDD (Test-Driven Development) e BDD (Behavior-Driven Development) - Consciência da IA:**
    -   IA: "Estou ciente dos conceitos de TDD (Red-Green-Refactor: Escrever teste que falha -> Escrever código mínimo para passar -> Refatorar) e BDD (Foco no comportamento do sistema, usando linguagem natural como Gherkin - Given/When/Then)."
    -   "Se o projeto adota explicitamente TDD ou BDD:
        * Para TDD: Você pode me dar os requisitos e eu posso tentar escrever o teste unitário (que falhará inicialmente) antes de escrever o código da funcionalidade.
        * Para BDD: Se você fornecer os 'feature files' em Gherkin, posso usá-los para entender o comportamento esperado e guiar a implementação e os testes E2E/Integração."
        * "Informe-me se devo seguir alguma dessas metodologias ativamente."