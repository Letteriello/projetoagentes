/**
 * @fileOverview Firebase Admin SDK initialization and export
 * This file initializes the Firebase Admin SDK for server-side operations
 * such as authentication verification, Firestore admin access, and other
 * privileged operations that require admin credentials.
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if it hasn't been initialized yet
if (!admin.apps.length) {
  console.log('Attempting to initialize Firebase Admin SDK...');
  console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'Set' : 'NOT SET');
  console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'NOT SET');
  console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Set (partially hidden)' : 'NOT SET');
  // For security, only log a portion of the private key or its presence
  if (process.env.FIREBASE_PRIVATE_KEY) {
    console.log('FIREBASE_PRIVATE_KEY (first 10 chars):', process.env.FIREBASE_PRIVATE_KEY.substring(0, 10));
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines in the private key with actual newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      // Uncomment if using Realtime Database
      // databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error?.message || error);
    // Throw error in development to make issues more visible
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Failed to initialize Firebase Admin: ${error?.message || 'Unknown error'}`);
    }
  }
}

// Export the admin instance for use in other files
export default admin;

// Export commonly used services for convenience
export const auth = admin.auth();
export const firestore = admin.firestore();
// Uncomment if using other Firebase services
// export const storage = admin.storage();
// export const messaging = admin.messaging();
