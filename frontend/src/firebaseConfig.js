import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAdhgktlcypOkdB645mvDDVvDoQvsYy7i0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "classeserp-ff69f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "classeserp-ff69f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "classeserp-ff69f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1019523740283",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1019523740283:android:2c178e74e3af1da3bb68de",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const setupRecaptcha = (containerId = 'recaptcha-container') => {
  if (typeof window === 'undefined') return null;
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved - allow signInWithPhoneNumber.
      },
      'expired-callback': () => {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      }
    });
  }
  return window.recaptchaVerifier;
};

export const sendFirebaseOtp = async (phoneNumber, containerId = 'recaptcha-container') => {
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber.replace(/\D/g, '')}`;
  const appVerifier = setupRecaptcha(containerId);
  return await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
};

export default app;
