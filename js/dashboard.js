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
onAuthStateChanged(auth, async (user) => {

if (!user) {
    window.location.href = "login.html";
    return;
}

document.getElementById("welcome").innerText = "Welcome " + user.email;

// Loading state
document.getElementById("courseList").innerHTML = "<p style='padding:20px'>Loading courses...</p>";

try {
    await loadCourses(user);
} catch (error) {
    console.error(error);
    document.getElementById("courseList").innerHTML = "<p style='color:red'>Error loading courses</p>";
}

});


// ================= LOAD COURSES =================
async function loadCourses(user){

const courseSnap = await getDocs(collection(db, "courses"));
const userSnap = await getDoc(doc(db, "users", user.uid));

let userData = userSnap.exists() ? userSnap.data() : {};

let html = "";

courseSnap.forEach(docSnap => {

const c = docSnap.data();
const id = docSnap.id;

// PURCHASE CHECK
let purchased = userData.purchasedCourses || [];
let unlocked = c.type === "free" || purchased.includes(id);

// PROGRESS
let completed = userData.progress?.[id]?.completed || [];
let total = (c.lectures || []).length;

let percent = total > 0 ? Math.floor((completed.length / total) * 100) : 0;

// ================= CARD =================
html += `
<div class="course-card ${unlocked ? "" : "locked-card"}">

<h3>${c.title || "Untitled Course"}</h3>

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
▶ Continue
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

// EMPTY STATE
if(html === ""){
html = "<p style='padding:20px'>No courses available</p>";
}

document.getElementById("courseList").innerHTML = html;

}


// ================= CONTINUE =================
window.continueCourse = function(id){
window.location.href = `course.html?id=${id}`;
};


// ================= PAYMENT =================
window.goToPayment = function(id, price){
window.location.href = `payment.html?id=${id}&price=${price}`;
};


// ================= LOGOUT =================
window.logout = function(){
signOut(auth);
window.location.href = "login.html";
};