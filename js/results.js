import { auth, db } from "./firebase.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const type = params.get("type");

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "login.html";

  const q = query(
    collection(db, "results"),
    where("userId", "==", user.uid),
    where("assessmentId", "==", id),
    where("assessmentType", "==", type)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    alert("Result not found");
    return;
  }

  const data = snap.docs[0].data();

  document.getElementById("summary").innerHTML = `
    Score: ${data.score} <br>
    Total: ${data.totalMarks} <br>
    Accuracy: ${data.accuracy}%
  `;

  const wrap = document.getElementById("answersWrap");

  data.answers.forEach((q, i) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <h3>Q${i+1}: ${q.question}</h3>
      <p>Your: ${q.userAnswer}</p>
      <p>Correct: ${q.correctAnswer}</p>
    `;
    wrap.appendChild(div);
  });

  renderMathInElement(document.body);
});