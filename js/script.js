// ---------------- FIREBASE SETUP ----------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

import {
getFirestore,
collection,
addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
getAuth,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// CONFIG

const firebaseConfig = {
apiKey: "AIzaSyA9ses0NXK4OI9JcEH3ym8nDS-kvBlBT_8",
authDomain: "designtechvlsi.firebaseapp.com",
projectId: "designtechvlsi",
storageBucket: "designtechvlsi.firebasestorage.app",
messagingSenderId: "268545364402",
appId: "1:268545364402:web:57a3d1d3fb8535998754ab",
measurementId: "G-F5KGZK2JDK"
};


// INIT

const app = initializeApp(firebaseConfig);
getAnalytics(app);

const db = getFirestore(app);
const auth = getAuth(app);


// ---------------- ENQUIRY FORM ----------------

const enquiryForm = document.getElementById("enquiryForm");

if (enquiryForm) {

enquiryForm.addEventListener("submit", async function(e){

e.preventDefault();

const name = document.getElementById("name")?.value || "";
const email = document.getElementById("email")?.value || "";
const phone = document.getElementById("phone")?.value || "";
const message = document.getElementById("message")?.value || "";

try {

await addDoc(collection(db,"enquiries"),{

name: name,
email: email,
phone: phone,
message: message,
time: new Date()

});

alert("Enquiry submitted successfully!");

enquiryForm.reset();

}

catch(error){

console.error("Error:", error);
alert("Error submitting enquiry");

}

});

}


// ---------------- LOGOUT ----------------

window.logout = function(){

signOut(auth)
.then(()=>{

window.location.href = "login.html";

})
.catch((error)=>{
console.error("Logout error:", error);
});

}


// ---------------- DARK MODE ----------------

const modeToggle = document.getElementById("modeToggle");

if(modeToggle){

modeToggle.onclick = function(){

document.body.classList.toggle("dark-mode");

};

}


// ---------------- FAQ TOGGLE ----------------

window.toggleFAQ = function(el){

let p = el.nextElementSibling;

if(p.style.display === "block"){
p.style.display = "none";
}else{
p.style.display = "block";
}

};


// ---------------- LOGIN POPUP ----------------

window.openLogin = function(){

const el = document.getElementById("loginPopup");
if(el) el.style.display = "flex";

}

window.closeLogin = function(){

const el = document.getElementById("loginPopup");
if(el) el.style.display = "none";

}


// ---------------- SIGNUP POPUP ----------------

window.openSignup = function(){

const el = document.getElementById("signupPopup");
if(el) el.style.display = "flex";

}

window.closeSignup = function(){

const el = document.getElementById("signupPopup");
if(el) el.style.display = "none";

}


// ---------------- ADMIN POPUP ----------------

window.openAdmin = function(){

const el = document.getElementById("adminPopup");
if(el) el.style.display = "flex";

}

window.closeAdmin = function(){

const el = document.getElementById("adminPopup");
if(el) el.style.display = "none";

}
