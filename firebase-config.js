import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9ses0NXK4OI9JcEH3ym8nDS-kvBlBT_8",
  authDomain: "designtechvlsi.firebaseapp.com",
  projectId: "designtechvlsi",
  storageBucket: "designtechvlsi.firebasestorage.app",
  messagingSenderId: "268545364402",
  appId: "1:268545364402:web:57a3d1d3fb8535998754ab",
  measurementId: "G-F5KGZK2JDK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
