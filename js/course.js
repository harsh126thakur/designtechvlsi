import { db } from "./script.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= GET COURSE ID =================
const params = new URLSearchParams(window.location.search);
const courseId = params.get("id");

// ================= ELEMENTS =================
const titleEl = document.getElementById("courseTitle");
const playlistEl = document.getElementById("playlist");
const player = document.getElementById("videoPlayer");


// ================= LOAD COURSE =================
async function loadCourse(){

if(!courseId){
alert("No course selected");
return;
}

try{

const docRef = doc(db,"courses",courseId);
const snap = await getDoc(docRef);

if(!snap.exists()){
alert("Course not found");
return;
}

const data = snap.data();

// TITLE
titleEl.innerText = data.title || "Course";

// PLAYLIST
playlistEl.innerHTML = "";

if(data.lectures && data.lectures.length > 0){

data.lectures.forEach((lec)=>{

if(!lec.link) return;

const div = document.createElement("div");
div.className = "lecture";
div.innerText = `▶ ${lec.title || "Lecture"}`;
div.dataset.link = lec.link;

div.addEventListener("click", ()=>{
playVideo(lec.link);
setActive(div);
});

playlistEl.appendChild(div);

});

// AUTO PLAY FIRST
const first = playlistEl.querySelector(".lecture");
if(first){
playVideo(first.dataset.link);
setActive(first);
}

}else{
playlistEl.innerHTML = "<p>No lectures available</p>";
}

}catch(err){
console.error(err);
alert("Error loading course");
}

}

loadCourse();


// ================= PLAY VIDEO =================
function playVideo(link){

let videoId = "";

if(link.includes("watch?v=")){
videoId = link.split("watch?v=")[1].split("&")[0];
}
else if(link.includes("youtu.be/")){
videoId = link.split("youtu.be/")[1].split("?")[0];
}
else if(link.includes("embed/")){
videoId = link.split("embed/")[1].split("?")[0];
}

if(!videoId){
alert("Invalid video");
return;
}

player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

}


// ================= ACTIVE =================
function setActive(el){

document.querySelectorAll(".lecture").forEach(e=>{
e.classList.remove("active");
});

el.classList.add("active");

el.scrollIntoView({
behavior:"smooth",
block:"center"
});

}


// ================= BACK =================
window.goBack = function(){
window.location.href = "course.html";
};