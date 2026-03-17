import { auth, db } from "./firebase.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
collection,
getDocs,
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= AUTH =================
onAuthStateChanged(auth, async (user)=>{

if(!user){
window.location.href="login.html";
return;
}

console.log("Current UID:", user.uid);

document.getElementById("welcome").innerText = "Welcome " + user.email;

loadCourses(user);

});


// ================= LOAD COURSES =================
async function loadCourses(user){

const courseSnap = await getDocs(collection(db,"courses"));
const userSnap = await getDoc(doc(db,"users",user.uid));

let userData = userSnap.exists() ? userSnap.data() : {};

console.log("User Data:", userData);

let html = "";

courseSnap.forEach(docSnap => {

const c = docSnap.data();
const id = docSnap.id;

console.log("Course ID:", id);

// 🔒 PURCHASE CHECK
let purchased = userData.purchasedCourses || [];
let unlocked = c.type === "free" || purchased.includes(id);

// 📊 PROGRESS DATA
let completed = userData.progress?.[id]?.completed || [];
let total = (c.lectures || []).length;

// % calculation
let percent = total > 0 ? Math.floor((completed.length / total) * 100) : 0;

// fix visibility
if(percent === 0 && completed.length > 0){
percent = 1;
}


// ================= CARD =================
html += `
<div class="course-card ${unlocked ? "" : "locked-card"}">

<h3>${c.title}</h3>

<p class="${c.type}">
${c.type === "free" ? "FREE" : "PAID ₹" + (c.price || 0)}
</p>

${unlocked ? `

<div class="progress-bar">
<div class="progress" style="width:${percent}%"></div>
</div>

<p style="color:#38bdf8;font-weight:bold">
${percent}% Completed (${completed.length}/${total})
</p>

<button onclick="continueCourse('${id}')">
▶ Continue Learning
</button>

` : `

<p class="locked">🔒 Locked</p>

<button onclick="goToPayment('${id}',${c.price || 0})">
💳 Buy Now
</button>

`}

</div>
`;

});

document.getElementById("courseList").innerHTML = html;

}


// ================= CONTINUE =================
window.continueCourse = function(id){
window.location.href = `course.html?id=${id}`;
};


// ================= PAYMENT =================
window.goToPayment = function(id,price){
window.location.href = `payment.html?id=${id}&price=${price}`;
};


// ================= LOGOUT =================
window.logout = function(){
signOut(auth);
window.location.href="login.html";
};