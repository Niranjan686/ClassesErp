const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseAdminApp = null;

try {
  if (admin.apps.length === 0) {
    let serviceAccount = null;

    // Check environment variable (e.g. on Vercel) or local serviceAccountKey.json
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.warn('Could not parse FIREBASE_SERVICE_ACCOUNT env string');
      }
    }

    if (!serviceAccount) {
      const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
      if (fs.existsSync(keyPath)) {
        serviceAccount = require(keyPath);
      }
    }

    if (serviceAccount) {
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || 'classeserp-ff69f',
      });
      console.log('✅ Firebase Admin SDK initialized successfully for project:', serviceAccount.project_id);
    } else {
      console.log('ℹ️ Firebase Admin SDK initialized with default application credentials');
      firebaseAdminApp = admin.initializeApp({
        projectId: 'classeserp-ff69f',
      });
    }
  } else {
    firebaseAdminApp = admin.app();
  }
} catch (err) {
  console.warn('⚠️ Firebase Admin initialization notice:', err.message);
}

module.exports = { admin, firebaseAdminApp };
