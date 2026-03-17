import { auth, db } from "./firebase.js";

import {
createUserWithEmailAndPassword,
GoogleAuthProvider,
signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
doc,
setDoc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= EMAIL SIGNUP =================
window.signup = async function(){

const name = document.getElementById("name").value;
const phone = document.getElementById("phone").value;
const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

// VALIDATION
if(!name || !phone || !email || !password){
document.getElementById("error").innerText = "Please fill all fields";
return;
}

if(password.length < 6){
document.getElementById("error").innerText = "Password must be at least 6 characters";
return;
}

if(phone.length < 10){
document.getElementById("error").innerText = "Enter valid phone number";
return;
}

try {

const userCred = await createUserWithEmailAndPassword(auth, email, password);

// STORE USER DATA
await setDoc(doc(db, "users", userCred.user.uid), {
name: name,
phone: phone,
email: email,
purchasedCourses: [],
progress: {},
createdAt: new Date()
});

window.location.href = "dashboard.html";

} catch (error) {
document.getElementById("error").innerText = error.message;
}

};


// ================= GOOGLE SIGNUP =================
const provider = new GoogleAuthProvider();

window.googleSignup = async function(){

try {

const result = await signInWithPopup(auth, provider);
const user = result.user;

// CHECK IF USER EXISTS
const userRef = doc(db, "users", user.uid);
const snap = await getDoc(userRef);

if(!snap.exists()){
await setDoc(userRef, {
name: user.displayName || "",
phone: user.phoneNumber || "",
email: user.email,
purchasedCourses: [],
progress: {},
createdAt: new Date()
});
}

window.location.href = "dashboard.html";

} catch (error) {
document.getElementById("error").innerText = error.message;
}

};