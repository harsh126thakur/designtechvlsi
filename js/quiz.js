import { db, auth } from "./script.js";

import {
doc, getDoc, collection, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🔐 LOGIN CHECK
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Login required");
    window.location.href = "login.html";
  }
});

const params = new URLSearchParams(window.location.search);
const quizId = params.get("id");

let questions = [];
let timeLeft = 60;
let timer;

// LOAD QUIZ
async function loadQuiz(){

const snap = await getDoc(doc(db,"quizzes",quizId));
const data = snap.data();

document.getElementById("quizTitle").innerText = data.title;
questions = data.questions;

let html = "";

questions.forEach((q,index)=>{

html += `<div>
<p>${q.question}</p>`;

q.options.forEach((opt,i)=>{
html += `
<label>
<input type="radio" name="q${index}" value="${i}">
${opt}
</label><br>`;
});

html += `</div>`;
});

document.getElementById("quizContainer").innerHTML = html;

startTimer();
}

loadQuiz();


// TIMER
function startTimer(){
timer = setInterval(()=>{
timeLeft--;
document.getElementById("timer").innerText = `Time Left: ${timeLeft}s`;

if(timeLeft <= 0){
clearInterval(timer);
submitQuiz();
}
},1000);
}


// SUBMIT
window.submitQuiz = async function(){

clearInterval(timer);

let score = 0;

questions.forEach((q,index)=>{
const selected = document.querySelector(`input[name="q${index}"]:checked`);

if(selected && Number(selected.value) === q.answer){
score++;
}
});

// 🔥 GET USER
const user = auth.currentUser;

// SAVE SCORE
await addDoc(collection(db,"quizScores"),{
user: user.email,
score,
total: questions.length,
quizId,
date: new Date()
});

alert(`Score: ${score}/${questions.length}`);

window.location.href = "leaderboard.html";
};