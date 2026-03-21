import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= HELPERS =================
function setError(message = "") {
  const errorBox = document.getElementById("error");
  if (errorBox) errorBox.innerText = message;
}

function getTrimmedValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setButtonLoading(button, loadingText, isLoading) {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.innerText;
    button.innerText = loadingText;
    button.disabled = true;
  } else {
    button.innerText = button.dataset.originalText || "Submit";
    button.disabled = false;
  }
}


// ================= EMAIL SIGNUP =================
window.signup = async function () {
  const name = getTrimmedValue("name");
  const phone = getTrimmedValue("phone");
  const email = getTrimmedValue("email");
  const password = getTrimmedValue("password");

  const signupBtn = document.querySelector("button:not(.google-btn)");
  setError("");

  // VALIDATION
  if (!name || !phone || !email || !password) {
    setError("Please fill all fields");
    return;
  }

  if (password.length < 6) {
    setError("Password must be at least 6 characters");
    return;
  }

  if (phone.length < 10) {
    setError("Enter valid phone number");
    return;
  }

  try {
    setButtonLoading(signupBtn, "Creating account...", true);

    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // STORE USER DATA
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name,
      phone,
      email,
      role: "user",
      isActive: true,
      purchasedCourses: [],
      progress: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      authProvider: "password"
    });

    window.location.href = "dashboard.html";

  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === "auth/email-already-in-use") {
      setError("Email already in use");
    } else if (error.code === "auth/invalid-email") {
      setError("Invalid email address");
    } else if (error.code === "auth/weak-password") {
      setError("Password is too weak");
    } else {
      setError(error.message);
    }

    setButtonLoading(signupBtn, "Creating account...", false);
  }
};


// ================= GOOGLE SIGNUP =================
const provider = new GoogleAuthProvider();

window.googleSignup = async function () {
  const googleBtn = document.querySelector(".google-btn");
  setError("");

  try {
    setButtonLoading(googleBtn, "Signing in with Google...", true);

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || "",
        phone: user.phoneNumber || "",
        email: user.email || "",
        role: "user",
        isActive: true,
        purchasedCourses: [],
        progress: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        authProvider: "google"
      });
    }

    window.location.href = "dashboard.html";

  } catch (error) {
    console.error("Google signup error:", error);

    if (error.code === "auth/popup-closed-by-user") {
      setError("Google sign-in was closed before completion");
    } else {
      setError(error.message);
    }

    setButtonLoading(googleBtn, "Signing in with Google...", false);
  }
};