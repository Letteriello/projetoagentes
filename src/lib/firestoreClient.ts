// src/lib/firestoreClient.ts
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

/*
Firestore Security Rules (Conceptual - to be defined in firestore.rules):

// Default deny all access
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Placeholder: Deny all reads and writes by default
    match /{document=**} {
      allow read, write: if false;
    }

    // Agents Collection
    // - Users can create agents (userId should match auth.uid).
    // - Users can read/update/delete their own agents.
    // - (Optional) Admins or specific roles might have broader access.
    match /agents/{agentId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      // TODO: Add rules for fetching all agents (e.g., for a public list or admin view if needed)
      // This might require a separate rule or a function to check roles.
    }

    // Conversations Collection
    // - Users can create conversations (userId should match auth.uid).
    // - Users can read/update/delete their own conversations.
    match /conversations/{conversationId} {
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;

      // Messages Sub-collection
      // - Users can create messages in their own conversations.
      // - Users can read messages in their own conversations.
      // - (Optional) Server-side logic (agent) might also write messages.
      match /messages/{messageId} {
        allow read: if request.auth != null && get(/databases/$(database)/documents/conversations/$(conversationId)).data.userId == request.auth.uid;
        allow create: if request.auth != null && get(/databases/$(database)/documents/conversations/$(conversationId)).data.userId == request.auth.uid;
        // Generally, messages are immutable once created.
        // allow update, delete: if false; // Or allow only for specific admin roles or message types
      }
    }
  }
}

User ID Handling:
- The `userId` field in both `agents` and `conversations` collections is critical.
- In a production environment, this `userId` would come from an authentication system (e.g., Firebase Authentication `request.auth.uid`).
- For initial local development and testing (especially with the emulator and no auth setup),
  a placeholder `userId` (e.g., "defaultUser", "localTestUser") can be used.
- Client-side code will need to be adapted to pass this `userId` when creating/querying data.
- Security rules will then enforce that users can only access their own data.
*/
