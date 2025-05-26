# Correções para Erros TypeScript Restantes

## 1. Erro na linha 1221 - Badge Component

Localizar:
```tsx
{getToolDisplayName(tool)}
```

Substituir por:
```tsx
{safeToReactNode(getToolDisplayName(tool))}
```

## 2. Erro na linha 1145-1155 - Span com Settings Icon

Para garantir que o retorno do IIFE seja corretamente tipado como ReactNode, atualize o código adicionando uma assinatura de tipo explícita:

Localizar:
```tsx
{needsConfig && (() => {
  // Usando IIFE para garantir que o retorno é ReactNode
  return (
    <span className={cn(
        "ml-2 group-hover:text-primary transition-colors", 
        isToolConfigured ? "text-green-500" : "text-muted-foreground"
      )}>
      <Settings2 size={14} />
    </span>
  );
})()}
```

Substituir por:
```tsx
{needsConfig && (() => {
  // Usando IIFE com assinatura de tipo explícita
  const icon = (): React.ReactNode => {
    return (
      <span className={cn(
          "ml-2 group-hover:text-primary transition-colors", 
          isToolConfigured ? "text-green-500" : "text-muted-foreground"
        )}>
        <Settings2 size={14} />
      </span>
    );
  };
  return icon();
})()}
```

## 3. Erro na linha 1159-1184 - Button Component

Usar o mesmo padrão de correção com assinatura de tipo explícita:

Localizar:
```tsx
{needsConfig && isToolSelected && (() => {
  // Usando IIFE para garantir que o retorno é ReactNode
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={cn(
        "ml-auto shrink-0 h-8 px-3", 
        isToolConfigured ? "border-green-500/50 hover:border-green-500 text-green-600 hover:text-green-500 hover:bg-green-500/10" : ""
      )} 
      onClick={() => openToolConfigModal(tool)}
    >
      {isToolConfigured ? (
        <>
          <Settings2 className="text-green-500 mr-1.5" size={16} />
          Reconfigurar
        </>
      ) : (
        <>
          <Settings2 className="text-amber-500 mr-1.5" size={16} />
          Configurar
        </>
      )}
    </Button>
  );
})()}
```

Substituir por:
```tsx
{needsConfig && isToolSelected && (() => {
  // Usando IIFE com assinatura de tipo explícita
  const configButton = (): React.ReactNode => {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className={cn(
          "ml-auto shrink-0 h-8 px-3", 
          isToolConfigured ? "border-green-500/50 hover:border-green-500 text-green-600 hover:text-green-500 hover:bg-green-500/10" : ""
        )} 
        onClick={() => openToolConfigModal(tool)}
      >
        {isToolConfigured ? (
          <>
            <Settings2 className="text-green-500 mr-1.5" size={16} />
            Reconfigurar
          </>
        ) : (
          <>
            <Settings2 className="text-amber-500 mr-1.5" size={16} />
            Configurar
          </>
        )}
      </Button>
    );
  };
  return configButton();
})()}
```

Estas correções devem resolver todos os erros de TypeScript restantes no arquivo.
