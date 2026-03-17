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
window.login = function(){

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

signInWithEmailAndPassword(auth, email, password)

.then(()=>{
document.getElementById("loginSection").style.display="none";
document.getElementById("dashboardSection").style.display="block";

loadAdminData();
loadCourses();

})

.catch(()=>{
document.getElementById("error").innerText="Invalid credentials";
});

};


// ================= LOGOUT =================
window.logout = function(){
signOut(auth);
location.reload();
};


// ================= ADD LECTURE =================
window.addLecture = function(){

const container = document.getElementById("lectureContainer");

const input = document.createElement("input");
input.placeholder = "Lecture Title";

container.appendChild(input);

};


// ================= SAVE COURSE =================
window.saveCourse = async function(){

const title = document.getElementById("courseTitle").value;
const type = document.getElementById("courseType").value;
const price = document.getElementById("coursePrice").value;

const lectureInputs = document.querySelectorAll("#lectureContainer input");

let lectures = [];

lectureInputs.forEach(input=>{
if(input.value){
lectures.push(input.value);
}
});

if(!title){
alert("Enter course title");
return;
}

await addDoc(collection(db,"courses"),{
title,
type,
price: type === "paid" ? Number(price) : 0,
lectures
});

alert("Course Saved");

// reset
document.getElementById("courseTitle").value="";
document.getElementById("lectureContainer").innerHTML="";

loadCourses();

};


// ================= LOAD COURSES =================
async function loadCourses(){

const snap = await getDocs(collection(db,"courses"));

let html = "";

snap.forEach(docSnap=>{

const data = docSnap.data();
const id = docSnap.id;

html += `
<div class="course">
<h4>${data.title}</h4>
<p>${data.type.toUpperCase()}</p>

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

}


// ================= DELETE =================
window.deleteCourse = async function(id){

if(!confirm("Delete this course?")) return;

await deleteDoc(doc(db,"courses",id));

loadCourses();

};


// ================= EDIT =================
window.editCourse = function(id,title,type,price){

document.getElementById("courseTitle").value = title;
document.getElementById("courseType").value = type;
document.getElementById("coursePrice").value = price;

// simple update mode
window.saveCourse = async function(){

const newTitle = document.getElementById("courseTitle").value;
const newType = document.getElementById("courseType").value;
const newPrice = document.getElementById("coursePrice").value;

await updateDoc(doc(db,"courses",id),{
title:newTitle,
type:newType,
price:newType === "paid" ? Number(newPrice) : 0
});

alert("Course Updated");

loadCourses();

};

};


// ================= ADMIN STATS =================
async function loadAdminData(){

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

}