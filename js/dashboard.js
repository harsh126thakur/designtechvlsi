import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await signOut(auth);
      window.location.href = "login.html";
      return;
    }

    const userData = userDoc.data();
    const role = (userData.role || "user").toLowerCase();
    const isActive = userData.isActive !== false;

    if (!isActive) {
      alert("Your account is inactive. Please contact support.");
      await signOut(auth);
      window.location.href = "login.html";
      return;
    }

    if (role === "admin") {
      window.location.href = "admin.html";
      return;
    }

    if (role === "superadmin") {
      window.location.href = "superadmin.html";
      return;
    }

    const welcomeEl = document.getElementById("welcome");
    const courseListEl = document.getElementById("courseList");
    const mentorshipBox = document.getElementById("mentorshipBookings");
    const quizList = document.getElementById("quizList");
    const testSeriesList = document.getElementById("testSeriesList");

    if (welcomeEl) {
      welcomeEl.innerText = "Welcome " + (userData.name || user.displayName || "Student");
    }

    if (courseListEl) {
      courseListEl.innerHTML = "<p style='padding:20px'>Loading courses...</p>";
    }

    if (mentorshipBox) {
      mentorshipBox.innerHTML = "<p style='padding:10px'>Loading mentorship bookings...</p>";
    }

    if (quizList) {
      quizList.innerHTML = "<p style='padding:20px'>Loading quizzes...</p>";
    }

    if (testSeriesList) {
      testSeriesList.innerHTML = "<p style='padding:20px'>Loading test series...</p>";
    }

    await Promise.all([
      loadMentorshipBookings(user),
      loadCourses(user, userData),
      loadQuizzes(userData),
      loadTestSeries(userData)
    ]);

  } catch (error) {
    console.error("Dashboard auth/load error:", error);
    const courseList = document.getElementById("courseList");
    if (courseList) {
      courseList.innerHTML = "<p style='color:red'>Error loading dashboard</p>";
    }
  }
});

// ================= HELPERS =================
function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

function isCourseUnlocked(course, purchasedCoursesMap) {
  return course.type === "free" || !!purchasedCoursesMap[course.id];
}

function getCourseProgress(userData, courseId, totalLectures) {
  const completed = userData?.progress?.[courseId]?.completed || [];
  const percent = totalLectures > 0 ? Math.floor((completed.length / totalLectures) * 100) : 0;

  return {
    completedCount: completed.length,
    percent
  };
}

function canAccessAssessment(courseId, purchasedCoursesMap) {
  if (!courseId) return true;
  return !!purchasedCoursesMap[courseId];
}

function formatDate(value) {
  try {
    if (!value) return "-";
    if (typeof value?.toDate === "function") return value.toDate().toLocaleString();
    return new Date(value).toLocaleString();
  } catch {
    return "-";
  }
}

// ================= LOAD MENTORSHIP BOOKINGS =================
async function loadMentorshipBookings(user) {
  const container = document.getElementById("mentorshipBookings");
  if (!container) return;

  try {
    const q = query(collection(db, "bookings"), where("userId", "==", user.uid));
    const snap = await getDocs(q);

    let html = "";

    snap.forEach((docSnap) => {
      const data = docSnap.data();

      html += `
        <div class="mentorship-booking-card">
          <h3>🚀 ${safeText(data.type || "Mentorship Session")}</h3>
          <p><b>Date:</b> ${safeText(data.date || "Not selected")}</p>
          <p><b>Time:</b> ${safeText(data.time || "Not selected")}</p>
          <p><b>Price:</b> ₹${Number(data.price || 0).toLocaleString("en-IN")}</p>
          <p><b>Payment ID:</b> ${safeText(data.paymentId || "N/A")}</p>
          <p><b>Booked On:</b> ${formatDate(data.createdAt)}</p>
          <span class="booking-status">Booked</span>
        </div>
      `;
    });

    if (html === "") {
      html = "<p style='color:#94a3b8'>No mentorship bookings yet.</p>";
    }

    container.innerHTML = html;

  } catch (err) {
    console.error("Mentorship booking load error:", err);
    container.innerHTML = "<p style='color:red'>Error loading mentorship bookings</p>";
  }
}

// ================= LOAD COURSES =================
async function loadCourses(user, cachedUserData = null) {
  const courseList = document.getElementById("courseList");
  if (!courseList) return;

  try {
    const courseSnap = await getDocs(query(collection(db, "courses"), orderBy("createdAt", "desc")));

    let userData = cachedUserData;
    if (!userData) {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      userData = userSnap.exists() ? userSnap.data() : {};
    }

    const purchasedCoursesMap = getPurchasedCoursesMap(userData);

    let html = "";
    let totalCourses = 0;
    let unlockedCourses = 0;

    html += `
      <div class="course-card mentorship-card-special" onclick="goToMentorship()">
        <h3>🚀 1:1 Mentorship</h3>
        <p class="paid">Personalized Guidance Session</p>
        <p>
          Get expert help for CV building, internships, GATE, interviews, VLSI, and PhD guidance.
        </p>

        <div class="progress-bar">
          <div class="progress" style="width:100%"></div>
        </div>

        <p style="color:#38bdf8;font-weight:bold">
          30-Minute Personalized Session
        </p>

        <button onclick="event.stopPropagation(); goToMentorship()">
          Book Now
        </button>
      </div>
    `;

    courseSnap.forEach((docSnap) => {
      const c = docSnap.data();
      const id = docSnap.id;

      if (c.isActive === false) return;

      totalCourses += 1;

      const course = { id, ...c };
      const unlocked = isCourseUnlocked(course, purchasedCoursesMap);

      if (unlocked) unlockedCourses += 1;

      const totalLectures = Array.isArray(c.lectures) ? c.lectures.length : 0;
      const progress = getCourseProgress(userData, id, totalLectures);

      html += `
        <div class="course-card ${unlocked ? "" : "locked-card"}">
          <h3>${safeText(c.title || "Untitled Course")}</h3>

          <p class="${safeText(c.type || "paid")}">
            ${c.type === "free" ? "FREE" : "PAID ₹" + Number(c.price || 0).toLocaleString("en-IN")}
          </p>

          <p>${safeText(c.description || "Structured learning program for skill development.")}</p>
          <p class="course-validity">Validity: ${safeText(c.validityMonths || 12)} Months</p>

          ${
            unlocked
              ? `
                <div class="progress-bar">
                  <div class="progress" style="width:${progress.percent}%"></div>
                </div>

                <p style="color:#38bdf8;font-weight:bold">
                  ${progress.percent}% Completed (${progress.completedCount}/${totalLectures})
                </p>

                <button onclick="continueCourse('${id}')">
                  ▶ Continue
                </button>
              `
              : `
                <p class="locked">🔒 Locked</p>

                <button onclick="goToPayment('${id}', ${Number(c.price || 0)}, '${safeText((c.title || "").replace(/'/g, "\\'"))}')">
                  💳 Buy Now
                </button>
              `
          }
        </div>
      `;
    });

    if (html === "") {
      html = "<p style='padding:20px'>No courses available</p>";
    }

    courseList.innerHTML = html;

    const totalCoursesCount = document.getElementById("totalCoursesCount");
    const unlockedCoursesCount = document.getElementById("unlockedCoursesCount");

    if (totalCoursesCount) totalCoursesCount.innerText = totalCourses;
    if (unlockedCoursesCount) unlockedCoursesCount.innerText = unlockedCourses;

  } catch (err) {
    console.error("Course load error:", err);
    courseList.innerHTML = "<p style='color:red'>Error loading courses</p>";
  }
}

// ================= LOAD QUIZZES =================
async function loadQuizzes(userData) {
  const quizList = document.getElementById("quizList");
  const availableQuizzesCount = document.getElementById("availableQuizzesCount");

  if (!quizList) return;

  try {
    const quizSnap = await getDocs(query(collection(db, "quizzes"), orderBy("createdAt", "desc")));
    const purchasedCoursesMap = getPurchasedCoursesMap(userData);

    let html = "";
    let count = 0;

    quizSnap.forEach((docSnap) => {
      const q = docSnap.data();
      const id = docSnap.id;

      if (q.isActive === false) return;

      const allowed = canAccessAssessment(q.courseId, purchasedCoursesMap);
      if (!allowed) return;

      count += 1;

      html += `
        <div class="course-card">
          <h3>${safeText(q.title || "Practice Quiz")}</h3>
          <p class="free">QUIZ</p>
          <p>${safeText(q.description || "Chapter-wise practice quiz to test your understanding.")}</p>

          <div class="course-meta">
            <span>Questions: ${safeText(q.totalQuestions || 0)}</span>
            <span>Chapter: ${safeText(q.chapterId || "General")}</span>
          </div>

          <button onclick="startQuiz('quiz','${id}')">
            Start Quiz
          </button>
        </div>
      `;
    });

    if (html === "") {
      html = "<p style='color:#94a3b8'>No quizzes available right now.</p>";
    }

    quizList.innerHTML = html;
    if (availableQuizzesCount) availableQuizzesCount.innerText = count;

  } catch (err) {
    console.error("Quiz load error:", err);
    quizList.innerHTML = "<p style='color:red'>Error loading quizzes</p>";
  }
}

// ================= LOAD TEST SERIES =================
async function loadTestSeries(userData) {
  const testSeriesList = document.getElementById("testSeriesList");
  const availableTestSeriesCount = document.getElementById("availableTestSeriesCount");

  if (!testSeriesList) return;

  try {
    const testSnap = await getDocs(query(collection(db, "testseries"), orderBy("createdAt", "desc")));
    const purchasedCoursesMap = getPurchasedCoursesMap(userData);

    let html = "";
    let count = 0;

    testSnap.forEach((docSnap) => {
      const t = docSnap.data();
      const id = docSnap.id;

      if (t.isActive === false) return;

      const allowed = canAccessAssessment(t.courseId, purchasedCoursesMap);
      if (!allowed) return;

      count += 1;

      html += `
        <div class="course-card">
          <h3>${safeText(t.title || "Test Series")}</h3>
          <p class="paid">TEST SERIES</p>
          <p>${safeText(t.description || "Full-length test series for performance evaluation.")}</p>

          <div class="course-meta">
            <span>${safeText(t.totalQuestions || 0)} Questions</span>
            <span>${safeText(t.durationMinutes || 0)} Minutes</span>
          </div>

          <div class="course-meta">
            <span>Total Marks: ${safeText(t.totalMarks || 0)}</span>
            <span>Negative: ${safeText(t.negativeMarks || 0)}</span>
          </div>

          <button onclick="startQuiz('testseries','${id}')">
            Attempt Test
          </button>
        </div>
      `;
    });

    if (html === "") {
      html = "<p style='color:#94a3b8'>No test series available right now.</p>";
    }

    testSeriesList.innerHTML = html;
    if (availableTestSeriesCount) availableTestSeriesCount.innerText = count;

  } catch (err) {
    console.error("Test series load error:", err);
    testSeriesList.innerHTML = "<p style='color:red'>Error loading test series</p>";
  }
}

// ================= NAVIGATION =================
window.continueCourse = function (id) {
  window.location.href = `course.html?id=${id}`;
};

window.goToPayment = function (id, price, title = "") {
  const encodedTitle = encodeURIComponent(title || "Course Purchase");
  window.location.href = `payment.html?id=${id}&price=${price}&type=${encodedTitle}`;
};

window.goToMentorship = function () {
  window.location.href = "mentorship.html";
};

window.startQuiz = function (type, id) {
  window.location.href = `quiz.html?type=${type}&id=${id}`;
};

// ================= LOGOUT =================
window.logout = async function () {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout error:", error);
    alert("Error while logging out");
  }
};