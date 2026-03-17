import { db } from "./script.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= GET COURSE ID =================
const params = new URLSearchParams(window.location.search);
const courseId = params.get("id");


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

// 🔥 SET TITLE
document.getElementById("courseTitle").innerText = data.title;

// 🔥 BUILD PLAYLIST
let html = "";

if(data.lectures && data.lectures.length > 0){

data.lectures.forEach((lec,index)=>{

html += `
<div class="lecture" data-link="${lec.link}">
▶ ${lec.title}
</div>
`;

});

}else{
html = "<p>No lectures available</p>";
}

document.getElementById("playlist").innerHTML = html;


// 🔥 ADD CLICK EVENTS (BETTER THAN INLINE onclick)
document.querySelectorAll(".lecture").forEach((el)=>{

el.addEventListener("click", ()=>{

const link = el.getAttribute("data-link");
playVideo(link);

// 🔥 ACTIVE HIGHLIGHT
document.querySelectorAll(".lecture").forEach(l=>{
l.classList.remove("active");
});

el.classList.add("active");

});

});


// 🔥 AUTO PLAY FIRST VIDEO
if(data.lectures && data.lectures.length > 0){

playVideo(data.lectures[0].link);

// highlight first
const first = document.querySelector(".lecture");
if(first) first.classList.add("active");

}

}catch(err){
console.error(err);
alert("Error loading course");
}

}

loadCourse();


// ================= PLAY VIDEO =================
window.playVideo = function(link){

let videoId = "";

// ✅ HANDLE ALL YOUTUBE FORMATS
if(link.includes("watch?v=")){
videoId = link.split("watch?v=")[1].split("&")[0];
}
else if(link.includes("youtu.be/")){
videoId = link.split("youtu.be/")[1].split("?")[0];
}
else if(link.includes("embed/")){
videoId = link.split("embed/")[1];
}

// 🔥 SET VIDEO
document.getElementById("videoPlayer").src =
`https://www.youtube.com/embed/${videoId}?autoplay=1`;

};


// ================= BACK BUTTON =================
window.goBack = function(){
window.location.href = "course.html";
};