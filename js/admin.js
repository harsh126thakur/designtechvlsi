import { auth, db } from "./firebase.js";

import {
signInWithEmailAndPassword,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
collection,
getDocs,
addDoc,
doc,
deleteDoc,
updateDoc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= LOGIN =================
window.login = async function(){

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

try{

await signInWithEmailAndPassword(auth, email, password);

// 🔥 ADMIN CHECK
const adminDoc = await getDoc(doc(db,"admins",email));

if(!adminDoc.exists()){
alert("Access denied: Not admin");
signOut(auth);
return;
}

// SHOW DASHBOARD
document.getElementById("loginSection").style.display="none";
document.getElementById("dashboardSection").style.display="block";

loadAdminData();
loadCourses();

}catch(err){
alert("Login failed");
}

};


// ================= LOGOUT =================
window.logout = function(){
signOut(auth);
location.reload();
};


// ================= ADD LECTURE =================
window.addLectureField = function(){

const container = document.getElementById("lectureContainer");

const div = document.createElement("div");

div.innerHTML = `
<input type="text" placeholder="Lecture Title">
<input type="text" placeholder="Lecture Link">
<button onclick="this.parentElement.remove()">❌</button>
`;

container.appendChild(div);
};


// ================= SAVE COURSE =================
async function saveNewCourse(){

try{

const title = document.getElementById("courseTitle").value;
const type = document.getElementById("courseType").value;
const price = document.getElementById("coursePrice").value;

const lectureDivs = document.querySelectorAll("#lectureContainer div");

let lectures = [];

lectureDivs.forEach(div=>{
const inputs = div.querySelectorAll("input");

if(inputs[0].value && inputs[1].value){
lectures.push({
title: inputs[0].value,
link: inputs[1].value
});
}
});

await addDoc(collection(db,"courses"),{
title,
type,
price: type==="paid" ? Number(price) : 0,
lectures
});

alert("Course Added");

resetForm();
loadCourses();

}catch(err){
console.error(err);
alert("Error adding course");
}

}

window.saveCourse = saveNewCourse;


// ================= RESET =================
function resetForm(){
document.getElementById("courseTitle").value="";
document.getElementById("coursePrice").value="";
document.getElementById("lectureContainer").innerHTML="";
window.saveCourse = saveNewCourse;
}


// ================= LOAD COURSES =================
async function loadCourses(){

const snap = await getDocs(collection(db,"courses"));

let html = "";

snap.forEach(docSnap=>{

const data = docSnap.data();
const id = docSnap.id;

let lectureHTML = "";

if(data.lectures){
data.lectures.forEach(l=>{
lectureHTML += `<li><a href="${l.link}" target="_blank">▶ ${l.title}</a></li>`;
});
}

const safeTitle = data.title.replace(/'/g, "\\'");

html += `
<div class="course">
<h4>${data.title}</h4>

<p>
${data.type.toUpperCase()} 
${data.type==="paid" ? "₹"+data.price : ""}
<br>
<span style="color:#38bdf8;">
${data.lectures ? data.lectures.length : 0} Lectures
</span>
</p>

<ul>${lectureHTML}</ul>

<button onclick="editCourse('${id}','${safeTitle}','${data.type}',${data.price})">Edit</button>
<button onclick="deleteCourse('${id}')">Delete</button>
</div>
`;

});

document.getElementById("courseListAdmin").innerHTML = html;
}


// ================= DELETE =================
window.deleteCourse = async function(id){
if(!confirm("Delete course?")) return;

await deleteDoc(doc(db,"courses",id));
loadCourses();
};


// ================= EDIT =================
window.editCourse = async function(id,title,type,price){

document.getElementById("courseTitle").value = title;
document.getElementById("courseType").value = type;
document.getElementById("coursePrice").value = price;

const container = document.getElementById("lectureContainer");
container.innerHTML = "";

const snap = await getDocs(collection(db,"courses"));

snap.forEach(docSnap=>{
if(docSnap.id === id){

const data = docSnap.data();

if(data.lectures){
data.lectures.forEach(l=>{
const div = document.createElement("div");

div.innerHTML = `
<input value="${l.title}">
<input value="${l.link}">
<button onclick="this.parentElement.remove()">❌</button>
`;

container.appendChild(div);
});
}

}
});

// override save
window.saveCourse = async function(){

const lectureDivs = document.querySelectorAll("#lectureContainer div");

let lectures = [];

lectureDivs.forEach(div=>{
const inputs = div.querySelectorAll("input");

if(inputs[0].value && inputs[1].value){
lectures.push({
title: inputs[0].value,
link: inputs[1].value
});
}
});

await updateDoc(doc(db,"courses",id),{
title: document.getElementById("courseTitle").value,
type: document.getElementById("courseType").value,
price: document.getElementById("courseType").value==="paid"
? Number(document.getElementById("coursePrice").value)
: 0,
lectures
});

alert("Updated");

resetForm();
loadCourses();
};

};


// ================= ADMIN STATS =================
async function loadAdminData(){

const userSnap = await getDocs(collection(db,"users"));
const enquirySnap = await getDocs(collection(db,"enquiries"));

document.getElementById("totalUsers").innerText = userSnap.size;
document.getElementById("totalEnquiries").innerText = enquirySnap.size;

};


// ================= USERS =================
async function loadUsers(){

const userSnap = await getDocs(collection(db,"users"));
const courseSnap = await getDocs(collection(db,"courses"));

let courseMap = {};

courseSnap.forEach(doc=>{
courseMap[doc.id] = doc.data().title;
});

let html = "";

userSnap.forEach(docSnap=>{
const data = docSnap.data();

let courses = "None";

if(data.progress){
const ids = Object.keys(data.progress);
courses = ids.map(id => courseMap[id] || id).join(", ");
}

html += `
<tr>
<td>${data.name || "User"}</td>
<td>${data.email || ""}</td>
<td>${courses}</td>
</tr>`;
});

document.getElementById("userTable").innerHTML = html;
}


// ================= ENQUIRIES =================
async function loadEnquiries(){

const snap = await getDocs(collection(db,"enquiries"));

let html = "";

snap.forEach(docSnap=>{
const d = docSnap.data();

html += `
<tr>
<td>${d.name||""}</td>
<td>${d.email||""}</td>
<td>${d.phone||""}</td>
<td>${d.message||""}</td>
<td>${d.status||"new"}</td>
</tr>`;
});

document.getElementById("table").innerHTML = html;
}


// ================= PAID USERS =================
async function loadPaidUsers(){

const snap = await getDocs(collection(db,"users"));

let html = "";

snap.forEach(docSnap=>{
const d = docSnap.data();

if(d.progress){
html += `<p>${d.email}</p>`;
}
});

document.getElementById("paidUsersList").innerHTML = html;
}


// ================= REVENUE =================
async function loadRevenue(){

const snap = await getDocs(collection(db,"users"));

let revenue = 0;

snap.forEach(doc=>{
const d = doc.data();

if(d.progress){
revenue += Object.keys(d.progress).length * 500;
}
});

document.getElementById("revenueDetail").innerText = "₹" + revenue;
}


// ================= COMMON TOGGLE =================
function toggleSection(id, loader){

const sections = [
"usersSection",
"enquirySection",
"paidSection",
"revenueSection"
];

// hide all
sections.forEach(sec=>{
const el = document.getElementById(sec);
if(el) el.style.display = "none";
});

// toggle selected
const section = document.getElementById(id);

if(section.style.display === "block"){
section.style.display = "none";
}else{
section.style.display = "block";
if(loader) loader();
}

}


// ================= TOGGLES =================
window.toggleUsers = () => toggleSection("usersSection", loadUsers);
window.toggleEnquiries = () => toggleSection("enquirySection", loadEnquiries);
window.togglePaidUsers = () => toggleSection("paidSection", loadPaidUsers);
window.toggleRevenue = () => toggleSection("revenueSection", loadRevenue);