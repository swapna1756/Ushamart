const admin = require('firebase-admin');
const path = require('path');

const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'ushamart-wholesale.firebasestorage.app';

let bucket = null;
let isConfigured = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: bucketName
    });
    bucket = admin.storage().bucket();
    isConfigured = true;
    console.log('✅ Firebase Storage configured via FIREBASE_SERVICE_ACCOUNT_JSON');
  } else if (process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      storageBucket: bucketName
    });
    bucket = admin.storage().bucket();
    isConfigured = true;
    console.log('✅ Firebase Storage configured via Google Application Credentials');
  } else {
    console.warn('⚠ FIREBASE_SERVICE_ACCOUNT_JSON not set. Local files will be served.');
  }
} catch (err) {
  console.warn('⚠ Firebase initialization failed:', err.message);
}

/**
 * Uploads a local file to Firebase Storage and returns the permanent download URL.
 * Falls back to local URL if Firebase is not configured.
 */
async function uploadToFirebase(localFilePath, destinationFilename, mimeType) {
  if (!isConfigured || !bucket) {
    throw new Error('Firebase Storage is not configured.');
  }

  const options = {
    destination: `uploads/${destinationFilename}`,
    metadata: {
      contentType: mimeType,
      metadata: {
        firebaseStorageDownloadTokens: destinationFilename, // custom token
      }
    },
    public: true,
  };

  // Upload the file
  await bucket.upload(localFilePath, options);

  // Return the stable permanent download URL format
  const encodedPath = encodeURIComponent(`uploads/${destinationFilename}`);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${destinationFilename}`;
}

module.exports = {
  uploadToFirebase,
  isFirebaseReady: () => isConfigured && !!bucket
};
