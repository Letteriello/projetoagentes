// src/lib/firebase/firestore.ts
import { Firestore } from '@google-cloud/firestore';

let firestore: Firestore;

// Initialize Firestore client
try {
  // Check if running in the Firebase Emulator environment
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`Firestore Client: Connecting to emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
    firestore = new Firestore({
      host: process.env.FIRESTORE_EMULATOR_HOST.split(':')[0],
      port: parseInt(process.env.FIRESTORE_EMULATOR_HOST.split(':')[1], 10),
      // projectId is required for the emulator, but can be any string if not connecting to a real project.
      // Using a common placeholder like 'demo-project' or your actual project ID if you have one configured.
      projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'demo-project-for-emulator', 
      // For emulator, credentials are not strictly needed but can be set to avoid warnings.
      // Using dummy credentials or allowing the library to handle default emulator auth.
      credentials: { client_email: 'emulator@example.com', private_key: 'emulator_key' },
      // It's good practice to set ssl: false for emulator connections if not automatically handled.
      // However, the Node.js client library typically handles this correctly when host/port are specified.
    });
  } else if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_CLOUD_PROJECT) {
    // Production environment, connect to live Firestore
    console.log('Firestore Client: Connecting to live Firestore project:', process.env.GOOGLE_CLOUD_PROJECT);
    firestore = new Firestore({
      // projectId will be inferred from GOOGLE_CLOUD_PROJECT or GCLOUD_PROJECT environment variables
      // or through service account credentials if specified via GOOGLE_APPLICATION_CREDENTIALS.
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
    });
  } else if (process.env.NODE_ENV === 'development' && process.env.GOOGLE_CLOUD_PROJECT) {
    // Development environment, but not using emulator (e.g., connecting to a dev GCP project)
    console.log('Firestore Client: Connecting to live Firestore DEV project:', process.env.GOOGLE_CLOUD_PROJECT);
    // Ensure GOOGLE_APPLICATION_CREDENTIALS is set in your environment for this to work.
    firestore = new Firestore({
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
    });
    console.warn(
        'Firestore Client: Development mode without FIRESTORE_EMULATOR_HOST. ' +
        'Ensure GOOGLE_APPLICATION_CREDENTIALS are set if connecting to a remote GCP project.'
    );
  } else {
    // Fallback or error if no suitable configuration is found
    console.error(
      'Firestore Client: Firestore could not be initialized. ' +
      'Ensure FIRESTORE_EMULATOR_HOST (for emulator) or GOOGLE_CLOUD_PROJECT (for live) is set.'
    );
    // To prevent application from crashing, we can assign a mock or throw an error.
    // For now, let's throw an error to make it clear that setup is needed.
    throw new Error(
        'Firestore not configured. Set FIRESTORE_EMULATOR_HOST for emulator or ' +
        'GOOGLE_CLOUD_PROJECT and GOOGLE_APPLICATION_CREDENTIALS for live connection.'
    );
  }
} catch (error) {
  console.error('Firestore Client: Failed to initialize Firestore:', error);
  // Depending on the application's needs, you might want to re-throw the error
  // or handle it in a way that allows the app to run in a degraded mode (if applicable).
  throw error; // Re-throw to ensure visibility of the problem
}

export { firestore };
