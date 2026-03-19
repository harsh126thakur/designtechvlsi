import { db, auth } from "./script.js";

import {
collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🔐 LOGIN CHECK
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Login required");
    window.location.href = "login.html";
  } else {
    loadLeaderboard(user);
  }
});

async function loadLeaderboard(user){

const snap = await getDocs(collection(db,"quizScores"));

let html = "<h3>Your Scores</h3>";

snap.forEach(doc=>{
const d = doc.data();

if(d.user === user.email){
html += `<p>${d.score}/${d.total}</p>`;
}
});

html += "<h3>All Users</h3>";

snap.forEach(doc=>{
const d = doc.data();
html += `<p>${d.user} - ${d.score}/${d.total}</p>`;
});

document.getElementById("leaderboard").innerHTML = html;

}