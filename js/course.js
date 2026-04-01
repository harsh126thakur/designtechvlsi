import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ================= PARAMS =================
const params = new URLSearchParams(window.location.search);
const courseId = params.get("id");

// ================= ELEMENTS =================
const titleEl = document.getElementById("courseTitle");
const validityEl = document.getElementById("courseValidity");
const playlistEl = document.getElementById("playlist");
const player = document.getElementById("videoPlayer");
const notesSection = document.getElementById("notesSection");
const courseQuizList = document.getElementById("courseQuizList");
const courseTestSeriesList = document.getElementById("courseTestSeriesList");

let currentUser = null;
let currentUserData = null;
let currentCourse = null;

// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User profile not found");
      window.location.href = "login.html";
      return;
    }

    currentUserData = userSnap.data();

    const role = (currentUserData.role || "user").toLowerCase();
    const isActive = currentUserData.isActive !== false;

    if (!isActive) {
      alert("Your account is inactive");
      window.location.href = "login.html";
      return;
    }

    if (!courseId) {
      alert("No course selected");
      window.location.href = "dashboard.html";
      return;
    }

    await loadCourse(role);
  } catch (err) {
    console.error("Course auth error:", err);
    alert("Error loading course");
    window.location.href = "dashboard.html";
  }
});

// ================= HELPERS =================
function getPurchasedCoursesMap(userData) {
  if (!userData?.purchasedCourses) return {};

  if (Array.isArray(userData.purchasedCourses)) {
    const mapped = {};
    userData.purchasedCourses.forEach((id) => {
      mapped[id] = { legacy: true };
    });
    return mapped;
  }

  if (typeof userData.purchasedCourses === "object") {
    return userData.purchasedCourses;
  }

  return {};
}

function getYoutubeEmbedUrl(link) {
  if (!link) return "";

  let videoId = "";

  if (link.includes("watch?v=")) {
    videoId = link.split("watch?v=")[1].split("&")[0];
  } else if (link.includes("youtu.be/")) {
    videoId = link.split("youtu.be/")[1].split("?")[0];
  } else if (link.includes("embed/")) {
    videoId = link.split("embed/")[1].split("?")[0];
  }

  if (!videoId) return "";
  return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ================= LOAD COURSE =================
async function loadCourse(role) {
  try {
    const docRef = doc(db, "courses", courseId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      alert("Course not found");
      window.location.href = "dashboard.html";
      return;
    }

    currentCourse = {
      id: snap.id,
      ...snap.data()
    };

    if (currentCourse.isActive === false) {
      alert("This course is inactive");
      window.location.href = "dashboard.html";
      return;
    }

    const purchasedCourses = getPurchasedCoursesMap(currentUserData);

const purchasedData = purchasedCourses[courseId];

let hasAccess =
  role === "admin" ||
  role === "superadmin" ||
  currentCourse.type === "free" ||
  !!purchasedData;

// 🔐 VALIDITY CHECK
if (hasAccess && purchasedData?.validTill) {
  const expiry = new Date(purchasedData.validTill);
  const now = new Date();

  if (expiry < now) {
    alert("Your course validity has expired");
    window.location.href = "dashboard.html";
    return;
  }
}
    if (!hasAccess) {
      alert("You do not have access to this course");
      window.location.href = "dashboard.html";
      return;
    }

    titleEl.innerText = currentCourse.title || "Course";
    // 🔐 Show actual validity
if (purchasedData?.validTill) {
  const expiryDate = new Date(purchasedData.validTill);

  validityEl.innerText =
    "Valid Till: " + expiryDate.toLocaleDateString();
} else {
  validityEl.innerText =
    `Validity: ${currentCourse.validityMonths || 12} Months`;
}

    renderLectures(currentCourse.lectures || []);
    renderNotes(currentCourse);
    await loadCourseQuizzes();
    await loadCourseTestSeries();
  } catch (err) {
    console.error("Load course error:", err);
    alert("Error loading course");
    window.location.href = "dashboard.html";
  }
}

// ================= LECTURES =================
function renderLectures(lectures) {
  playlistEl.innerHTML = "";

  if (!Array.isArray(lectures) || lectures.length === 0) {
    playlistEl.innerHTML = "<p>No lectures available</p>";
    return;
  }

  let firstPlayableLecture = null;

  lectures.forEach((lec, index) => {
  if (!lec?.link || typeof lec.link !== "string") return;

    const div = document.createElement("div");
    div.className = "lecture";
    div.dataset.link = lec.link;
    div.dataset.index = index;

    div.innerHTML = `
      <div class="lecture-top">
        <span class="lecture-index">${index + 1}</span>
        <div>
          <h4>${escapeHtml(lec.title || "Lecture")}</h4>
          <p>${escapeHtml(lec.duration || "Video lecture")}</p>
        </div>
      </div>
    `;

    div.addEventListener("click", async () => {
      playVideo(lec.link);
      setActive(div);
      await markLectureComplete(index);
    });

    playlistEl.appendChild(div);

    if (!firstPlayableLecture) {
      firstPlayableLecture = div;
    }
  });

  if (!firstPlayableLecture) {
    playlistEl.innerHTML = "<p>No valid lecture links available</p>";
    return;
  }

  playVideo(firstPlayableLecture.dataset.link);
  setActive(firstPlayableLecture);
}

function playVideo(link) {
  const embedUrl = getYoutubeEmbedUrl(link);

  if (!embedUrl) {
    alert("Invalid video link");
    return;
  }

  const loader = document.getElementById("videoLoader");

  // 🔐 Show loader
  if (loader) loader.style.display = "block";

  // Reset player
player.src = "";
setTimeout(() => {
  player.src = embedUrl;
}, 100);
function setActive(el) {
  document.querySelectorAll(".lecture").forEach((item) => {
    item.classList.remove("active");
  });

  el.classList.add("active");

  el.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

// ================= MARK PROGRESS =================
async function markLectureComplete(index) {
  try {
    if (!currentUser || !courseId) return;

    const userRef = doc(db, "users", currentUser.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) return;

    const data = snap.data();
    const progress = data.progress || {};
    const courseProgress = progress[courseId] || {};
    const completed = Array.isArray(courseProgress.completed)
      ? [...courseProgress.completed]
      : [];

    if (completed.includes(index)) return;

    completed.push(index);

    await setDoc(
      userRef,
      {
        progress: {
          ...progress,
          [courseId]: {
            ...courseProgress,
            completed
          }
        }
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Progress update error:", err);
  }
}

// ================= NOTES =================
function renderNotes(course) {
  const notesArray = Array.isArray(course.notes)
    ? course.notes.filter((note) => note && note.link)
    : [];

  const singleNotesLink =
    course.notesLink ||
    course.notesUrl ||
    course.driveLink ||
    "";

  if (notesArray.length > 0) {
    notesSection.innerHTML = `
      <div class="resource-list">
        ${notesArray
          .map(
            (note, index) => `
              <div class="resource-card">
                <div>
                  <h4>${escapeHtml(note.title || `Notes ${index + 1}`)}</h4>
                  <p>Open study notes, PDFs, and extra resources.</p>
                </div>
                <a href="${escapeHtml(note.link)}" target="_blank" rel="noopener noreferrer" class="resource-btn">
                  Open Notes
                </a>
              </div>
            `
          )
          .join("")}
      </div>
    `;
    return;
  }

  if (singleNotesLink) {
    notesSection.innerHTML = `
      <div class="resource-card">
        <div>
          <h4>Course Notes</h4>
          <p>Access study notes, PDFs, and extra resources from Google Drive.</p>
        </div>
        <a href="${escapeHtml(singleNotesLink)}" target="_blank" rel="noopener noreferrer" class="resource-btn">
          Open Notes
        </a>
      </div>
    `;
    return;
  }

  notesSection.innerHTML = `
    <div class="empty-state">
      <p>Notes are not available for this course yet.</p>
    </div>
  `;
}

// ================= QUIZZES =================
async function loadCourseQuizzes() {
  try {
    const q = query(collection(db, "quizzes"), where("courseId", "==", courseId));
    const snap = await getDocs(q);

    let html = "";

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      if (data.isActive === false) return;

      html += `
        <div class="assessment-card">
          <div class="assessment-badge quiz-badge">Quiz</div>
          <h4>${escapeHtml(data.title || "Practice Quiz")}</h4>
          <p>${escapeHtml(data.description || "Practice your concepts with a chapter-wise quiz.")}</p>
          <div class="assessment-meta">
            <span>Questions: ${data.totalQuestions || 0}</span>
            <span>Chapter: ${escapeHtml(data.chapterId || "General")}</span>
          </div>
          <button onclick="startAssessment('quiz','${id}')">Start Quiz</button>
        </div>
      `;
    });

    if (!html) {
      html = `
        <div class="empty-state">
          <p>No quizzes available for this course yet.</p>
        </div>
      `;
    }

    courseQuizList.innerHTML = html;
  } catch (err) {
    console.error("Quiz load error:", err);
    courseQuizList.innerHTML = `
      <div class="empty-state">
        <p>Error loading quizzes.</p>
      </div>
    `;
  }
}

// ================= TEST SERIES =================
async function loadCourseTestSeries() {
  try {
    const q = query(collection(db, "testseries"), where("courseId", "==", courseId));
    const snap = await getDocs(q);

    let html = "";

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      if (data.isActive === false) return;

      html += `
        <div class="assessment-card">
          <div class="assessment-badge test-badge">Test Series</div>
          <h4>${escapeHtml(data.title || "Full Test")}</h4>
          <p>${escapeHtml(data.description || "Attempt a full test series and evaluate your preparation.")}</p>
          <div class="assessment-meta">
            <span>${data.totalQuestions || 0} Questions</span>
            <span>${data.durationMinutes || 0} Minutes</span>
          </div>
          <button onclick="startAssessment('testseries','${id}')">Attempt Test</button>
        </div>
      `;
    });

    if (!html) {
      html = `
        <div class="empty-state">
          <p>No test series available for this course yet.</p>
        </div>
      `;
    }

    courseTestSeriesList.innerHTML = html;
  } catch (err) {
    console.error("Test series load error:", err);
    courseTestSeriesList.innerHTML = `
      <div class="empty-state">
        <p>Error loading test series.</p>
      </div>
    `;
  }
}

// ================= GLOBAL NAV =================
window.startAssessment = function(type, id) {
  window.location.href = `quiz.html?type=${type}&id=${id}`;
};

// Back button handler
const backBtn = document.getElementById("backBtn");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });
}
// 🚫 Disable right click (basic protection)
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});