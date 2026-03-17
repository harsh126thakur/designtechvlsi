import { db, auth } from "./firebase.js";

import {
doc,
getDoc,
setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// GET COURSE ID
const params = new URLSearchParams(window.location.search);
const courseId = params.get("id");

let userData = {};
let courseData = {};


// AUTH CHECK
onAuthStateChanged(auth, async (user)=>{

if(!user){
window.location.href="login.html";
return;
}

// GET COURSE
const courseSnap = await getDoc(doc(db,"courses",courseId));

if(!courseSnap.exists()){
alert("Course not found");
return;
}

courseData = courseSnap.data();


// 🔒 CHECK PURCHASE
if(courseData.type === "paid"){

const userSnap = await getDoc(doc(db,"users",user.uid));

const purchased = userSnap.exists() ? userSnap.data().purchasedCourses || [] : [];

if(!purchased.includes(courseId)){
alert("Please purchase first 💰");
window.location.href = `payment.html?id=${courseId}&price=${courseData.price}`;
return;
}

userData = userSnap.data() || {};

}

// LOAD UI
loadCourse(user);

});


// LOAD COURSE
function loadCourse(user){

document.getElementById("courseTitle").innerText = courseData.title;

let progress = userData.progress?.[courseId]?.completed || [];
let lastVideo = userData.progress?.[courseId]?.lastVideo;

let html = "";

// BUILD PLAYLIST
course.lectures.forEach(lec=>{
html += `
<div>
<h4>${lec.title}</h4>
<iframe src="${lec.link}" width="100%" height="200"></iframe>
</div>
`;
});
// RESUME LAST VIDEO
if(lastVideo){
playVideo(lastVideo);
}
else if(courseData.lectures.length > 0){
playVideo(courseData.lectures[0].video,0);
}

}
// PLAY VIDEO + SAVE PROGRESS
window.playVideo = async function(url,index){

let videoId = "";

if(url.includes("watch?v=")){
videoId = url.split("watch?v=")[1];
}
else if(url.includes("youtu.be/")){
videoId = url.split("youtu.be/")[1];
}

videoId = videoId.split("&")[0];

const embed = `https://www.youtube.com/embed/${videoId}?rel=0`;

document.getElementById("videoPlayer").src = embed;


// SAVE PROGRESS
const user = auth.currentUser;
const userRef = doc(db,"users",user.uid);

const snap = await getDoc(userRef);

let data = snap.exists() ? snap.data() : {};

let progress = data.progress || {};

if(!progress[courseId]){
progress[courseId] = {
completed: [],
lastVideo: ""
};
}

// MARK COMPLETE
if(!progress[courseId].completed.includes(index)){
progress[courseId].completed.push(index);
}

// SAVE LAST VIDEO
progress[courseId].lastVideo = url;

// UPDATE FIREBASE
await setDoc(userRef,{
progress: progress
},{merge:true});

};
