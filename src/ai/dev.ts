
import { config } from 'dotenv';
config();

// O fluxo ai-configuration-assistant.ts foi removido, então a importação abaixo também é removida.
// import '@/ai/flows/ai-configuration-assistant.ts';

// Se houver outros fluxos de desenvolvimento para importar, eles podem ser adicionados aqui.
// Por exemplo: import '@/ai/flows/chat-flow.ts';
// No entanto, geralmente os fluxos são importados onde são usados (ex: Server Actions)
// ou o Genkit CLI pode descobri-los automaticamente se estiverem em um diretório padrão
// dependendo da configuração do Genkit.
// Para este arquivo dev.ts, geralmente se importa o que é necessário para o Genkit CLI "start".
// Se nenhum fluxo específico precisa ser explicitamente iniciado/registrado aqui,
// este arquivo pode até ficar vazio ou ser usado para outras configurações de dev do Genkit.
