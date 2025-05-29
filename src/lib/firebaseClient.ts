// Firebase client initialization for browser-side Firestore
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  initializeFirestore, 
  getFirestore, 
  Firestore, 
  persistentLocalCache, 
  CACHE_SIZE_UNLIMITED, 
  connectFirestoreEmulator 
} from "firebase/firestore";
import { onLog } from "firebase/app";

// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore - Enable debug logging
  window.LOG_LEVEL = 'debug';
  
  // Log Firestore events
  onLog(({ level, message, args }) => {
    if (level === 'error') {
      console.error(`Firebase ${level.toUpperCase()}:`, message, ...args);
    } else if (level === 'warn') {
      console.warn(`Firebase ${level.toUpperCase()}:`, message, ...args);
    } else {
      console.log(`Firebase ${level.toUpperCase()}:`, message, ...args);
    }
  });
}

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase App (singleton pattern)
let app: FirebaseApp;
try {
  app = getApp();
} catch (e) {
  app = initializeApp(firebaseConfig);
}

// Initialize Firestore with enhanced error handling and resilience
let firestore: Firestore;
try {
  // Try to initialize Firestore with our preferred settings
  firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED }),
    // Use auto-detect long polling for better connection handling
    experimentalAutoDetectLongPolling: true,
    // @ts-ignore - experimental setting
    experimentalAutoDetectLongPollingOptions: {
      maxDelay: 30000, // 30 seconds max delay for long polling
    },
    // Disable fetch streams which can sometimes cause issues
    // @ts-ignore - experimental setting
    useFetchStreams: false,
    // Additional settings for better resilience
    // @ts-ignore - experimental setting
    ignoreUndefinedProperties: true, // Skip undefined values instead of throwing errors
  });
  console.log('Firestore initialized with custom settings');
} catch (error: any) {
  if (error.code === 'failed-precondition') {
    // If Firestore was already initialized with different settings, use the existing instance
    console.warn('Firestore already initialized with different settings. Using existing instance.');
    firestore = getFirestore(app);
  } else {
    console.error('Error initializing Firestore:', error);
    
    // Try to initialize with minimal settings as fallback
    try {
      console.warn('Attempting to initialize Firestore with minimal settings...');
      firestore = initializeFirestore(app, {});
      console.log('Firestore initialized with minimal settings');
    } catch (fallbackError) {
      console.error('Failed to initialize Firestore with minimal settings:', fallbackError);
      // If all else fails, use getFirestore() which will throw if no instance exists
      firestore = getFirestore(app);
    }
  }
}

// Add error handler for Firestore
if (firestore) {
  firestore.toJSON = () => ({}); // Prevent circular reference in logs
  
  // Add a global error handler for unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.code?.includes('firestore') || 
          event.reason?.message?.includes('Firestore')) {
        console.warn('Unhandled Firestore error:', event.reason);
        // Optionally, you could show a user-friendly message here
        // or trigger a retry mechanism
      }
    });
  }
}

export { firestore };

// Log Firestore initialization
console.log('Firestore initialized with offline persistence and optimized connection settings');

// Add error handler for Firestore
if (firestore) {
  firestore.toJSON = () => ({}); // Prevent circular reference in logs

  // Log connection state changes if available
  try {
    // @ts-ignore - Access internal API for connection state
    const firestoreInternal = firestore._delegate;
    if (firestoreInternal && typeof firestoreInternal.onConnectionStateChange === 'function') {
      const onConnectionStateChange = (state: string) => {
        console.log('Firestore connection state changed:', state);
      };
      firestoreInternal.onConnectionStateChange(onConnectionStateChange);

      // Handle page visibility changes
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            console.log('Page became visible, reconnecting Firestore...');
            // @ts-ignore - Force reconnection
            if (firestoreInternal._queue && typeof firestoreInternal._queue.retryAll === 'function') {
              firestoreInternal._queue.retryAll();
            }
          }
        });
      }
    }
  } catch (e) {
    console.warn('Could not set up Firestore connection state monitoring:', e);
  }
}

// A persistência agora é configurada durante a inicialização.
// O SDK do Firestore lida com erros de persistência internamente,
// geralmente fazendo fallback para o modo somente memória e registrando um aviso.

// Função para inicializar conexão com emulador em ambiente de desenvolvimento
export function useFirestoreEmulator() {
  if (process.env.NODE_ENV === 'development') {
    try {
      // connectFirestoreEmulator(firestore, 'localhost', 8080);
      // console.log('Conectado ao emulador do Firestore');
      console.log('Modo de desenvolvimento: Conexão com emulador DESABILITADA. Usando Firebase na nuvem.');
    } catch (e) {
      console.warn('Falha ao tentar configurar o emulador do Firestore:', e);
    }
  }
}

// Only connect to emulator if explicitly enabled in environment
if (process.env.NEXT_PUBLIC_USE_FIRESTORE_EMULATOR === 'true') {
  console.log('Connecting to Firestore emulator...');
  useFirestoreEmulator();
} else {
  console.log('Using production Firestore instance');
}
