import { auth, db } from "./firebase.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
collection,
getDocs,
doc,
getDoc,
query,
where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {

if (!user) {
    window.location.href = "login.html";
    return;
}

const userDoc = await getDoc(doc(db, "users", user.uid));
const userData = userDoc.exists() ? userDoc.data() : {};

document.getElementById("welcome").innerText =
  "Welcome " + (userData.name || user.displayName || "Student");

// Loading state
document.getElementById("courseList").innerHTML = "<p style='padding:20px'>Loading courses...</p>";

const mentorshipBox = document.getElementById("mentorshipBookings");
if(mentorshipBox){
  mentorshipBox.innerHTML = "<p style='padding:10px'>Loading mentorship bookings...</p>";
}

try {
    await loadMentorshipBookings(user);
    await loadCourses(user);
} catch (error) {
    console.error(error);
    document.getElementById("courseList").innerHTML = "<p style='color:red'>Error loading courses</p>";
}

});

// ================= LOAD MENTORSHIP BOOKINGS =================
async function loadMentorshipBookings(user){

const container = document.getElementById("mentorshipBookings");
if(!container) return;

try{

const q = query(collection(db,"bookings"), where("userId","==",user.uid));
const snap = await getDocs(q);

let html = "";

snap.forEach(docSnap => {
const data = docSnap.data();

html += `
<div class="mentorship-booking-card">
  <h3>🚀 ${data.type || "Mentorship Session"}</h3>
  <p><b>Date:</b> ${data.date || "Not selected"}</p>
  <p><b>Time:</b> ${data.time || "Not selected"}</p>
  <p><b>Price:</b> ₹${data.price || 0}</p>
  <p><b>Payment ID:</b> ${data.paymentId || "N/A"}</p>
  <span class="booking-status">Booked</span>
</div>
`;
});

if(html === ""){
html = "<p style='color:#94a3b8'>No mentorship bookings yet.</p>";
}

container.innerHTML = html;

}catch(err){
console.error(err);
container.innerHTML = "<p style='color:red'>Error loading mentorship bookings</p>";
}

}


// ================= LOAD COURSES =================
async function loadCourses(user){

const courseSnap = await getDocs(collection(db, "courses"));
const userSnap = await getDoc(doc(db, "users", user.uid));

let userData = userSnap.exists() ? userSnap.data() : {};

let html = "";

// ================= MENTORSHIP CARD =================
html += `
<div class="course-card mentorship-card-special" onclick="goToMentorship()">

<h3>🚀 1:1 Mentorship</h3>

<p class="paid">
Personalized Guidance Session
</p>

<p>
Get expert help for CV building, internships, GATE, interviews, VLSI, and PhD guidance.
</p>

<div class="progress-bar">
<div class="progress" style="width:100%"></div>
</div>

<p style="color:#38bdf8;font-weight:bold">
30-Minute Personalized Session
</p>

<button onclick="event.stopPropagation(); goToMentorship()">
Book Now
</button>

</div>
`;

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


// ================= MENTORSHIP =================
window.goToMentorship = function(){
window.location.href = "mentorship.html";
};


// ================= LOGOUT =================
window.logout = function(){
signOut(auth);
window.location.href = "login.html";
};