## [Corrigido] - 2025-06-03
### Sidebar: ciclo infinito de atualização (React)
- Corrigido erro "Maximum update depth exceeded" causado por ciclo de atualizações nos handlers de hover do Sidebar.
- Adicionadas checagens para evitar setState redundante em `setOpen` e `setIsHoveringLocal`.
- Ajustada função `setOpen` para aceitar apenas booleanos, removendo suporte a funções updater.
- Desabilitados temporariamente tooltips no `SidebarMenuButton` para eliminar ciclo de refs do Radix UI.
- Melhorias garantem maior estabilidade e previnem loops de renderização.

---
