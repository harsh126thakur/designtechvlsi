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


// AUTH CHECK
onAuthStateChanged(auth, async (user)=>{

if(!user){
window.location.href="login.html";
return;
}

document.getElementById("welcome").innerText = "Welcome " + user.email;

loadCourses(user);

});


// LOAD COURSES WITH PROGRESS
async function loadCourses(user){

const courseSnap = await getDocs(collection(db,"courses"));
const userSnap = await getDoc(doc(db,"users",user.uid));

let userData = userSnap.exists() ? userSnap.data() : {};

let html = "";

courseSnap.forEach(docSnap => {

const c = docSnap.data();
const id = docSnap.id;

// 🔥 PURCHASE CHECK
let purchased = userData.purchasedCourses || [];
let isUnlocked = c.type === "free" || purchased.includes(id);

// 🔥 PROGRESS
let progressData = userData.progress?.[id]?.completed || [];
let totalLectures = (c.lectures || []).length;
let progressPercent = totalLectures > 0 ? Math.floor((progressData.length / totalLectures) * 100) : 0;


// UI CARD
html += `
<div class="course-card" onclick="${isUnlocked ? `openCourse('${id}','${c.type}',${c.price || 0})` : ''}">

<h3>${c.title}</h3>

<p class="${c.type}">
${c.type === "free" ? "FREE" : "PAID ₹" + (c.price || 0)}
</p>

${isUnlocked ? `
<div class="progress-bar">
<div class="progress" style="width:${progressPercent}%"></div>
</div>
<p>${progressPercent}% completed</p>
` : `
<p class="locked">🔒 Locked</p>
`}

</div>
`;

});

document.getElementById("courseList").innerHTML = html;

}


// OPEN COURSE
window.openCourse = function(id,type,price){

if(type === "free"){
window.location.href = `course.html?id=${id}`;
}
else{
window.location.href = `payment.html?id=${id}&price=${price}`;
}

};


// LOGOUT
window.logout = function(){
signOut(auth);
window.location.href="login.html";
};
