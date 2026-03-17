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
updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= LOGIN =================
import { getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.login = async function(){

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

try{

await signInWithEmailAndPassword(auth, email, password);

// 🔥 CHECK DIRECT DOC
const adminDoc = await getDoc(doc(db,"admins",email));

if(!adminDoc.exists()){
alert("Access denied: Not admin");
signOut(auth);
return;
}

// ✅ ALLOWED
document.getElementById("loginSection").style.display="none";
document.getElementById("dashboardSection").style.display="block";

loadAdminData();
loadCourses();
loadEnquiries();

}catch(err){
alert("Login failed");
}

};

// ================= LOGOUT =================
window.logout = function(){
signOut(auth);
location.reload();
};


// ================= ADD LECTURE FIELD =================
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

// 🔥 Collect lectures
const lectureDivs = document.querySelectorAll("#lectureContainer div");

let lectures = [];

lectureDivs.forEach(div=>{

const inputs = div.querySelectorAll("input");

const lectureTitle = inputs[0].value;
const lectureLink = inputs[1].value;

if(lectureTitle && lectureLink){
lectures.push({
title: lectureTitle,
link: lectureLink
});
}

});

// 🔥 Save to Firestore
await addDoc(collection(db,"courses"),{
title,
type,
price: type === "paid" ? Number(price) : 0,
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


// ================= RESET FORM =================
function resetForm(){

document.getElementById("courseTitle").value="";
document.getElementById("coursePrice").value="";
document.getElementById("lectureContainer").innerHTML="";

window.saveCourse = saveNewCourse;

}


// ================= LOAD COURSES =================
async function loadCourses(){

try{

const snap = await getDocs(collection(db,"courses"));

let html = "";

snap.forEach(docSnap=>{

const data = docSnap.data();
const id = docSnap.id;

let lectureHTML = "";

if(data.lectures){
data.lectures.forEach(l=>{
lectureHTML += `
<li>
<a href="${l.link}" target="_blank">${l.title}</a>
</li>`;
});
}

html += `
<div class="course">
<h4>${data.title}</h4>
<p>${data.type.toUpperCase()} ${data.type==="paid" ? "₹"+data.price : ""}</p>

<ul>${lectureHTML}</ul>

<button onclick="editCourse('${id}','${data.title}','${data.type}',${data.price})">
Edit
</button>

<button onclick="deleteCourse('${id}')">
Delete
</button>
</div>
`;

});

document.getElementById("courseListAdmin").innerHTML = html;

}catch(err){
console.error("Load error:", err);
}

}


// ================= DELETE COURSE =================
window.deleteCourse = async function(id){

if(!confirm("Delete this course?")) return;

try{
await deleteDoc(doc(db,"courses",id));
loadCourses();
}catch(err){
console.error(err);
}

};


// ================= EDIT COURSE =================
window.editCourse = async function(id,title,type,price){

document.getElementById("courseTitle").value = title;
document.getElementById("courseType").value = type;
document.getElementById("coursePrice").value = price;

// 🔥 CLEAR OLD LECTURES
const container = document.getElementById("lectureContainer");
container.innerHTML = "";

// 🔥 FETCH COURSE DATA
const snap = await getDocs(collection(db,"courses"));

snap.forEach(docSnap=>{
if(docSnap.id === id){

const data = docSnap.data();

if(data.lectures){
data.lectures.forEach(l=>{

const div = document.createElement("div");

div.innerHTML = `
<input type="text" value="${l.title}">
<input type="text" value="${l.link}">
<button onclick="this.parentElement.remove()">❌</button>
`;

container.appendChild(div);

});
}

}

});


// 🔥 UPDATE FUNCTION
window.saveCourse = async function(){

try{

const newTitle = document.getElementById("courseTitle").value;
const newType = document.getElementById("courseType").value;
const newPrice = document.getElementById("coursePrice").value;

// collect lectures again
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
title:newTitle,
type:newType,
price:newType==="paid" ? Number(newPrice) : 0,
lectures
});

alert("Course Updated");

resetForm();
loadCourses();

}catch(err){
console.error(err);
alert("Update failed");
}

};

};

// override save
window.saveCourse = async function(){

try{

const newTitle = document.getElementById("courseTitle").value;
const newType = document.getElementById("courseType").value;
const newPrice = document.getElementById("coursePrice").value;

// 🔥 Collect lectures again
const lectureDivs = document.querySelectorAll("#lectureContainer div");

let lectures = [];

lectureDivs.forEach(div=>{

const inputs = div.querySelectorAll("input");

const lectureTitle = inputs[0].value;
const lectureLink = inputs[1].value;

if(lectureTitle && lectureLink){
lectures.push({
title: lectureTitle,
link: lectureLink
});
}

});

await updateDoc(doc(db,"courses",id),{
title:newTitle,
type:newType,
price:newType === "paid" ? Number(newPrice) : 0,
lectures
});

alert("Course Updated");

resetForm();
loadCourses();

}catch(err){
console.error(err);
alert("Error updating");
}

};


// ================= ADMIN STATS =================
async function loadAdminData(){

try{

let totalUsers = 0;
let totalEnquiries = 0;
let paidUsers = 0;
let revenue = 0;

// USERS
const userSnap = await getDocs(collection(db,"users"));
totalUsers = userSnap.size;

userSnap.forEach(doc=>{
const d = doc.data();

if(d.purchasedCourses && d.purchasedCourses.length > 0){
paidUsers++;
revenue += d.purchasedCourses.length * 500;
}
});

// ENQUIRIES
const enquirySnap = await getDocs(collection(db,"enquiries"));
totalEnquiries = enquirySnap.size;

// UI
document.getElementById("totalUsers").innerText = totalUsers;
document.getElementById("totalEnquiries").innerText = totalEnquiries;
document.getElementById("paidUsers").innerText = paidUsers;
document.getElementById("revenue").innerText = "₹" + revenue;

}catch(err){
console.error(err);
}

}


// ================= LOAD ENQUIRIES =================
async function loadEnquiries(){

try{

const snap = await getDocs(collection(db,"enquiries"));

let html = "";

snap.forEach(docSnap=>{

const data = docSnap.data();

html += `
<tr>
<td>${data.name || ""}</td>
<td>${data.email || ""}</td>
<td>${data.phone || ""}</td>
<td>${data.message || ""}</td>
<td>${data.status || "new"}</td>
</tr>
`;

});

document.getElementById("table").innerHTML = html;

}catch(err){
console.error(err);
}

}