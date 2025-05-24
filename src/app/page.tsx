
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/agent-builder');
  // A função redirect() já lança um erro especial para o Next.js,
  // então tecnicamente nada após ela será executado.
  // Retornar null é uma boa prática para componentes que não renderizam nada.
  return null;
}

