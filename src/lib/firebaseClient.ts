// Firebase client initialization for browser-side Firestore
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { onLog } from "firebase/app";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCpUEc2RBN9yUP_AQui12sPv384gVs_b3g",
  authDomain: "projeto-agentes-36358.firebaseapp.com",
  projectId: "projeto-agentes-36358",
  storageBucket: "projeto-agentes-36358.appspot.com",
  messagingSenderId: "446891961194",
  appId: "1:446891961194:web:0af15503eb0af90a241313"
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
