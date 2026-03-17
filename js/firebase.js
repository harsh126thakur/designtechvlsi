import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9ses0NXK4OI9JcEH3ym8nDS-kvBlBT_8",
  authDomain: "designtechvlsi.firebaseapp.com",
  projectId: "designtechvlsi",
  storageBucket: "designtechvlsi.firebasestorage.app",
  messagingSenderId: "268545364402",
  appId: "1:268545364402:web:57a3d1d3fb8535998754ab"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
