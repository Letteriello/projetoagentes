// Firebase client initialization for browser-side Firestore
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { onLog } from "firebase/app";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase App (singleton pattern)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Configurar Firestore com persistência offline aprimorada
export const firestore = getFirestore(app);

// Habilitar persistência offline e definir cache ilimitado
// para melhor experiência do usuário com os agentes AI
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(firestore)
    .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistência offline do Firestore falhou: múltiplas abas abertas');
    } else if (err.code === 'unimplemented') {
      console.warn('Seu navegador não suporta persistência offline do Firestore');
    }
  });
}

// Função para inicializar conexão com emulador em ambiente de desenvolvimento
export function useFirestoreEmulator() {
  if (process.env.NODE_ENV === 'development') {
    try {
      connectFirestoreEmulator(firestore, 'localhost', 8080);
      console.log('Conectado ao emulador do Firestore');
    } catch (e) {
      console.warn('Falha ao conectar ao emulador do Firestore:', e);
    }
  }
}
