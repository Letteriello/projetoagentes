## [Corrigido] - 2025-06-04
### Conflito de Merge: `src/app/agent-builder/page.tsx`
- Resolvido conflito de merge no arquivo `src/app/agent-builder/page.tsx`.
- Removidos os marcadores de conflito (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) e mantido o conteúdo mais recente do arquivo.

---

## [Corrigido] - 2025-06-03
### Logger Provider: corrigido erro `TypeError: setImmediate is not a function` no cliente
- Refatorado `src/components/logger-provider.tsx` para utilizar o `console` nativo do navegador para logs no lado do cliente.
- Removida a dependência da biblioteca `winston` para logging no cliente, resolvendo o erro `TypeError: setImmediate is not a function`.
- Mantida a interface de logging existente e o `LoggerContext` para compatibilidade.


### Sidebar: ciclo infinito de atualização (React)
- Corrigido erro "Maximum update depth exceeded" causado por ciclo de atualizações nos handlers de hover do Sidebar.
- Adicionadas checagens para evitar setState redundante em `setOpen` e `setIsHoveringLocal`.
- Ajustada função `setOpen` para aceitar apenas booleanos, removendo suporte a funções updater.
- Desabilitados temporariamente tooltips no `SidebarMenuButton` para eliminar ciclo de refs do Radix UI.
- Melhorias garantem maior estabilidade e previnem loops de renderização.

### Logger e Genkit: corrigidos erros de importação e configuração
- Reescrito completamente o arquivo `src/lib/logger.ts` para remover dependência de `instrumentation` do Genkit.
- Removidas referências a `instrumentation` em `src/ai/genkit.ts` na configuração de telemetria.
- Corrigido arquivo de teste `src/lib/__tests__/logger.test.ts` para remover mocks de `instrumentation`.
- Implementadas funções de log assíncronas simples e diretas, sem tracing externo.
- Mantida compatibilidade com Firestore para armazenamento de logs.
- Preservada a API pública do logger para manter compatibilidade com o código existente.
- Correções garantem funcionamento correto e previnem recarregamentos constantes do servidor.

---


## [0.1.0] - 2025-06-03

### Corrigido
- Corrigido erro de sintaxe no polyfill de `setImmediate` em `src/components/logger-provider.tsx`. Alterado `global.setImmediate` para `(window as any).setImmediate` e ajustada a sintaxe da asserção de tipo e retorno da função.
- Refinado polyfill de `setImmediate` em `src/components/logger-provider.tsx` para usar `globalThis` e adicionado polyfill para `clearImmediate` para resolver `TypeError` em tempo de execução com Winston.
- Revertido polyfill de `setImmediate` e `clearImmediate` em `src/components/logger-provider.tsx` para usar `window` explicitamente, na tentativa de resolver `TypeError` persistente com Winston.
- Reforçado polyfill de `setImmediate` e `clearImmediate` em `src/components/logger-provider.tsx` com verificações mais robustas e logs de diagnóstico para `TypeError` com Winston.
- Removido polyfill customizado de `setImmediate` e `clearImmediate` de `src/components/logger-provider.tsx`, pois os logs indicam que já são fornecidos pelo ambiente Next.js.## [Corrigido em 2025-06-05]

- Corrigido erro de importação do `useRouter` removendo o hook do arquivo `page.tsx` (não disponível na versão atual do Next.js).
- Ajustada exportação do componente `AgentBuilderDialog` para `export default` e compatibilidade com importação dinâmica via `React.lazy`.
- Corrigida tipagem e conversão de datas (`Date` para `string`) ao adaptar agentes para a UI.
- Removidas todas as referências a propriedades inexistentes (`agentVersion`, `agentDescription`, `toolsDetails`, `icon`) na criação de agentes.
- Corrigido JSX inválido, removendo comentários e código morto.
- Garantido que todos os handlers e props usados em componentes estejam definidos/importados.
- Ajustado uso e importação do `AgentCard` conforme tipagem real do componente.
- Código agora compila e executa sem erros de tipagem ou JSX na tela de Agent Builder.
