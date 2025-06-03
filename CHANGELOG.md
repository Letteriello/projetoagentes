## [Corrigido] - 2025-06-03
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
