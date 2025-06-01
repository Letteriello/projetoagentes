## 1. Visão Geral do Projeto AgentVerse

Bem-vindo ao AgentVerse! 🎉

O AgentVerse é uma plataforma inovadora projetada para democratizar a criação e o gerenciamento de agentes de Inteligência Artificial (IA). Utilizando o poder do **Google Agent Development Kit (ADK)**, o AgentVerse oferece uma interface intuitiva e robusta que torna a construção de agentes acessível a todos, desde usuários leigos com pouca ou nenhuma experiência em programação até desenvolvedores avançados que buscam otimizar e escalar suas soluções de IA.

### 1.1. Propósito e Problema que Resolve

O principal objetivo do AgentVerse é simplificar a complexidade inerente ao desenvolvimento de agentes de IA. Muitas plataformas e frameworks exigem um conhecimento técnico aprofundado, tornando a criação de agentes uma tarefa desafiadora para um público mais amplo. O AgentVerse busca resolver isso ao:

- Fornecer uma **interface visual amigável** para a criação, configuração e monitoramento de agentes.
- Abstrair as complexidades do Google ADK e outras tecnologias de IA subjacentes.
- Capacitar usuários de todos os níveis a construir e implantar agentes personalizados para diversas finalidades.

### 1.2. Público-Alvo

O AgentVerse é destinado a um espectro variado de usuários:

- **Usuários Leigos/Iniciantes em IA**: Indivíduos que desejam explorar o potencial dos agentes de IA sem a necessidade de codificação extensiva.
- **Desenvolvedores e Profissionais de TI**: Que buscam uma maneira mais rápida e eficiente de prototipar, desenvolver e gerenciar agentes de IA.
- **Empresas e Empreendedores**: Que querem integrar soluções de IA em seus processos e produtos de forma ágil.
- **Educadores e Estudantes**: Que podem utilizar a plataforma como ferramenta de aprendizado e experimentação no campo da IA.

### 1.3. Principais Funcionalidades

O AgentVerse oferece um conjunto de funcionalidades poderosas para o ciclo de vida completo dos agentes de IA:

- **Construtor de Agentes (Agent Builder)**: Uma interface visual completa para criar e configurar diferentes tipos de agentes (LLM, Workflow, Customizados e A2A), definir seus objetivos, tarefas, personalidades, ferramentas e modelos de IA.
- **Interface de Chat Avançada**: Permite interagir diretamente com os agentes criados, testar suas funcionalidades, enviar mensagens e arquivos, e gerenciar o histórico de conversas.
- **Cofre de Chaves API (API Key Vault)**: Um local seguro para gerenciar as chaves de API necessárias para que os agentes acessem serviços externos e modelos de IA.
- **Gerenciamento de Perfil**: Permite aos usuários configurar suas informações e preferências que podem ser utilizadas pelos agentes.
- **Configuração Detalhada de Agentes**: Inclui gerenciamento de ferramentas, memória e conhecimento (RAG), artefatos e comunicação entre agentes (A2A).

### 1.4. Tecnologias Chave

O AgentVerse é construído sobre um conjunto de tecnologias modernas e robustas:

- **Next.js**: Framework React para desenvolvimento frontend, oferecendo renderização do lado do servidor e geração de sites estáticos.
- **TypeScript**: Superset do JavaScript que adiciona tipagem estática para maior robustez do código.
- **Genkit (Google)**: Framework de desenvolvimento para construir aplicações de IA, utilizado para definir fluxos, ferramentas e integrar modelos de linguagem.
    - Suporte a múltiplos provedores de modelos como Google AI (Gemini), OpenAI e Ollama.
- **Google Agent Development Kit (ADK)**: Embora o Genkit seja o framework principal, a filosofia e os conceitos do ADK (como agentes, ferramentas, estado, memória, artefatos, A2A) são fundamentais para a arquitetura da plataforma.
- **Tailwind CSS**: Framework CSS utility-first para estilização rápida e customizável.
- **Shadcn/UI**: Coleção de componentes de UI reusáveis construídos com Radix UI e Tailwind CSS.
- **Firebase**: Utilizado para hospedagem da aplicação (App Hosting).

## 2. Guia de Início Rápido (Getting Started)

Este guia irá orientá-lo através dos passos necessários para configurar o projeto AgentVerse em seu ambiente de desenvolvimento local.

### 2.1. Pré-requisitos

Antes de começar, certifique-se de que você tem o seguinte software e contas configuradas:

- **Node.js**: Versão 18.18.0 ou superior. O projeto utiliza `npm` como gerenciador de pacotes. (Inferido pela engine do Next.js especificada no `package.json`)
- **Git**: Para clonar o repositório.
- **Conta Firebase**: O projeto utiliza o Firebase App Hosting para deploy e pode utilizar outros serviços do Firebase. Você precisará de um projeto Firebase configurado.
- **Firebase CLI (Recomendado)**: Para interagir com seu projeto Firebase.
- **Chaves de API (APIs Keys)**: Para utilizar os modelos de IA integrados (Google AI/Gemini, OpenAI) e outras ferramentas (como Google Custom Search), você precisará obter as respectivas chaves de API.
    - Google AI (Gemini)
    - OpenAI API Key
    - Google Custom Search API Key e CSE ID (para a ferramenta de busca na web)
    - Ollama (se for utilizar modelos locais via Ollama, certifique-se que o serviço Ollama esteja em execução e acessível)

### 2.2. Instalação do Projeto

1. Clone o Repositório:
    
    Abra seu terminal e clone o repositório do AgentVerse:
    
    Bash
    
    ```
    git clone <URL_DO_REPOSITORIO_GIT>
    cd agentverse # ou o nome da pasta do seu projeto
    ```
    
2. Instale as Dependências:
    
    Utilize o npm para instalar todas as dependências do projeto listadas no package.json:
    
    Bash
    
    ```
    npm install
    ```
    

### 2.3. Configuração do Ambiente de Desenvolvimento

1. Variáveis de Ambiente (.env):
    
    O projeto utiliza um arquivo .env para gerenciar chaves de API e outras configurações sensíveis. Crie um arquivo chamado .env na raiz do projeto e adicione as seguintes variáveis, substituindo os valores pelos seus:
    
    Snippet de código
    
    ```
    # Chave de API do Google AI Studio ou Google Cloud Vertex AI para modelos Gemini
    GOOGLE_API_KEY=SUA_GOOGLE_API_KEY
    
    # Chave de API da OpenAI (opcional, se for usar modelos OpenAI via Genkit)
    OPENAI_API_KEY=SUA_OPENAI_API_KEY
    
    # Host para o serviço Ollama (opcional, se for usar modelos locais via Ollama)
    # Exemplo: http://localhost:11434
    OLLAMA_API_HOST=SEU_OLLAMA_HOST
    
    # Nome do modelo Genkit padrão a ser usado (opcional, fallback para o definido em src/ai/genkit.ts)
    # Exemplo: googleai/gemini-1.5-flash-latest
    GENKIT_MODEL_NAME=googleai/gemini-1.5-flash-latest
    
    # Chaves para a ferramenta de Busca na Web (Google Custom Search)
    # GOOGLE_API_KEY já está acima, mas pode ser uma chave diferente se as permissões forem distintas.
    GOOGLE_CSE_ID=SEU_GOOGLE_CUSTOM_SEARCH_ENGINE_ID
    
    # Outras variáveis que seu projeto possa necessitar no futuro...
    ```
    
    _Referência para obtenção de chaves:_
    
    - `GOOGLE_API_KEY`: Google AI Studio ou Google Cloud Console.
    - `OPENAI_API_KEY`: Plataforma da OpenAI.
    - `GOOGLE_CSE_ID`: Google Programmable Search Engine.
2. **Configuração do Firebase:**
    
    - Certifique-se de ter um projeto Firebase criado.
    - Se você planeja usar funcionalidades do Firebase que requerem configuração no lado do cliente (como autenticação, Firestore web, etc.), adicione a configuração do Firebase SDK ao seu projeto. Geralmente, isso é feito em um arquivo de inicialização do Firebase no frontend. (Atualmente, o foco parece ser no App Hosting e dependências do Firebase, mas o uso detalhado não está explícito nos arquivos fornecidos).
    - Para deploy com Firebase App Hosting, você precisará estar logado no Firebase CLI: `firebase login`.
3. Configuração do Genkit:
    
    O Genkit é inicializado em src/ai/genkit.ts e os fluxos e ferramentas são importados em src/ai/dev.ts para serem servidos pelo Genkit CLI.
    
    - Para iniciar o servidor de desenvolvimento do Genkit (que expõe seus fluxos e ferramentas), utilize o comando:
        
        Bash
        
        ```
        npm run genkit:dev
        ```
        
        Ou para observar alterações nos arquivos de IA:
        
        Bash
        
        ```
        npm run genkit:watch
        ```
        
    - O servidor Genkit geralmente roda em uma porta diferente da aplicação Next.js (por padrão, `localhost:3400`, mas verifique o output do terminal).
        

### 2.4. Executando o Projeto Localmente

Para rodar o AgentVerse localmente, você precisará iniciar dois processos principais:

1. Aplicação Next.js (Frontend):
    
    Execute o seguinte comando para iniciar o servidor de desenvolvimento do Next.js com Turbopack (configurado para a porta 9002 no package.json):
    
    Bash
    
    ```
    npm run dev
    ```
    
    Acesse a aplicação em `http://localhost:9002` no seu navegador.
    
2. Serviços de IA (Genkit):
    
    Em um terminal separado, inicie o servidor Genkit como mencionado na seção 2.3.3:
    
    Bash
    
    ```
    npm run genkit:dev
    ```
    
    Isso disponibilizará os fluxos de IA (como o `chat-flow`) e ferramentas para a aplicação Next.js.
    

Com ambos os servidores em execução, a plataforma AgentVerse deve estar funcional para desenvolvimento e testes locais.

## 3. Conceitos Fundamentais

Para aproveitar ao máximo o AgentVerse, é útil compreender alguns conceitos essenciais sobre agentes de IA, as tecnologias subjacentes como Google ADK e Genkit, e os componentes específicos da plataforma.

### 3.1. O que é um Agente de IA?

Um **Agente de Inteligência Artificial (IA)** é um sistema de software projetado para perceber seu ambiente, processar informações, tomar decisões e realizar ações para atingir objetivos específicos. No contexto do AgentVerse, um agente pode ser desde um simples chatbot que responde a perguntas até um sistema complexo que utiliza múltiplas ferramentas, interage com outros agentes e gerencia fluxos de trabalho. O objetivo do AgentVerse é justamente tornar a criação desses agentes uma tarefa mais simples e acessível.

### 3.2. Google ADK (Agent Development Kit)

O **Google Agent Development Kit (ADK)** é um conjunto de ferramentas e bibliotecas do Google projetado para facilitar o desenvolvimento de agentes de IA avançados e robustos. Embora o AgentVerse utilize o Genkit como seu principal framework de backend para IA, a plataforma é fortemente inspirada e busca alinhar-se com os conceitos e a arquitetura propostos pelo Google ADK. Isso inclui a maneira como os agentes são estruturados, como utilizam ferramentas, gerenciam estado, memória, conhecimento (RAG), artefatos e se comunicam entre si (A2A). O AgentVerse visa fornecer uma interface visual para muitos desses conceitos do ADK.

### 3.3. Genkit: O Framework de IA do AgentVerse

O AgentVerse utiliza o **Genkit** como o framework de backend para construir e executar a lógica de IA dos agentes. O Genkit, desenvolvido pelo Google, simplifica a criação de aplicações de IA, permitindo a integração de diversos modelos de linguagem, a definição de fluxos de processamento e a criação de ferramentas customizadas.

Os principais componentes do Genkit utilizados no AgentVerse incluem:

- **Modelos (Models)**: Permitem a integração com diferentes provedores de Modelos de Linguagem Grande (LLMs), como Google AI (Gemini), OpenAI e Ollama. O AgentVerse está configurado para usar esses provedores.
- **Fluxos (Flows)**: São sequências de lógica que definem como um agente processa informações e toma decisões. Um exemplo no AgentVerse é o `chat-flow.ts`, que gerencia a interação de chat com os agentes. Os fluxos podem incluir etapas como chamadas a modelos, execução de ferramentas e manipulação de dados.
- **Ferramentas (Tools)**: São funções que os agentes podem utilizar para interagir com o mundo exterior ou realizar tarefas específicas que vão além da capacidade direta do modelo de linguagem. Um exemplo é a `web-search-tool.ts`, que permite ao agente realizar buscas na web.
- **Indexadores e Embedders (RAG)**: Embora não explicitamente detalhado como um "indexer" Genkit nos arquivos, o conceito de RAG é suportado, o que implicaria o uso de embedders para criar representações vetoriais de conhecimento e indexadores para recuperá-las.
- **Serialização e Estado**: Genkit também oferece mecanismos para gerenciar o estado e a serialização de dados, importantes para a continuidade das interações dos agentes.

### 3.4. Tipos de Agentes no AgentVerse

O AgentVerse permite a criação de diferentes tipos de agentes, cada um adequado para cenários específicos:

- **Agente LLM**: Utiliza Modelos de Linguagem Grande (LLMs) para raciocinar, planejar, gerar respostas e utilizar ferramentas. A descrição do agente é usada por outros agentes LLM para decidir se devem delegar tarefas a ele.
- **Agente de Fluxo de Trabalho (Workflow)**: Controla a execução de sub-agentes com base em lógica predefinida (sequencial, paralela, loop), sem consultar um LLM para a orquestração em si.
- **Agente Customizado**: Permite implementar lógica operacional única e fluxos de controle específicos, geralmente orquestrando outros agentes e gerenciando estado. Requer desenvolvimento de um fluxo Genkit customizado.
- **Agente A2A (Agent-to-Agent)**: Um tipo especializado de Agente Customizado focado na comunicação e coordenação com outros agentes.

### 3.5. Ferramentas (Tools) e sua Configuração

As **Ferramentas** são extensões que dão aos agentes capacidades adicionais, como buscar na web, fazer cálculos ou interagir com outras APIs. No AgentVerse, você pode:

- Selecionar ferramentas a partir de uma lista de opções disponíveis.
- Configurar ferramentas que exigem parâmetros específicos ou chaves de API.
- As ferramentas são definidas no Genkit e podem ser chamadas pelos agentes durante a execução de um fluxo.

### 3.6. Comunicação Agent-to-Agent (A2A)

A comunicação **Agent-to-Agent (A2A)** refere-se à capacidade de diferentes agentes interagirem entre si para colaborar na resolução de tarefas mais complexas. O AgentVerse fornece uma interface para configurar como um agente se comunica com outros, definindo canais, formatos de mensagem e políticas de comunicação, seguindo conceitos que seriam compatíveis com o protocolo A2A do Google ADK.

### 3.7. Gerenciamento de Estado e Memória

- **Estado**: Refere-se às informações que um agente mantém durante uma interação ou entre sessões. Isso permite que o agente "lembre" de informações passadas e mantenha o contexto.
- **Memória**: Pode ser de curto prazo (contexto da conversa atual) ou de longo prazo (conhecimento persistente).
- **Persistência**: O AgentVerse permite configurar se e como o estado do agente será salvo (em memória da sessão, armazenamento local, ou banco de dados).
- **Compartilhamento de Estado**: Em sistemas multi-agente, é possível configurar como o estado é compartilhado entre o agente raiz e seus sub-agentes.

### 3.8. RAG (Retrieval-Augmented Generation) e Conhecimento

RAG é uma técnica que permite aos modelos de linguagem acessarem e utilizarem conhecimento de fontes externas para gerar respostas mais informadas e precisas.

No AgentVerse, isso envolve:

- Definir **fontes de conhecimento** (documentos, websites, APIs).
- Configurar como o agente recupera informações dessas fontes para complementar seu conhecimento interno ao gerar respostas.
- O sistema pode utilizar modelos de _embedding_ para vetorizar o conhecimento e realizar buscas por similaridade.

### 3.9. Artefatos

Artefatos são objetos de dados que podem ser criados, consumidos ou modificados por agentes durante sua execução. Podem ser documentos, imagens, dados JSON, ou qualquer outro tipo de arquivo ou estrutura de dados.

O AgentVerse permite:

- Definir os tipos de artefatos que um agente pode manipular.
- Configurar como os artefatos são armazenados (memória, sistema de arquivos, nuvem).

## 4. Guia do Usuário

Este guia o ajudará a entender como usar as diversas funcionalidades do AgentVerse para criar, configurar e interagir com seus agentes de IA.

### 4.1. Navegando pela Interface do AgentVerse

A interface do AgentVerse é projetada para ser intuitiva e fácil de usar. Ao acessar a plataforma, você será apresentado aos seguintes elementos principais:

- **Barra Lateral de Navegação (Sidebar)**: Localizada no lado esquerdo da tela, a barra lateral é o principal meio de navegação entre as diferentes seções do AgentVerse.
    
    - **Logo "Aida"**: No topo, um link para a página principal (atualmente redireciona para o Construtor de Agentes).
    - **Itens de Menu Principais**:
        - **Agentes (`/agent-builder`)**: Leva você à página do Construtor de Agentes, onde você pode criar, visualizar e gerenciar seus agentes.
        - **Chat (`/chat`)**: Abre a interface de chat para interagir com os agentes configurados.
    - **Opções da Conta (Menu Dropdown)**: Localizado na parte inferior da barra lateral, este menu oferece acesso a:
        - **Perfil (`/profile`)**: Para gerenciar suas informações pessoais e instruções para os agentes.
        - **Chaves API (`/api-key-vault`)**: Para gerenciar suas chaves de API de serviços externos.
        - **Configurações**: (Atualmente exibe um toast "Em breve!")
    - **Alternador de Tema**: Um botão para alternar entre o tema claro e escuro da interface. (Nota: No `AppLayout`, o `ThemeToggle` está no `ChatHeader`, mas a funcionalidade de tema é global via `ThemeProvider`)
    - **Botão de Recolher/Expandir Sidebar**: Permite minimizar ou expandir a barra lateral para otimizar o espaço da tela.
- **Área de Conteúdo Principal**: À direita da barra lateral, esta é a área onde o conteúdo da seção selecionada (Construtor de Agentes, Chat, etc.) é exibido.
    
- **Componentes da UI (Shadcn/UI)**: A plataforma utiliza um conjunto consistente de componentes visuais (botões, cards, modais, etc.) fornecidos pela biblioteca Shadcn/UI, garantindo uma experiência de usuário coesa.
    

### 4.2. Construtor de Agentes (`/agent-builder`)

A página "Agentes" é o coração do AgentVerse, onde você pode criar, visualizar, editar e excluir seus agentes de IA.

- **Visualização Geral**:
    
    - Ao acessar `/agent-builder`, você verá um cabeçalho com o título "Agentes" e um botão "+ Novo Agente".
    - Se nenhum agente foi criado, uma mensagem instrutiva será exibida, incentivando a criação do primeiro agente.
    - Os agentes existentes são exibidos em formato de _cards_, cada um mostrando informações resumidas como nome, descrição, tipo e ferramentas.
- **Criando um Novo Agente**:
    
    1. Clique no botão **"+ Novo Agente"**.
    2. Um modal (janela de diálogo) chamado "**Novo Agente**" (ou "Editar Agente" se estiver editando) será aberto.
    3. **Configuração Principal**:
        - **Tipo de Agente**: Selecione o tipo de agente que deseja criar (LLM, Workflow, Customizado, A2A). Cada tipo tem um conjunto específico de campos de configuração.
        - **Framework do Agente**: Opcionalmente, selecione o framework base (Customizado/Padrão, Google Genkit, Langchain, Crew AI). Isso pode habilitar configurações específicas no futuro.
        - **Nome do Agente**: Um nome descritivo para seu agente (campo obrigatório).
        - **Descrição Geral**: Descreva a função principal e o objetivo geral do agente. Esta descrição pode ser usada por outros agentes para decidir se devem delegar tarefas a ele.
        - **Versão do Agente**: Controle de versionamento (ex: 1.0.0).
    4. **Configurações Específicas do Tipo de Agente**:
        - **Para Agentes LLM**:
            - **Objetivo**: O propósito principal do agente.
            - **Tarefas**: Uma lista das principais tarefas que o agente deve ser capaz de realizar.
            - **Personalidade/Tom**: Como o agente deve se comunicar (ex: Amigável, Profissional).
            - **Restrições**: Diretrizes importantes que o agente deve seguir rigorosamente.
            - **Modelo de IA**: Selecione o modelo de linguagem (ex: Gemini 1.5 Pro, Gemini 1.5 Flash).
            - **Temperatura**: Controla a criatividade/aleatoriedade das respostas do modelo (0 a 1).
        - **Para Agentes de Workflow**:
            - **Tipo de Fluxo Detalhado**: Sequencial, Paralelo ou Loop.
            - **Descrição do Fluxo**: Detalhe como as ferramentas e sub-agentes serão executados.
            - **(Se Loop)**: Máximo de iterações, condição de término (baseada em ferramenta ou estado), nome da ferramenta de saída ou chave/valor de estado.
        - **Para Agentes Customizados/A2A**:
            - **Descrição da Lógica Personalizada/Interação A2A**: Detalhes sobre a funcionalidade específica ou como o agente interage com outros.
    5. **Abas de Configuração Avançada**: O diálogo de criação/edição de agente possui abas para configurações mais detalhadas:
        - **Ferramentas**: Selecione e configure as ferramentas que o agente poderá utilizar.
            - Listagem de ferramentas padrão e MCP (Model Context Protocol).
            - Filtros para buscar ferramentas (configuráveis, requer autenticação).
            - Gerenciamento de Servidores MCP.
            - Ao selecionar uma ferramenta que `needsConfiguration` (ou `hasConfig`), um botão "Configurar" permitirá abrir um modal para inserir os parâmetros específicos (ex: Chave API do Google para Busca na Web, URL do Schema OpenAPI).
        - **Memória e Conhecimento**:
            - **Estado e Persistência**: Habilitar/desabilitar persistência de estado, tipo de persistência (sessão, memória, banco de dados), valores iniciais de estado (chave, valor, escopo, descrição).
            - **RAG e Conhecimento**: Habilitar RAG, configurar o serviço de memória (InMemory, Vertex AI RAG), parâmetros de recuperação (Top K, Limiar de Distância), e adicionar/gerenciar fontes de conhecimento (documentos, websites, etc.).
            - **Compartilhamento**: (Movido para esta aba ou uma dedicada) Habilitar/desabilitar compartilhamento de estado entre agentes, estratégia de compartilhamento.
        - **Artefatos**:
            - Habilitar/desabilitar gerenciamento de artefatos.
            - Tipo de armazenamento (memória, sistema de arquivos, nuvem) e configurações associadas (caminho local, bucket na nuvem).
            - Definir os tipos de artefatos que o agente pode manipular (nome, descrição, tipo, MIME type, permissões de acesso, persistência, versionamento).
        - **Comunicação A2A**:
            - Habilitar comunicação A2A.
            - Configurar canais de comunicação (nome, direção, formato da mensagem, modo de sincronização, agente alvo, schema JSON).
            - Definir políticas de comunicação (formato de resposta padrão, tamanho máximo da mensagem, logs).
        - **Multi-Agente (Google ADK)**:
            - Definir se o agente é um "Agente Raiz".
            - Se for raiz, selecionar sub-agentes a partir dos agentes já salvos.
            - Definir uma instrução global que se aplica a todos os agentes no sistema.
    6. **Salvar**: Após preencher as configurações, clique em "Salvar e Criar Agente" (ou "Salvar Alterações").
- **Editando um Agente**:
    
    1. No card do agente desejado, clique no botão "Editar".
    2. O mesmo modal de criação será aberto, pré-preenchido com as configurações do agente.
    3. Modifique as configurações conforme necessário e clique em "Salvar Alterações".
- **Testando um Agente**:
    
    1. No card do agente, clique no botão "Testar".
    2. (Atualmente, esta funcionalidade exibe um toast "Em breve!". A ideia seria redirecionar para a interface de Chat com o agente selecionado.)
- **Excluindo um Agente**:
    
    1. No card do agente, clique no botão "Excluir".
    2. Uma confirmação será solicitada antes da exclusão.

### 4.3. Interface de Chat (`/chat`)

A página de "Chat" é onde você pode interagir diretamente com os agentes que configurou, testar suas respostas e capacidades, e gerenciar suas conversas.

- **Layout da Interface de Chat**:
    
    - **Cabeçalho do Chat (ChatHeader)**: No topo, exibe o nome do agente ou "Gem" ativo, e permite:
        - Alternar a visibilidade da Barra Lateral de Conversas (ícone de Menu).
        - Selecionar o alvo da conversa:
            - **Agentes ADK**: Se `usingADKAgent` estiver ativo, permite selecionar um agente configurado via Google ADK.
            - **Gems (Personalidades Base)**: Permite escolher uma personalidade pré-definida para o assistente geral.
            - **Meus Agentes (Salvos)**: Permite selecionar um dos seus agentes criados no Construtor de Agentes (esta funcionalidade é referenciada no `ChatHeader` através de `savedAgents` mas a UI de seleção pode variar).
        - Iniciar uma "Nova Conversa" (botão com ícone de Mais).
        - Alternar o tema da interface (claro/escuro).
    - **Barra Lateral de Conversas (ConversationSidebar)**:
        - Lista as conversas anteriores.
        - Permite selecionar uma conversa para continuar.
        - Oferece opções para renomear ou excluir conversas.
        - Botão para iniciar uma "Nova Conversa".
        - Pode ser ocultada/exibida através do ícone de Menu no cabeçalho.
    - **Área de Mensagens (MessageList)**: Onde o diálogo entre você e o agente é exibido.
        - Mensagens do usuário e do agente são diferenciadas visualmente.
        - Suporte para streaming de respostas do agente, com indicador de "Digitando...".
    - **Área de Entrada de Mensagem (MessageInputArea)**: Na parte inferior, para você digitar suas mensagens e interagir com o agente.
- **Iniciando uma Conversa**:
    
    - Ao entrar na página de Chat, se não houver mensagens, uma tela de boas-vindas (`WelcomeScreen`) pode ser exibida com sugestões de prompts.
    - Você pode clicar em uma sugestão ou começar a digitar sua própria pergunta na área de entrada.
    - Para iniciar uma conversa do zero ou limpar o histórico atual, clique no botão "Nova Conversa" no cabeçalho ou na barra lateral.
- **Selecionando um Agente ou Gem**:
    
    - Utilize os seletores no `ChatHeader` para escolher com qual "Gem" (personalidade base), agente ADK ou agente salvo você deseja interagir.
    - A seleção de um novo agente/gem geralmente inicia uma nova sessão de conversa ou limpa o contexto atual.
- **Enviando Mensagens**:
    
    1. Digite sua mensagem na caixa de texto da `MessageInputArea`.
    2. Você pode pressionar "Enter" (sem Shift) ou clicar no botão "Enviar" (ícone de avião de papel) para enviar a mensagem.
    3. Sua mensagem aparecerá na área de mensagens, e o agente começará a processar e gerar uma resposta.
- **Enviando Arquivos (Imagens e Outros)**:
    
    1. Clique no botão com ícone de clipe de papel (`Paperclip`) na `MessageInputArea` para abrir o seletor de arquivos ou para abrir um popover com mais opções de anexo.
    2. Selecione o arquivo desejado. O sistema suporta imagens e outros tipos de arquivo como PDF e texto.
    3. Uma pré-visualização ou nome do arquivo aparecerá acima da caixa de entrada. Você pode remover o anexo clicando no "X".
    4. Digite uma mensagem opcional para acompanhar o arquivo e envie.
    5. O arquivo será processado junto com sua mensagem pelo agente. A forma como o agente lida com o arquivo dependerá de suas capacidades e ferramentas configuradas.
- **Visualizando Respostas**:
    
    - As respostas do agente aparecerão na área de mensagens.
    - Se a resposta for longa, ela pode ser transmitida em partes (_streaming_), com um indicador visual (cursor piscando ou animação de "digitando").
    - Blocos de código nas respostas serão formatados com destaque de sintaxe e um botão para copiar.
    - Imagens enviadas pelo agente ou referenciadas também podem ser exibidas.
    - Arquivos enviados pelo agente podem ter um botão de download.
- **Gerenciando Conversas**:
    
    - A `ConversationSidebar` lista suas conversas. Cada conversa tem um título (que pode ser editado) e um timestamp.
    - **Selecionar**: Clique em uma conversa na barra lateral para carregá-la na área de chat.
    - **Renomear**: Passe o mouse sobre uma conversa para ver o ícone de edição (lápis) e renomeá-la.
    - **Excluir**: Passe o mouse sobre uma conversa para ver o ícone de exclusão (lixeira) e removê-la. Uma confirmação pode ser solicitada.
    - **Nova Conversa**: Use o botão "New Chat" na barra lateral ou no cabeçalho para iniciar uma nova conversa limpa.
    - As conversas e suas mensagens são armazenadas localmente no navegador (usando `localStorage`).

### 4.4. Cofre de Chaves API (`/api-key-vault`)

A seção "Cofre de Chaves API" é uma ferramenta essencial para gerenciar de forma segura as chaves de API que seus agentes utilizam para acessar serviços externos, como modelos de linguagem (OpenAI, Google Gemini), bancos de dados, ou outras APIs de terceiros.

- **Acessando o Cofre**:
    
    - Você pode navegar para o Cofre de Chaves API através do menu da conta na barra lateral de navegação.
- **Funcionalidades Principais**:
    
    - **Visualizar Chaves Armazenadas**: A página exibe uma tabela com as chaves API que você já adicionou. Por padrão, para segurança, apenas um fragmento da chave é visível. As colunas typically incluem:
        - Nome do Serviço (ex: OpenAI, Google Gemini)
        - Fragmento da Chave API (ex: sk-…H7d)
        - Data de Adição
    - **Adicionar Nova Chave API**:
        1. Clique no botão "**+ Adicionar Nova Chave API**".
        2. Um modal (janela de diálogo) aparecerá para você inserir os detalhes da nova chave.
        3. **Provedor**: Selecione o serviço para o qual a chave se destina (ex: OpenAI, Google Gemini, OpenRouter) ou "Outro (Personalizado)" se não estiver listado.
        4. **Nome do Serviço (se "Outro")**: Se você selecionou "Outro", um campo aparecerá para você nomear o serviço personalizado.
        5. **Chave API**: Cole a chave API completa no campo designado (geralmente é um campo de senha para mascarar a entrada).
        6. Clique em "Salvar Chave" para adicionar a chave ao cofre.
    - **Gerenciar Chaves Existentes**: Para cada chave listada na tabela, você tem as seguintes ações:
        - **Editar**: (Atualmente exibe um toast "Em breve!") Permite modificar os detalhes de uma chave existente.
        - **Alternar Visibilidade**: Um ícone de olho (Eye / EyeOff) permite que você revele ou oculte temporariamente a chave API completa. Use com cautela.
        - **Excluir**: Um ícone de lixeira (Trash2) permite remover uma chave do cofre. Uma caixa de diálogo de confirmação será exibida, solicitando que você digite "deletar" para confirmar a exclusão, como medida de segurança.
    - **Segurança**: A página enfatiza que o gerenciamento de chaves API é uma função crítica de segurança e que, embora haja uma simulação visual de segurança (como mascarar a chave), em sistemas de produção, controles de acesso adequados e logs de auditoria são cruciais.
- **Importância**:
    
    - Manter suas chaves API centralizadas e (visualmente) seguras é vital para o funcionamento dos seus agentes que dependem de serviços externos.
    - O Cofre de Chaves API no AgentVerse visa simplificar esse gerenciamento, embora a segurança real das chaves em um ambiente de produção dependa de práticas de segurança mais amplas implementadas no backend e na infraestrutura.

### 4.5. Perfil do Usuário (`/profile`)

A página "Meu Perfil" permite que você gerencie suas informações pessoais e defina instruções e uma memória global que podem ser utilizadas pelos seus agentes de IA para personalizar a interação e fornecer assistência mais eficaz.

- **Acessando o Perfil**:
    
    - Você pode navegar para a página "Meu Perfil" através do menu da conta, localizado na barra lateral de navegação.
- **Funcionalidades da Página de Perfil**:
    
    - **Informações Pessoais**:
        - **Nome Completo**: Campo para inserir ou atualizar seu nome completo.
        - **Data de Nascimento**: Campo para inserir ou atualizar sua data de nascimento.
        - **E-mail**: Campo para inserir ou atualizar seu endereço de e-mail.
    - **Instruções para Agentes**:
        - Uma área de texto onde você pode fornecer informações sobre suas preferências, interesses, estilo de comunicação desejado, ou qualquer outro detalhe que possa ajudar os agentes a entenderem melhor suas necessidades e a interagirem de forma mais alinhada com suas expectativas.
        - Similar às "instruções personalizadas" encontradas em outras plataformas de IA, este campo permite que você guie o comportamento dos agentes de forma global. (Ex: "Prefiro respostas concisas", "Tenho interesse em tecnologia e ciência", "Quando falar sobre programação, use exemplos em Python").
    - **Minha Memória Global**:
        - Uma área de texto para armazenar informações importantes que você gostaria que seus agentes pudessem acessar (se permitido).
        - Pode incluir fatos sobre você, contatos importantes, lembretes, ou qualquer dado que possa ser útil para os agentes em diversas interações. (Ex: "Meu time de futebol favorito é o Electron FC", "Próximo projeto é sobre energias renováveis").
        - **Permitir Acesso à Memória**: Um interruptor (switch) permite controlar se os agentes têm ou não permissão para acessar o conteúdo desta memória global.
    - **Salvar Alterações**:
        - Um botão "Salvar Alterações" permite persistir todas as modificações feitas na página. (Atualmente, a funcionalidade de salvar é simulada com um toast).
- **Como os Agentes Utilizam essas Informações**:
    
    - As "Instruções para Agentes" podem ser incorporadas aos prompts de sistema dos seus agentes, orientando seu comportamento e tom de resposta.
    - A "Minha Memória Global", se o acesso for permitido, pode ser consultada por agentes que possuam ferramentas de RAG (Retrieval-Augmented Generation) ou acesso a bases de conhecimento, permitindo que eles utilizem essas informações para enriquecer suas respostas e ações.

## 5. Guia do Desenvolvedor

Este guia fornece uma visão técnica da estrutura do projeto AgentVerse, das tecnologias utilizadas e de como diferentes partes do sistema interagem.

### 5.1. Estrutura do Projeto

O AgentVerse é um projeto Next.js organizado da seguinte forma (principais pastas e arquivos):

```
agentverse/
├── src/
│   ├── app/                    # Rotas e páginas principais da aplicação (App Router)
│   │   ├── (agent-builder)/    # Funcionalidades do construtor de agentes
│   │   │   └── page.tsx
│   │   ├── (api-key-vault)/
│   │   │   └── page.tsx
│   │   ├── (chat)/
│   │   │   ├── page.tsx
│   │   │   └── chat-ui.tsx
│   │   │   └── actions.ts      # Server Actions para o chat
│   │   ├── (profile)/
│   │   │   └── page.tsx
│   │   ├── api/                  # Rotas de API do Next.js
│   │   │   └── chat-stream/
│   │   │       └── route.ts    # API para streaming de respostas do chat
│   │   ├── globals.css         # Estilos globais
│   │   └── layout.tsx          # Layout principal da aplicação
│   ├── ai/                     # Lógica de Inteligência Artificial com Genkit
│   │   ├── flows/              # Fluxos Genkit (ex: chat-flow.ts)
│   │   ├── tools/              # Ferramentas Genkit (ex: web-search-tool.ts)
│   │   ├── dev.ts              # Ponto de entrada para o Genkit CLI em desenvolvimento
│   │   └── genkit.ts           # Configuração e inicialização do Genkit
│   ├── components/             # Componentes React reutilizáveis
│   │   ├── features/           # Componentes específicos de funcionalidades (chat, agent-builder)
│   │   ├── icons/              # Componentes de ícones (ex: logo.tsx)
│   │   ├── layout/             # Componentes de layout (ex: app-layout.tsx)
│   │   ├── ui/                 # Componentes da UI (Shadcn/UI - ex: button.tsx, card.tsx)
│   │   └── user/               # Componentes relacionados ao usuário (ex: user-profile-card.tsx)
│   ├── contexts/               # Context API do React
│   │   ├── AgentsContext.tsx   # Contexto para gerenciar agentes salvos
│   │   └── ThemeContext.tsx    # Contexto para gerenciamento de tema (claro/escuro)
│   ├── data/                   # Dados estáticos ou mocks (ex: available-tools.ts para o agent-builder)
│   ├── hooks/                  # Hooks React customizados (ex: use-toast.ts, use-mobile.tsx)
│   ├── lib/                    # Funções utilitárias e bibliotecas de lógica
│   │   ├── adk.ts              # Simulação/Integração com ADK (placeholder)
│   │   ├── google-adk.ts       # Lógica de integração com Google ADK (simulado)
│   │   ├── google-adk-utils.ts # Utilitários para conversão para o formato ADK
│   │   ├── conversationStorage.ts # Lógica para armazenamento de conversas
│   │   └── utils.ts            # Utilitários gerais (ex: cn para classnames)
│   └── types/                  # Definições de tipos TypeScript
│       ├── agent-types.ts
│       ├── a2a-types.ts
│       ├── chat.ts
│       ├── mcp-tools.ts
│       ├── tool-types.ts
│       └── uuid.d.ts
├── public/                   # Arquivos estáticos
├── .env.example              # Exemplo de arquivo de variáveis de ambiente (deve ser criado como .env)
├── apphosting.yaml           # Configuração para Firebase App Hosting
├── components.json           # Configuração do Shadcn/UI
├── next.config.ts            # Configuração do Next.js
├── package.json              # Dependências e scripts do projeto
├── tailwind.config.ts        # Configuração do Tailwind CSS
└── tsconfig.json             # Configuração do TypeScript
```

### 5.2. Frontend

O frontend do AgentVerse é construído com Next.js e React, utilizando TypeScript para tipagem.

- **Componentes da UI (Shadcn/UI)**:
    
    - O projeto utiliza componentes da biblioteca [Shadcn/UI](https://ui.shadcn.com/), que são construídos sobre Radix UI e Tailwind CSS.
    - Esses componentes estão localizados em `src/components/ui/` (ex: `button.tsx`, `card.tsx`, `dialog.tsx`, `select.tsx`, etc.) e são usados extensivamente em toda a aplicação para construir as interfaces das páginas.
    - Componentes mais complexos e específicos de funcionalidades estão em `src/components/features/`.
- **Gerenciamento de Estado**:
    
    - **AgentsContext (`src/contexts/AgentsContext.tsx`)**: Usado para gerenciar o estado global dos agentes salvos, permitindo que diferentes partes da aplicação acessem e modifiquem a lista de agentes.
    - **ThemeContext (`src/contexts/ThemeContext.tsx`)**: Gerencia o tema da aplicação (claro/escuro) e persiste a preferência no `localStorage`.
    - O estado local dos componentes é gerenciado usando os hooks `useState` e `useEffect` do React.
    - Para operações de formulário no chat, `useActionState` é utilizado para interagir com Server Actions.
- **Estilização**:
    
    - **Tailwind CSS**: É o principal framework CSS utilizado, configurado em `tailwind.config.ts`. Ele permite estilização rápida e responsiva através de classes utilitárias.
    - **CSS Global (`src/app/globals.css`)**: Define estilos base, variáveis CSS para temas (claro e escuro) e algumas animações customizadas.
    - **CSS Variables**: O tema é implementado usando variáveis CSS, permitindo a fácil alternância entre os modos claro e escuro.
- **Layout da Aplicação (`src/components/layout/app-layout.tsx`)**:
    
    - Define a estrutura visual principal da aplicação, incluindo a barra lateral de navegação e a área de conteúdo principal.
    - Utiliza o `SidebarProvider` e componentes de sidebar de `src/components/ui/sidebar.tsx` para a navegação.

### 5.3. Backend e Inteligência Artificial (Genkit)

A lógica de backend e a inteligência artificial são primariamente gerenciadas pelo Genkit.

- **Configuração do Genkit (`src/ai/genkit.ts`)**:
    
    - Inicializa o Genkit com plugins para diferentes provedores de modelos de IA:
        - `@genkit-ai/googleai` (para modelos Gemini do Google)
        - `genkitx-openai` (para modelos da OpenAI)
        - `genkitx-ollama` (para modelos locais via Ollama)
    - Define um modelo padrão para a aplicação (ex: `googleai/gemini-2.0-flash`).
    - As chaves de API para esses serviços são carregadas a partir de variáveis de ambiente (gerenciadas via `.env` e `dotenv` em `src/ai/dev.ts`).
- **Fluxos Genkit (Flows - `src/ai/flows/`)**:
    
    - Os fluxos definem a lógica de execução para tarefas de IA.
    - **`chat-flow.ts`**: Implementa a lógica principal para as interações de chat.
        - Recebe a mensagem do usuário, histórico, e opcionalmente dados de arquivo e configurações do agente (modelo, prompt de sistema, temperatura, ferramentas).
        - Configura o modelo e as ferramentas ativas com base na entrada.
        - Chama a função `ai.generate()` do Genkit para obter a resposta do modelo, suportando streaming.
        - Retorna a resposta do agente, que pode ser um texto ou um stream de dados.
    - (Anteriormente havia um `ai-configuration-assistant.ts`, mas foi removido/depreciado).
- **Ferramentas Genkit (Tools - `src/ai/tools/`)**:
    
    - As ferramentas estendem as capacidades dos agentes.
    - **`web-search-tool.ts`**: Define uma ferramenta chamada `performWebSearch` que simula uma busca na web. Ela recebe uma consulta e retorna resultados mockados. Em uma implementação real, chamaria uma API de busca.
    - Outras ferramentas podem ser adicionadas seguindo este padrão.
- **Integração com Google ADK (Conceitual e Utilitários)**:
    
    - `src/lib/google-adk.ts`: Contém uma classe `GoogleADK` que simula uma interface com o Google Agent Development Kit, incluindo métodos para criar agentes, enviar mensagens e executar chamadas de ferramentas. Atualmente, muitas dessas funções são mockadas e usam `localStorage` para persistência.
    - `src/lib/google-adk-utils.ts`: Fornece funções para converter a configuração interna de agentes do AgentVerse para o formato esperado pelo (simulado) Google ADK.
- **Server Actions do Next.js (`src/app/chat/actions.ts`)**:
    
    - `submitChatMessage`: Uma Server Action usada pela interface de chat (`ChatUI`) para enviar a mensagem do usuário e os dados do agente para o backend.
    - Ela valida a entrada usando Zod, prepara os dados para o `basicChatFlow` e chama este fluxo.
    - Retorna o estado do formulário, incluindo a resposta do agente ou erros.
    - _Nota: Com a introdução da API de streaming, o uso principal desta Server Action pode ter mudado ou pode ser um fallback para interações não-streaming._
- **Rotas de API (`src/app/api/`)**:
    
    - **`/api/chat-stream/route.ts`**: Uma rota de API POST que recebe a entrada do chat e chama o `basicChatFlow`.
    - É projetada para suportar streaming de respostas do agente de volta para o cliente.
    - Inclui um rate limiter básico usando `@upstash/ratelimit` e Vercel KV.

### 5.4. Deployment

- **Firebase App Hosting**: O projeto está configurado para deploy no Firebase App Hosting, como indicado pelo arquivo `apphosting.yaml`.
    - Este arquivo contém configurações básicas como `maxInstances` para o backend.
    - O deploy geralmente envolve conectar o repositório GitHub ao Firebase e configurar builds automáticos.

## 6. Tutoriais

Esta seção apresenta tutoriais práticos para guiá-lo na criação e configuração de diferentes tipos de agentes e funcionalidades no AgentVerse.

### 6.1. Criando seu Primeiro Agente LLM Simples

**Objetivo**: Aprender a criar um agente básico que utiliza um Modelo de Linguagem Grande (LLM) para responder a perguntas simples.

**Passos**:

1. **Navegue até o Construtor de Agentes**:
    
    - Na barra lateral de navegação, clique em "Agentes" para acessar a página `/agent-builder`.
2. **Inicie a Criação de um Novo Agente**:
    
    - Clique no botão "**+ Novo Agente**" no canto superior direito da página. Isso abrirá o diálogo "Novo Agente".
3. **Selecione o Tipo de Agente**:
    
    - Na seção "Configuração Principal" do diálogo, para o campo "Tipo de Agente", selecione "**Agente LLM (Ex: LlmAgent, para Decisão e Linguagem)**".
    - Você verá que a descrição abaixo do campo se atualiza para explicar o que é um Agente LLM.
4. **Preencha as Informações Básicas**:
    
    - **Nome do Agente**: Dê um nome claro ao seu agente, por exemplo, "Meu Primeiro Agente".
    - **Descrição Geral**: Escreva uma breve descrição, como "Um agente simples para responder a perguntas gerais."
    - **Versão do Agente**: Deixe como "1.0.0" por enquanto.
5. **Configure o Comportamento do Agente LLM**:
    
    - **Objetivo**: Defina o objetivo principal. Ex: "Responder a perguntas de conhecimento geral de forma amigável."
    - **Tarefas**: Liste as tarefas que ele deve realizar. Ex: "1. Entender a pergunta do usuário. 2. Fornecer uma resposta clara e concisa."
    - **Personalidade/Tom**: Escolha uma das opções, por exemplo, "Amigável e Prestativo".
    - **Restrições**: (Opcional para este primeiro agente) Defina quaisquer limitações. Ex: "Não responder sobre tópicos controversos."
    - **Modelo de IA**: Selecione um modelo da lista, por exemplo, "googleai/gemini-1.5-flash-latest".
    - **Temperatura**: Ajuste o slider para definir a criatividade (ex: 0.5 para respostas mais focadas).
6. **Ferramentas (Opcional para este tutorial)**:
    
    - Para este primeiro agente simples, não vamos adicionar nenhuma ferramenta. Vá para a aba "Ferramentas" e certifique-se de que nenhuma ferramenta está selecionada.
7. **Salve o Agente**:
    
    - Clique no botão "**Salvar e Criar Agente**" no final do diálogo.
    - Você deverá ver um toast de confirmação e seu novo agente listado na página do Construtor de Agentes.
8. **Teste seu Agente no Chat**:
    
    - Navegue para a seção "Chat" (`/chat`) usando a barra lateral.
    - No cabeçalho do chat (`ChatHeader`), certifique-se de que "Meus Agentes" (ou um seletor similar) esteja ativo e selecione "Meu Primeiro Agente" (ou o nome que você deu). O `activeChatTarget` no cabeçalho deve atualizar.
    - Digite uma pergunta na área de entrada de mensagem, por exemplo, "Qual é a capital da França?".
    - Observe a resposta do seu agente na área de mensagens.

Parabéns! Você criou e testou seu primeiro agente LLM simples no AgentVerse.

### 6.2. Configurando uma Ferramenta de Busca na Web

**Objetivo**: Adicionar e configurar a ferramenta "Busca na Web (Google)" a um agente para permitir que ele acesse informações atuais da internet.

**Pré-requisitos**:

- Um Agente LLM criado (você pode usar o agente do tutorial anterior).
- Uma Chave de API do Google Cloud com a API "Custom Search API" habilitada.
- Um ID de Mecanismo de Busca Personalizado (CSE ID) do Google.

**Passos**:

1. **Acesse o Agente para Edição**:
    
    - Vá para a página "Agentes" (`/agent-builder`).
    - Encontre o agente ao qual deseja adicionar a ferramenta e clique no botão "Editar". Isso abrirá o diálogo de configuração do agente.
2. **Navegue até a Aba "Ferramentas"**:
    
    - Dentro do diálogo de configuração do agente, clique na aba "**Ferramentas**".
3. **Selecione a Ferramenta de Busca na Web**:
    
    - Na lista de "Ferramentas Padrão", localize a ferramenta "**Busca na Web (Google)**".
    - Clique no card da ferramenta para selecioná-la. Um ícone de verificação (Check) deve aparecer, indicando que está selecionada.
4. **Configure a Ferramenta**:
    
    - Como a ferramenta "Busca na Web (Google)" `needsConfiguration` (ou `hasConfig`), um botão "**Configurar**" estará visível no card da ferramenta (ou uma indicação similar). Clique nele.
    - Um modal de configuração específico para a ferramenta "Busca na Web" será aberto.
    - Insira sua **Chave de API do Google Custom Search** no campo correspondente (ex: `modalGoogleApiKey`).
    - Insira seu **ID do Mecanismo de Busca (CSE ID)** no campo correspondente (ex: `modalGoogleCseId`).
    - Clique em "Salvar Configuração" no modal da ferramenta.
5. **Salve as Alterações do Agente**:
    
    - De volta ao diálogo principal de configuração do agente, clique em "**Salvar Alterações**".
6. **Teste a Ferramenta no Chat**:
    
    - Vá para a interface de "Chat" (`/chat`).
    - Selecione o agente que você acabou de configurar.
    - Faça uma pergunta que claramente necessite de informações da web, por exemplo, "Quais são as últimas notícias sobre inteligência artificial?" ou "Qual a previsão do tempo para amanhã em São Paulo?".
    - O agente deve indicar que usará a ferramenta de busca e, em seguida, fornecer uma resposta baseada nos resultados (simulados ou reais, dependendo da implementação do backend da ferramenta).

### 6.3. Criando um Agente de Workflow Simples

**Objetivo**: Entender como criar um agente de fluxo de trabalho que executa uma sequência de ações (representadas por ferramentas).

**Pré-requisitos**:

- Duas ou mais ferramentas simples que possam ser usadas em sequência. Para este exemplo, vamos assumir que temos ferramentas como "GeradorDeTexto" e "TradutorSimples" (que precisariam ser definidas no backend Genkit e listadas em `availableTools`). Se não existirem, o tutorial pode focar na configuração e na descrição do fluxo.

**Passos**:

1. **Crie um Novo Agente**:
    
    - Vá para "Agentes" (`/agent-builder`) e clique em "**+ Novo Agente**".
    - Selecione o tipo "**Agente de Fluxo de Trabalho**".
2. **Configurações Básicas e do Fluxo**:
    
    - **Nome do Agente**: Ex: "Processador de Texto Sequencial".
    - **Descrição Geral**: Ex: "Gera um texto e depois o traduz."
    - **Tipo de Fluxo Detalhado**: Selecione "**Sequencial (Executar em ordem)**".
    - **Descrição do Fluxo**: Descreva a lógica. Ex: "1. Usar a ferramenta GeradorDeTexto para criar um parágrafo sobre um tema. 2. Pegar o texto gerado e usar a ferramenta TradutorSimples para traduzi-lo para inglês."
3. **Selecione as Ferramentas na Ordem Correta**:
    
    - Vá para a aba "**Ferramentas**".
    - Selecione as ferramentas que farão parte do fluxo, na ordem em que devem ser executadas. Por exemplo, primeiro "GeradorDeTexto" e depois "TradutorSimples".
        - _Nota: A UI atual do `ToolsTab` permite selecionar ferramentas, mas não define explicitamente a ordem de execução para um workflow. Essa ordem seria implicitamente definida pela "Descrição do Fluxo" e implementada na lógica do fluxo Genkit correspondente a este agente de workflow no backend._
4. **Configure as Ferramentas (se necessário)**:
    
    - Se alguma das ferramentas selecionadas exigir configuração, configure-as como descrito no tutorial anterior.
5. **Salve o Agente de Workflow**:
    
    - Clique em "**Salvar e Criar Agente**".
6. **Testando o Agente de Workflow**:
    
    - Vá para a interface de "Chat".
    - Selecione seu "Processador de Texto Sequencial".
    - Envie um comando ou uma entrada que inicie o fluxo. Por exemplo, "Gere um texto sobre IA e traduza-o."
    - _Nota: A maneira exata de interagir e observar os passos de um agente de workflow no chat dependerá da implementação do `chat-flow.ts` para lidar com agentes do tipo workflow e como ele expõe o progresso e os resultados intermediários das ferramentas._

### 6.4. Configurando a Comunicação entre Dois Agentes (A2A)

**Objetivo**: Configurar um agente para que ele possa se comunicar com outro agente usando o sistema A2A.

**Pré-requisitos**:

- Pelo menos dois agentes já criados no AgentVerse. Vamos chamá-los de "Agente Remetente" e "Agente Destinatário".

**Passos**:

1. **Edite o Agente Remetente**:
    
    - Vá para "Agentes" (`/agent-builder`) e edite o "Agente Remetente".
2. **Navegue para a Aba "Comunicação A2A"**:
    
    - No diálogo de configuração, vá para a aba "**Comunicação A2A**".
3. **Habilite a Comunicação A2A**:
    
    - Marque a opção "**Habilitar comunicação A2A**" (ou similar, conforme a UI em `a2aConfig.enabled`).
4. **Adicione um Canal de Comunicação**:
    
    - Clique em "**Adicionar Canal**".
    - Preencha os detalhes do canal:
        - **Nome do Canal**: Um nome descritivo, ex: "enviar_dados_para_analise".
        - **Direção**: Selecione "**Saída (Envia)**" (pois este é o Agente Remetente).
        - **Agente Alvo**: Selecione o "Agente Destinatário" na lista de agentes salvos.
        - **Formato da Mensagem**: Escolha um formato, ex: "**JSON**".
        - **Schema JSON (Opcional)**: Se usar JSON, você pode definir um schema para validar a estrutura da mensagem. Ex: `{"type": "object", "properties": {"dados": {"type": "string"}}, "required": ["dados"]}`.
        - **Modo de Sincronização**: Escolha "**Assíncrono (Não espera)**" ou "**Síncrono (Espera resposta)**".
        - **Timeout (ms)**: Se síncrono, defina um timeout.
5. **Configure Políticas de Comunicação**:
    
    - Defina o "Formato de Resposta Padrão", "Tamanho Máximo de Mensagem" e se o "Log de Comunicação" deve ser habilitado, conforme as opções na UI.
6. **Salve as Configurações do Agente Remetente**.
    
7. **(Opcional) Configure o Agente Destinatário**:
    
    - Se a comunicação for bidirecional ou se o Agente Destinatário precisar responder, você precisará configurar um canal de entrada correspondente nele.
8. **Testando a Comunicação A2A**:
    
    - Testar a comunicação A2A diretamente pela interface de chat pode ser complexo e dependerá de como os agentes foram programados (no backend Genkit) para usar esses canais.
    - Um teste efetivo geralmente envolveria:
        1. Instruir o "Agente Remetente" (via chat ou outro gatilho) a realizar uma ação que dispare o envio de uma mensagem pelo canal configurado.
        2. Observar (através de logs do Genkit ou da interface, se disponível) se o "Agente Destinatário" recebe a mensagem e age conforme esperado.
    - Esta parte do tutorial pode focar na configuração e sugerir que a lógica de uso dos canais precisa ser implementada no fluxo Genkit dos respectivos agentes.

## 7. Contribuição e Planos Futuros

### 7.1. Status Atual do Projeto

O AgentVerse está sendo desenvolvido como uma plataforma comercial com o objetivo de fornecer uma solução robusta e acessível para a criação de agentes de IA. Nesta fase inicial, o código-fonte não é aberto para contribuições públicas diretas.

### 7.2. Planos Futuros para a Comunidade

Temos a intenção de disponibilizar o AgentVerse como um projeto de código aberto no GitHub no futuro. Acreditamos que a colaboração da comunidade pode enriquecer significativamente a plataforma, acelerar seu desenvolvimento e ampliar seu alcance.

Quando o projeto se tornar público, planejamos incluir:

- **Guia de Contribuição Detalhado**: Com informações sobre como configurar o ambiente de desenvolvimento para contribuição, nosso processo de code review, padrões de codificação, e como propor novas funcionalidades ou correções.
- **Gerenciamento de Issues**: Utilização do sistema de Issues do GitHub para rastrear bugs, solicitar features e discutir melhorias.
- **Comunicação com a Comunidade**: Canais para discussão, como fóruns ou um servidor Discord.

### 7.3. Como se Envolver ou Expressar Interesse

Se você tem interesse em colaborar com o AgentVerse no futuro, quando ele se tornar um projeto aberto, ou se tem feedback e sugestões que gostaria de compartilhar durante a fase atual, por favor, entre em contato através de [_insira aqui o método de contato preferido, ex: um endereço de e-mail específico para o projeto, um formulário no site, etc._].

## 8. FAQ e Solução de Problemas

Esta seção visa responder às perguntas mais comuns sobre o AgentVerse e ajudar a solucionar problemas que você possa encontrar ao usar a plataforma.

### 8.1. Perguntas Frequentes (FAQ)

- **P1: O que é o AgentVerse?**
    
    - R: O AgentVerse é uma plataforma que facilita a criação, configuração e gerenciamento de agentes de Inteligência Artificial, utilizando o Google ADK e o framework Genkit. Seu objetivo é tornar o desenvolvimento de agentes acessível para todos os níveis de usuários.
- **P2: Preciso saber programar para usar o AgentVerse?**
    
    - R: Para criar agentes básicos e utilizar a interface visual, não é necessário conhecimento profundo em programação. No entanto, para desenvolver agentes customizados, fluxos Genkit complexos ou novas ferramentas, será necessário conhecimento em TypeScript/JavaScript e no framework Genkit.
- **P3: Quais modelos de IA são suportados pelo AgentVerse?**
    
    - R: O AgentVerse, através do Genkit, está configurado para suportar modelos do Google AI (como Gemini), OpenAI e Ollama (para modelos locais). Você pode selecionar o modelo desejado ao configurar um agente LLM.
- **P4: Onde consigo as chaves de API necessárias para os modelos de IA e ferramentas?**
    
    - R: Você precisará obter as chaves diretamente dos provedores:
        - **Google AI (Gemini)**: No Google AI Studio ou Google Cloud Console.
        - **OpenAI**: Na plataforma da OpenAI.
        - **Google Custom Search (para Busca na Web)**: No Google Programmable Search Engine para o CSE ID e no Google Cloud Console para a API Key.
    - Essas chaves devem ser configuradas no seu arquivo `.env` local ou gerenciadas através do "Cofre de Chaves API" da plataforma, dependendo da configuração da ferramenta.
- **P5: Como configuro o Ollama para usar modelos de IA locais?**
    
    - R: Você precisa ter o Ollama instalado e em execução em sua máquina ou em um servidor acessível. No arquivo `.env` do AgentVerse, configure a variável `OLLAMA_API_HOST` com o endereço do seu servidor Ollama (ex: `http://localhost:11434`).
- **P6: Qual a diferença entre os tipos de agentes (LLM, Workflow, Customizado, A2A)?**
    
    - R: **Agente LLM** usa modelos de linguagem para decisão e interação. **Agente de Workflow** orquestra outros agentes ou ferramentas de forma determinística (sequencial, paralela, loop). **Agente Customizado** permite lógica própria via fluxos Genkit. **Agente A2A** é um tipo de agente customizado focado na comunicação com outros agentes.
- **P7: Como uma ferramenta de agente funciona? Eu preciso implementar o backend dela?**
    
    - R: As ferramentas são funcionalidades que os agentes podem usar (ex: buscar na web). No AgentVerse, elas são implementadas como "tools" do Genkit no backend (veja `src/ai/tools/`). Se você quiser adicionar uma nova ferramenta customizada, precisará implementá-la usando Genkit.
- **P8: O que é RAG e como meu agente pode usá-lo?**
    
    - R: RAG (Retrieval-Augmented Generation) permite que seu agente acesse e use conhecimento de fontes externas (documentos, websites) para gerar respostas mais precisas. Você pode configurar fontes de conhecimento na aba "Memória e Conhecimento" do Construtor de Agentes.
- **P9: Minhas conversas no chat são salvas? Onde?**
    
    - R: Sim, as conversas e suas mensagens são salvas localmente no seu navegador utilizando `localStorage`.

### 8.2. Solução de Problemas (Troubleshooting)

- **Problema: O servidor Genkit (`npm run genkit:dev`) não inicia ou apresenta erros.**
    
    - **Solução**:
        - Verifique se o arquivo `.env` está presente na raiz do projeto e se todas as chaves de API necessárias (GOOGLE_API_KEY, OPENAI_API_KEY, OLLAMA_API_HOST se usado) estão corretamente configuradas.
        - Se estiver usando Ollama, certifique-se de que o serviço Ollama está em execução e acessível no endereço especificado em `OLLAMA_API_HOST`.
        - Verifique o console do terminal para mensagens de erro específicas que possam indicar o problema (ex: conflito de porta, dependências ausentes).
- **Problema: A aplicação Next.js (`npm run dev`) não inicia ou a página não carrega.**
    
    - **Solução**:
        - Certifique-se de que todas as dependências foram instaladas corretamente com `npm install`.
        - Verifique se não há conflito de portas (o AgentVerse usa a porta 9002 por padrão para o Next.js).
        - Abra o console do desenvolvedor no navegador (geralmente F12) para verificar se há erros de JavaScript.
- **Problema: O agente não responde como esperado no chat ou apresenta erros.**
    
    - **Solução**:
        - **Verifique a configuração do agente**: No Construtor de Agentes, revise o prompt de sistema, o modelo selecionado, as ferramentas associadas e suas configurações.
        - **Logs do Genkit**: Verifique o terminal onde o servidor Genkit (`npm run genkit:dev`) está rodando. Ele geralmente exibe logs detalhados sobre a execução dos fluxos e ferramentas, incluindo possíveis erros.
        - **Configuração de Ferramentas**: Se o agente utiliza ferramentas que requerem chaves API (como a Busca na Web), certifique-se de que as chaves estão corretas e foram salvas no Cofre de Chaves API ou configuradas diretamente na ferramenta, conforme aplicável.
        - **Rota de Streaming**: Se estiver recebendo erros como "HTTP error" ou "Failed to get readable stream", verifique a rota `/api/chat-stream/route.ts` e o fluxo `basicChatFlow` (`src/ai/flows/chat-flow.ts`) para possíveis problemas na comunicação ou processamento da stream.
        - **Rate Limit**: Você pode ter atingido o limite de requisições para a API de chat. Verifique o console para mensagens de erro `429 Too Many Requests`.
- **Problema: Uma ferramenta específica não funciona (ex: Busca na Web).**
    
    - **Solução**:
        - **Chaves API**: Verifique se as chaves API para a ferramenta (ex: Google API Key e CSE ID para Busca na Web) estão corretas e foram inseridas no local apropriado (seja no `.env` para o backend Genkit, ou no modal de configuração da ferramenta no Agent Builder).
        - **Permissões da API**: Certifique-se de que a chave API tem as permissões necessárias para usar o serviço (ex: Custom Search API habilitada no Google Cloud Project).
        - **Logs do Genkit**: Analise os logs do servidor Genkit para mensagens de erro específicas da ferramenta.
- **Problema: Problemas visuais ou componentes da UI não carregam corretamente.**
    
    - **Solução**:
        - Tente limpar o cache do seu navegador.
        - Verifique o console do desenvolvedor do navegador por erros de JavaScript ou CSS.
        - Certifique-se de que as dependências do projeto estão atualizadas (`npm install`).

