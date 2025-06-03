const fs = require('fs');
const path = require('path');

// Diretório raiz do projeto
const rootDir = path.join(__dirname, 'src');

// Função para processar um arquivo
function updateFileImports(filePath) {
  try {
    // Ler o conteúdo do arquivo
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar se o arquivo importa de agent-configs
    if (content.includes("@/types/agent-configs")) {
      console.log(`Atualizando importações em: ${filePath}`);
      
      // Substituir a importação antiga pela nova
      const updatedContent = content.replace(
        /from ['"]@\/types\/agent-configs['"]/g, 
        "from '@/types/agent-configs-fixed'"
      );
      
      // Escrever o conteúdo atualizado de volta no arquivo
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Arquivo atualizado com sucesso: ${filePath}`);
    }
  } catch (error) {
    console.error(`Erro ao processar o arquivo ${filePath}:`, error);
  }
}

// Função para percorrer diretórios recursivamente
function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Ignorar node_modules e pastas ocultas
      if (file !== 'node_modules' && !file.startsWith('.')) {
        processDirectory(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Processar apenas arquivos TypeScript
      updateFileImports(fullPath);
    }
  });
}

// Iniciar o processamento a partir do diretório raiz
console.log('Iniciando atualização de importações...');
processDirectory(rootDir);
console.log('Atualização de importações concluída!');
