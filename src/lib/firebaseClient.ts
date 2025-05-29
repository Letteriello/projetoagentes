// Firebase client initialization for browser-side Firestore
import { initializeApp, getApps } from "firebase/app";
import { initializeFirestore, persistentLocalCache, CACHE_SIZE_UNLIMITED, connectFirestoreEmulator } from "firebase/firestore";
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
export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED })
});

// A persistência agora é configurada durante a inicialização.
// O SDK do Firestore lida com erros de persistência internamente,
// geralmente fazendo fallback para o modo somente memória e registrando um aviso.

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

// Chamar automaticamente a função para conectar ao emulador em ambiente de desenvolvimento
if (process.env.NODE_ENV === 'development') {
  useFirestoreEmulator();
}
