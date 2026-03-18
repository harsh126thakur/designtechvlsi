// ================= FIREBASE SETUP =================
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


// 🔥 CONFIG
const firebaseConfig = {
apiKey: "AIzaSyA9ses0NXK4OI9JcEH3ym8nDS-kvBlBT_8",
authDomain: "designtechvlsi.firebaseapp.com",
projectId: "designtechvlsi",
storageBucket: "designtechvlsi.firebasestorage.app",
messagingSenderId: "268545364402",
appId: "1:268545364402:web:57a3d1d3fb8535998754ab",
measurementId: "G-F5KGZK2JDK"
};


// 🔥 INIT
const app = initializeApp(firebaseConfig);
getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);


// ================= 🌌 FLOATING STARS =================
(function createStars(){

// prevent duplicate stars
if(document.querySelector(".stars")) return;

const starsContainer = document.createElement("div");
starsContainer.className = "stars";
document.body.appendChild(starsContainer);

for(let i=0;i<120;i++){
let star = document.createElement("div");
star.className = "star";

star.style.left = Math.random() * 100 + "vw";
star.style.animationDuration = (5 + Math.random() * 10) + "s";
star.style.opacity = Math.random();

starsContainer.appendChild(star);
}

})();


// ================= ENQUIRY FORM =================
const enquiryForm = document.getElementById("enquiryForm");

if (enquiryForm) {

enquiryForm.addEventListener("submit", async function(e){

e.preventDefault();

// 🔥 GET VALUES
const name = document.getElementById("name")?.value.trim();
const email = document.getElementById("email")?.value.trim();
const phone = document.getElementById("phone")?.value.trim();
const message = document.getElementById("message")?.value.trim();

// 🔥 VALIDATION
if(!name || !email || !phone || !message){
alert("⚠️ Please fill all fields");
return;
}

// 🔥 BUTTON LOADING
const btn = enquiryForm.querySelector("button");
btn.innerText = "Submitting...";
btn.disabled = true;

try {

// 🔥 SAVE TO FIRESTORE
await addDoc(collection(db,"enquiries"),{
name,
email,
phone,
message,
status: "new",
createdAt: new Date()
});

alert("✅ Enquiry submitted successfully");

// reset form
enquiryForm.reset();

}catch(error){
console.error("Enquiry Error:", error);
alert("❌ Error submitting enquiry");
}

// 🔥 RESET BUTTON
btn.innerText = "Submit";
btn.disabled = false;

});

}


// ================= LOGOUT =================
window.logout = function(){

signOut(auth)
.then(()=>{
alert("Logged out successfully");
window.location.href = "login.html";
})
.catch((error)=>{
console.error("Logout error:", error);
alert("❌ Logout failed");
});

};


// ================= DARK MODE =================
const modeToggle = document.getElementById("modeToggle");

if(modeToggle){
modeToggle.addEventListener("click", ()=>{
document.body.classList.toggle("dark-mode");
});
}


// ================= FAQ TOGGLE =================
window.toggleFAQ = function(el){

if(!el) return;

const p = el.nextElementSibling;
if(!p) return;

p.style.display = (p.style.display === "block") ? "none" : "block";

};


// ================= POPUP HANDLER =================
function togglePopup(id, show=true){

const el = document.getElementById(id);
if(!el) return;

el.style.display = show ? "flex" : "none";
}

// LOGIN
window.openLogin = () => togglePopup("loginPopup", true);
window.closeLogin = () => togglePopup("loginPopup", false);

// SIGNUP
window.openSignup = () => togglePopup("signupPopup", true);
window.closeSignup = () => togglePopup("signupPopup", false);

// ADMIN
window.openAdmin = () => togglePopup("adminPopup", true);
window.closeAdmin = () => togglePopup("adminPopup", false);


// ================= CLICK OUTSIDE POPUP =================
window.addEventListener("click", function(e){

["loginPopup","signupPopup","adminPopup"].forEach(id=>{
const popup = document.getElementById(id);
if(popup && e.target === popup){
popup.style.display = "none";
}
});

});


// ================= GLOBAL ERROR HANDLER =================
window.addEventListener("error", function(e){
console.error("Global Error:", e.message);
});