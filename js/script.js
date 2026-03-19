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

let starsContainer = document.getElementById("stars");

// ✅ use existing container
if(!starsContainer){
starsContainer = document.createElement("div");
starsContainer.className = "stars";
document.body.appendChild(starsContainer);
}

// prevent duplicate stars
if(starsContainer.children.length > 0) return;

// ⭐ generate stars
for(let i=0;i<120;i++){

let star = document.createElement("div");
star.className = "star";

// random position
star.style.left = Math.random() * 100 + "vw";

// random size
let size = Math.random() * 3 + "px";
star.style.width = size;
star.style.height = size;

// random animation speed
star.style.animationDuration = (6 + Math.random() * 10) + "s";

// random delay
star.style.animationDelay = Math.random() * 5 + "s";

// random opacity
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


// ================= 🌙 DARK MODE =================
const modeToggle = document.getElementById("modeToggle");

// load saved mode
if(localStorage.getItem("theme") === "light"){
document.body.classList.add("dark-mode");
}

if(modeToggle){
modeToggle.addEventListener("click", ()=>{

document.body.classList.toggle("dark-mode");

// save mode
if(document.body.classList.contains("dark-mode")){
localStorage.setItem("theme","light");
}else{
localStorage.setItem("theme","dark");
}

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
// ================= PODCAST FRONT =================
import {
getDocs,
query,
orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadPodcastsFront(){

const container = document.getElementById("podcastContainerFront");

if(!container){
console.log("❌ Podcast container not found");
return;
}

container.innerHTML = "Loading...";

try{

const q = query(collection(db,"podcast"), orderBy("createdAt","desc"));
const snapshot = await getDocs(q);

console.log("🔥 Podcasts fetched:", snapshot.size);

container.innerHTML = "";

snapshot.forEach(docSnap => {

const data = docSnap.data();

let videoId = "";

// ✅ SUPPORT ALL TYPES OF LINKS
if(data.videoUrl.includes("watch?v=")){
videoId = data.videoUrl.split("watch?v=")[1].split("&")[0];
}
else if(data.videoUrl.includes("youtu.be/")){
videoId = data.videoUrl.split("youtu.be/")[1].split("?")[0];
}
else if(data.videoUrl.includes("shorts/")){
videoId = data.videoUrl.split("shorts/")[1].split("?")[0];
}

// skip invalid
if(!videoId){
console.log("Invalid URL:", data.videoUrl);
return;
}

// thumbnail
const thumbnail = `https://img.youtube.com/vi/${videoId}/0.jpg`;

container.innerHTML += `
<div class="video-card" onclick="window.open('${data.videoUrl}','_blank')">

  <img src="${thumbnail}" />

  <p>${data.title}</p>

</div>
`;

});

}catch(err){
console.error("Podcast error:", err);
container.innerHTML = "❌ Failed to load podcasts";
}

}

// 🔥 CALL FUNCTION
loadPodcastsFront();
// ================= PREMIUM FAQ =================
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {

const question = item.querySelector(".faq-question");

question.addEventListener("click", () => {

// close all others
faqItems.forEach(i => {
if(i !== item) i.classList.remove("active");
});

// toggle current
item.classList.toggle("active");

});

});