// ─────────────────────────────────────────────────────────
//  FIREBASE SETUP  (one-time, takes ~5 minutes)
// ─────────────────────────────────────────────────────────
//  1. Go to https://console.firebase.google.com
//  2. Click "Add project" → name it "Sprout" → Continue
//  3. Go to Build → Authentication → Get started
//     → Enable "Google" sign-in method → Save
//  4. Go to Build → Firestore Database → Create database
//     → Start in "test mode" → choose a region → Done
//  5. Go to Project Settings (gear icon) → "Your apps"
//     → click Web (</>), name it "Sprout Web", Register
//     → copy the firebaseConfig values below
//  6. Go to Authentication → Settings → Authorized domains
//     → Add: nyang9825-crypto.github.io
// ─────────────────────────────────────────────────────────

const FIREBASE_CONFIG = {
    apiKey:            "",
    authDomain:        "",
    projectId:         "",
    storageBucket:     "",
    messagingSenderId: "",
    appId:             ""
};

// Automatically true once you fill in apiKey above
const FIREBASE_ENABLED = FIREBASE_CONFIG.apiKey.length > 0;

if (FIREBASE_ENABLED && typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}
