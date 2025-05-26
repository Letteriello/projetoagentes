# Instruções para corrigir os erros TypeScript

## Erro 1: Linha 1215 no Badge component

Localize esta linha no arquivo:
```jsx
{getToolDisplayName(tool)}
```

Substitua por:
```jsx
{safeToReactNode(getToolDisplayName(tool))}
```

## Erro 2: Linha 1130 no componente principal

Localize esta linha no arquivo:
```jsx
{getToolDisplayName(tool)}
```

Substitua por:
```jsx
{safeToReactNode(getToolDisplayName(tool))}
```

Estas alterações utilizam a função `safeToReactNode` que já adicionamos ao arquivo para converter valores com tipo `unknown` para `React.ReactNode` de forma segura, resolvendo os erros de TypeScript.
