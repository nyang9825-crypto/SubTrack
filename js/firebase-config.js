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
    apiKey:            "AIzaSyA4DRE2Tz-FL7QXifU5Cwl5lC4STXCsVCM",
    authDomain:        "sprout-96f41.firebaseapp.com",
    projectId:         "sprout-96f41",
    storageBucket:     "sprout-96f41.firebasestorage.app",
    messagingSenderId: "918325505701",
    appId:             "1:918325505701:web:5ac42e8463df2996eee74c",
    measurementId:     "G-PSP5VDXQJ1"
};

// Automatically true once you fill in apiKey above
const FIREBASE_ENABLED = FIREBASE_CONFIG.apiKey.length > 0;

if (FIREBASE_ENABLED && typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}
