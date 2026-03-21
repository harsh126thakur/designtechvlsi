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
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser = null;
let currentAdminData = null;

// ================= SIDEBAR =================
const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".section-panel");
const pageTitle = document.getElementById("pageTitle");
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");

navItems.forEach(btn => {
  btn.addEventListener("click", () => {
    const section = btn.dataset.section;

    navItems.forEach(item => item.classList.remove("active"));
    btn.classList.add("active");

    sections.forEach(sec => sec.classList.remove("active"));
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.add("active");

    if (pageTitle) pageTitle.innerText = btn.innerText;

    if (window.innerWidth <= 960 && sidebar) {
      sidebar.classList.remove("open");
    }
  });
});

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    if (sidebar) sidebar.classList.toggle("open");
  });
}

// ================= HELPERS =================
function safeText(value) {
  return value ?? "";
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  try {
    if (!value) return "-";
    if (value.toDate) return value.toDate().toLocaleString();
    return new Date(value).toLocaleString();
  } catch {
    return "-";
  }
}

function createBadge(text, type = "blue") {
  return `<span class="badge ${type}">${text}</span>`;
}

function showAdminName(userData) {
  const el = document.getElementById("adminWelcome");
  if (!el) return;
  const name = userData?.name || "Admin";
  const role = userData?.role || "admin";
  el.innerText = `${name} • ${role}`;
}

function getPurchasedCoursesCount(userData) {
  if (Array.isArray(userData?.purchasedCourses)) {
    return userData.purchasedCourses.length;
  }

  if (userData?.purchasedCourses && typeof userData.purchasedCourses === "object") {
    return Object.keys(userData.purchasedCourses).length;
  }

  return 0;
}

function getYouTubeId(url = "") {
  if (url.includes("watch?v=")) return url.split("watch?v=")[1].split("&")[0];
  if (url.includes("youtu.be/")) return url.split("youtu.be/")[1].split("?")[0];
  if (url.includes("embed/")) return url.split("embed/")[1].split("?")[0];
  return "";
}

// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  try {
    const email = (user.email || "").trim().toLowerCase();
    let userData = null;
    let role = "";
    let isActive = true;

    if (email) {
      const adminEmailQuery = query(collection(db, "admins"), where("email", "==", email));
      const adminEmailSnap = await getDocs(adminEmailQuery);

      if (!adminEmailSnap.empty) {
        userData = adminEmailSnap.docs[0].data();
        role = (userData.role || "").toLowerCase();
        isActive = userData.isActive !== false;
      }
    }

    if (!userData) {
      const adminRef = doc(db, "admins", user.uid);
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists()) {
        userData = adminSnap.data();
        role = (userData.role || "").toLowerCase();
        isActive = userData.isActive !== false;
      }
    }

    if (!userData) {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        userData = userSnap.data();
        role = (userData.role || "").toLowerCase();
        isActive = userData.isActive !== false;
      }
    }

    if (!userData || !["admin", "superadmin"].includes(role)) {
      alert("Access denied");
      await signOut(auth);
      window.location.href = "login.html";
      return;
    }

    if (!isActive) {
      alert("Your admin account is inactive");
      await signOut(auth);
      window.location.href = "login.html";
      return;
    }

    currentAdminData = userData;
    showAdminName(userData);

    await Promise.all([
      loadOverview(),
      loadCourses(),
      loadCourseDropdowns(),
      loadQuizzes(),
      loadQuizDropdowns(),
      loadQuestions(),
      loadTestSeries(),
      loadTestSeriesDropdowns(),
      loadCoupons(),
      loadPodcasts(),
      loadEnquiries(),
      loadBookings(),
      loadPayments(),
      loadUsers()
    ]);

  } catch (error) {
    console.error("Admin auth error:", error);
    alert("Error loading admin panel");
    await signOut(auth);
    window.location.href = "login.html";
  }
});

// ================= LOGOUT =================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

// ================= OVERVIEW =================
async function loadOverview() {
  try {
    const [
      usersSnap,
      coursesSnap,
      quizzesSnap,
      testSeriesSnap,
      enquiriesSnap,
      paymentsSnap
    ] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "courses")),
      getDocs(collection(db, "quizzes")),
      getDocs(collection(db, "testseries")),
      getDocs(collection(db, "enquiries")),
      getDocs(collection(db, "payments"))
    ]);

    const totalUsers = document.getElementById("totalUsers");
    const totalCourses = document.getElementById("totalCourses");
    const totalQuizzes = document.getElementById("totalQuizzes");
    const totalTestSeries = document.getElementById("totalTestSeries");
    const totalPayments = document.getElementById("totalPayments");
    const totalRevenue = document.getElementById("totalRevenue");

    if (totalUsers) totalUsers.innerText = usersSnap.size;
    if (totalCourses) totalCourses.innerText = coursesSnap.size;
    if (totalQuizzes) totalQuizzes.innerText = quizzesSnap.size;
    if (totalTestSeries) totalTestSeries.innerText = testSeriesSnap.size;
    if (totalPayments) totalPayments.innerText = paymentsSnap.size;

    let revenue = 0;
    paymentsSnap.forEach(docSnap => {
      const data = docSnap.data();
      revenue += Number(data.finalAmount || data.amount || 0);
    });

    if (totalRevenue) totalRevenue.innerText = formatCurrency(revenue);

    const enquiryQuery = query(collection(db, "enquiries"), orderBy("createdAt", "desc"), limit(5));
    const paymentQuery = query(collection(db, "payments"), orderBy("createdAt", "desc"), limit(5));

    const [recentEnquirySnap, recentPaymentSnap] = await Promise.all([
      getDocs(enquiryQuery),
      getDocs(paymentQuery)
    ]);

    const recentEnquiries = document.getElementById("recentEnquiries");
    const recentPayments = document.getElementById("recentPayments");

    if (recentEnquiries) {
      recentEnquiries.innerHTML = "";
      if (recentEnquirySnap.empty) {
        recentEnquiries.innerHTML = `<div class="data-card"><p>No recent enquiries</p></div>`;
      } else {
        recentEnquirySnap.forEach(item => {
          const d = item.data();
          recentEnquiries.innerHTML += `
            <div class="data-card">
              <h4>${safeText(d.name)}</h4>
              <p>${safeText(d.email)}</p>
              <p>${safeText(d.message)}</p>
            </div>
          `;
        });
      }
    }

    if (recentPayments) {
      recentPayments.innerHTML = "";
      if (recentPaymentSnap.empty) {
        recentPayments.innerHTML = `<div class="data-card"><p>No recent payments</p></div>`;
      } else {
        recentPaymentSnap.forEach(item => {
          const d = item.data();
          recentPayments.innerHTML += `
            <div class="data-card">
              <h4>${safeText(d.courseTitle || d.purchaseType || d.source || "Payment")}</h4>
              <p>${safeText(d.userName || d.name || d.userEmail || "")}</p>
              <p>${formatCurrency(d.finalAmount || d.amount || 0)}</p>
            </div>
          `;
        });
      }
    }

  } catch (error) {
    console.error("Overview load error:", error);
  }
}

// ================= COURSES =================
const lectureContainer = document.getElementById("lectureContainer");
const notesContainer = document.getElementById("notesContainer");

function addLectureField(title = "", link = "") {
  if (!lectureContainer) return;
  const row = document.createElement("div");
  row.className = "lecture-row";
  row.innerHTML = `
    <input type="text" class="lecture-title" placeholder="Lecture Title" value="${title}">
    <input type="text" class="lecture-link" placeholder="YouTube Link" value="${link}">
    <button type="button" class="small-btn remove-row-btn">Remove</button>
  `;
  row.querySelector(".remove-row-btn").addEventListener("click", () => row.remove());
  lectureContainer.appendChild(row);
}

function addNoteField(title = "", link = "") {
  if (!notesContainer) return;
  const row = document.createElement("div");
  row.className = "note-row";
  row.innerHTML = `
    <input type="text" class="note-title" placeholder="Note Title" value="${title}">
    <input type="text" class="note-link" placeholder="Google Drive / PDF Link" value="${link}">
    <button type="button" class="small-btn remove-row-btn">Remove</button>
  `;
  row.querySelector(".remove-row-btn").addEventListener("click", () => row.remove());
  notesContainer.appendChild(row);
}

document.getElementById("addLectureBtn")?.addEventListener("click", () => addLectureField());
document.getElementById("addNoteBtn")?.addEventListener("click", () => addNoteField());
document.getElementById("saveCourseBtn")?.addEventListener("click", saveCourse);

async function saveCourse() {
  const title = document.getElementById("courseTitle")?.value.trim();
  const category = document.getElementById("courseCategory")?.value.trim();
  const level = document.getElementById("courseLevel")?.value.trim();
  const type = document.getElementById("courseType")?.value || "paid";
  const price = Number(document.getElementById("coursePrice")?.value || 0);
  const validityMonths = Number(document.getElementById("courseValidity")?.value || 12);
  const image = document.getElementById("courseImage")?.value.trim();
  const description = document.getElementById("courseDescription")?.value.trim();

  if (!title || !description) {
    alert("Please fill course title and description");
    return;
  }

  const lectures = [...document.querySelectorAll(".lecture-row")].map(row => ({
    title: row.querySelector(".lecture-title")?.value.trim(),
    link: row.querySelector(".lecture-link")?.value.trim()
  })).filter(item => item.title && item.link);

  const notes = [...document.querySelectorAll(".note-row")].map(row => ({
    title: row.querySelector(".note-title")?.value.trim(),
    link: row.querySelector(".note-link")?.value.trim()
  })).filter(item => item.title && item.link);

  try {
    await addDoc(collection(db, "courses"), {
      title,
      category: category || "",
      level: level || "",
      type,
      price,
      validityMonths,
      image: image || "",
      description,
      lectures,
      notes,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentAdminData?.name || currentUser?.email || "Admin"
    });

    alert("Course created successfully");

    document.getElementById("courseTitle").value = "";
    document.getElementById("courseCategory").value = "";
    document.getElementById("courseLevel").value = "";
    document.getElementById("courseType").value = "paid";
    document.getElementById("coursePrice").value = "";
    document.getElementById("courseValidity").value = "12";
    document.getElementById("courseImage").value = "";
    document.getElementById("courseDescription").value = "";
    if (lectureContainer) lectureContainer.innerHTML = "";
    if (notesContainer) notesContainer.innerHTML = "";
    addLectureField();
    addNoteField();

    await loadCourses();
    await loadCourseDropdowns();
    await loadOverview();

  } catch (error) {
    console.error("Save course error:", error);
    alert("Error creating course");
  }
}

async function loadCourses() {
  const list = document.getElementById("courseListAdmin");
  if (!list) return;
  list.innerHTML = "";

  try {
    const snap = await getDocs(query(collection(db, "courses"), orderBy("createdAt", "desc")));

    if (snap.empty) {
      list.innerHTML = `<div class="data-card"><p>No courses found</p></div>`;
      return;
    }

    snap.forEach(item => {
      const d = item.data();
      const card = document.createElement("div");
      card.className = "data-card";
      card.innerHTML = `
        <h4>${safeText(d.title)}</h4>
        <p>${safeText(d.category)} • ${safeText(d.level)}</p>
        <p>${safeText(d.type)} • ${formatCurrency(d.price || 0)} • ${d.validityMonths || 12} months</p>
        <p>${d.isActive ? createBadge("Active","green") : createBadge("Inactive","red")}</p>
        <div class="data-actions">
          <button class="small-btn toggle-course-btn">${d.isActive ? "Deactivate" : "Activate"}</button>
          <button class="small-btn delete-course-btn">Delete</button>
        </div>
      `;

      card.querySelector(".toggle-course-btn").addEventListener("click", async () => {
        await updateDoc(doc(db, "courses", item.id), {
          isActive: !d.isActive,
          updatedAt: serverTimestamp()
        });
        await loadCourses();
      });

      card.querySelector(".delete-course-btn").addEventListener("click", async () => {
        if (!confirm(`Delete course "${d.title}"?`)) return;
        await deleteDoc(doc(db, "courses", item.id));
        await loadCourses();
        await loadCourseDropdowns();
        await loadOverview();
      });

      list.appendChild(card);
    });

  } catch (error) {
    console.error("Load courses error:", error);
    list.innerHTML = `<div class="data-card"><p>Error loading courses</p></div>`;
  }
}

async function loadCourseDropdowns() {
  const dropdownIds = ["quizCourseId", "questionCourseId", "testSeriesCourseId"];
  const selects = dropdownIds.map(id => document.getElementById(id)).filter(Boolean);

  try {
    const snap = await getDocs(query(collection(db, "courses"), orderBy("title", "asc")));

    selects.forEach(select => {
      const firstOption = select.querySelector("option")?.outerHTML || `<option value="">Select Course</option>`;
      select.innerHTML = firstOption;
    });

    snap.forEach(item => {
      const d = item.data();
      const option = `<option value="${item.id}">${safeText(d.title)}</option>`;
      selects.forEach(select => {
        select.innerHTML += option;
      });
    });

  } catch (error) {
    console.error("Load course dropdown error:", error);
  }
}

// ================= QUIZZES =================
document.getElementById("saveQuizBtn")?.addEventListener("click", saveQuiz);

async function saveQuiz() {
  const title = document.getElementById("quizTitle")?.value.trim();
  const courseId = document.getElementById("quizCourseId")?.value;
  const chapterId = document.getElementById("quizChapterId")?.value.trim();
  const description = document.getElementById("quizDescription")?.value.trim();
  const totalQuestions = Number(document.getElementById("quizTotalQuestions")?.value || 0);
  const isActive = document.getElementById("quizIsActive")?.checked ?? true;

  if (!title || !courseId) {
    alert("Please fill quiz title and select course");
    return;
  }

  try {
    await addDoc(collection(db, "quizzes"), {
      title,
      courseId,
      chapterId: chapterId || "",
      description: description || "",
      totalQuestions,
      isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    alert("Quiz created successfully");

    document.getElementById("quizTitle").value = "";
    document.getElementById("quizCourseId").value = "";
    document.getElementById("quizChapterId").value = "";
    document.getElementById("quizDescription").value = "";
    document.getElementById("quizTotalQuestions").value = "";
    document.getElementById("quizIsActive").checked = true;

    await loadQuizzes();
    await loadQuizDropdowns();
    await loadOverview();

  } catch (error) {
    console.error("Save quiz error:", error);
    alert("Error creating quiz");
  }
}

async function loadQuizzes() {
  const list = document.getElementById("quizListAdmin");
  if (!list) return;
  list.innerHTML = "";

  try {
    const snap = await getDocs(query(collection(db, "quizzes"), orderBy("createdAt", "desc")));

    if (snap.empty) {
      list.innerHTML = `<div class="data-card"><p>No quizzes found</p></div>`;
      return;
    }

    snap.forEach(item => {
      const d = item.data();
      const card = document.createElement("div");
      card.className = "data-card";
      card.innerHTML = `
        <h4>${safeText(d.title)}</h4>
        <p>Course ID: ${safeText(d.courseId)}</p>
        <p>Chapter: ${safeText(d.chapterId || "-")}</p>
        <p>Total Questions: ${d.totalQuestions || 0}</p>
        <p>${d.isActive ? createBadge("Active","green") : createBadge("Inactive","red")}</p>
        <div class="data-actions">
          <button class="small-btn toggle-quiz-btn">${d.isActive ? "Deactivate" : "Activate"}</button>
          <button class="small-btn delete-quiz-btn">Delete</button>
        </div>
      `;

      card.querySelector(".toggle-quiz-btn").addEventListener("click", async () => {
        await updateDoc(doc(db, "quizzes", item.id), {
          isActive: !d.isActive,
          updatedAt: serverTimestamp()
        });
        await loadQuizzes();
      });

      card.querySelector(".delete-quiz-btn").addEventListener("click", async () => {
        if (!confirm(`Delete quiz "${d.title}"?`)) return;
        await deleteDoc(doc(db, "quizzes", item.id));
        await loadQuizzes();
        await loadQuizDropdowns();
        await loadOverview();
      });

      list.appendChild(card);
    });

  } catch (error) {
    console.error("Load quizzes error:", error);
    list.innerHTML = `<div class="data-card"><p>Error loading quizzes</p></div>`;
  }
}

async function loadQuizDropdowns() {
  const quizSelect = document.getElementById("questionQuizId");
  if (!quizSelect) return;

  try {
    const snap = await getDocs(query(collection(db, "quizzes"), orderBy("title", "asc")));
    quizSelect.innerHTML = `<option value="">Select Quiz</option>`;

    snap.forEach(item => {
      const d = item.data();
      quizSelect.innerHTML += `<option value="${item.id}">${safeText(d.title)}</option>`;
    });

  } catch (error) {
    console.error("Load quiz dropdown error:", error);
  }
}

// ================= TEST SERIES =================
document.getElementById("saveTestSeriesBtn")?.addEventListener("click", saveTestSeries);

async function saveTestSeries() {
  const title = document.getElementById("testSeriesTitle")?.value.trim();
  const courseId = document.getElementById("testSeriesCourseId")?.value;
  const category = document.getElementById("testSeriesCategory")?.value.trim();
  const description = document.getElementById("testSeriesDescription")?.value.trim();
  const durationMinutes = Number(document.getElementById("testSeriesDuration")?.value || 0);
  const totalQuestions = Number(document.getElementById("testSeriesTotalQuestions")?.value || 0);
  const totalMarks = Number(document.getElementById("testSeriesTotalMarks")?.value || 0);
  const negativeMarks = Number(document.getElementById("testSeriesNegativeMarks")?.value || 0);
  const isActive = document.getElementById("testSeriesIsActive")?.checked ?? true;

  if (!title) {
    alert("Please enter test series title");
    return;
  }

  try {
    await addDoc(collection(db, "testseries"), {
      title,
      courseId: courseId || "",
      category: category || "",
      description: description || "",
      durationMinutes,
      totalQuestions,
      totalMarks,
      negativeMarks,
      isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    alert("Test series created successfully");

    document.getElementById("testSeriesTitle").value = "";
    document.getElementById("testSeriesCourseId").value = "";
    document.getElementById("testSeriesCategory").value = "";
    document.getElementById("testSeriesDescription").value = "";
    document.getElementById("testSeriesDuration").value = "";
    document.getElementById("testSeriesTotalQuestions").value = "";
    document.getElementById("testSeriesTotalMarks").value = "";
    document.getElementById("testSeriesNegativeMarks").value = "0";
    document.getElementById("testSeriesIsActive").checked = true;

    await loadTestSeries();
    await loadTestSeriesDropdowns();
    await loadOverview();

  } catch (error) {
    console.error("Save test series error:", error);
    alert("Error creating test series");
  }
}

async function loadTestSeries() {
  const list = document.getElementById("testSeriesListAdmin");
  if (!list) return;
  list.innerHTML = "";

  try {
    const snap = await getDocs(query(collection(db, "testseries"), orderBy("createdAt", "desc")));

    if (snap.empty) {
      list.innerHTML = `<div class="data-card"><p>No test series found</p></div>`;
      return;
    }

    snap.forEach(item => {
      const d = item.data();
      const card = document.createElement("div");
      card.className = "data-card";
      card.innerHTML = `
        <h4>${safeText(d.title)}</h4>
        <p>Course ID: ${safeText(d.courseId || "-")}</p>
        <p>Category: ${safeText(d.category || "-")}</p>
        <p>Duration: ${d.durationMinutes || 0} min | Questions: ${d.totalQuestions || 0} | Marks: ${d.totalMarks || 0}</p>
        <p>${d.isActive ? createBadge("Active","green") : createBadge("Inactive","red")}</p>
        <div class="data-actions">
          <button class="small-btn toggle-testseries-btn">${d.isActive ? "Deactivate" : "Activate"}</button>
          <button class="small-btn delete-testseries-btn">Delete</button>
        </div>
      `;

      card.querySelector(".toggle-testseries-btn").addEventListener("click", async () => {
        await updateDoc(doc(db, "testseries", item.id), {
          isActive: !d.isActive,
          updatedAt: serverTimestamp()
        });
        await loadTestSeries();
      });

      card.querySelector(".delete-testseries-btn").addEventListener("click", async () => {
        if (!confirm(`Delete test series "${d.title}"?`)) return;
        await deleteDoc(doc(db, "testseries", item.id));
        await loadTestSeries();
        await loadTestSeriesDropdowns();
        await loadOverview();
      });

      list.appendChild(card);
    });

  } catch (error) {
    console.error("Load test series error:", error);
    list.innerHTML = `<div class="data-card"><p>Error loading test series</p></div>`;
  }
}

async function loadTestSeriesDropdowns() {
  const testSeriesSelect = document.getElementById("questionTestSeriesId");
  if (!testSeriesSelect) return;

  try {
    const snap = await getDocs(query(collection(db, "testseries"), orderBy("title", "asc")));
    testSeriesSelect.innerHTML = `<option value="">Select Test Series</option>`;

    snap.forEach(item => {
      const d = item.data();
      testSeriesSelect.innerHTML += `<option value="${item.id}">${safeText(d.title)}</option>`;
    });

  } catch (error) {
    console.error("Load test series dropdown error:", error);
  }
}

// ================= QUESTIONS =================
document.getElementById("saveQuestionBtn")?.addEventListener("click", saveQuestion);
document.getElementById("questionExamType")?.addEventListener("change", toggleQuestionTargetFields);
document.getElementById("questionType")?.addEventListener("change", toggleQuestionOptionFields);

function toggleQuestionTargetFields() {
  const examType = document.getElementById("questionExamType")?.value;
  const quizSelect = document.getElementById("questionQuizId");
  const testSeriesSelect = document.getElementById("questionTestSeriesId");

  if (!quizSelect || !testSeriesSelect) return;

  if (examType === "quiz") {
    quizSelect.disabled = false;
    testSeriesSelect.disabled = true;
    testSeriesSelect.value = "";
  } else {
    quizSelect.disabled = true;
    quizSelect.value = "";
    testSeriesSelect.disabled = false;
  }
}

function toggleQuestionOptionFields() {
  const questionType = document.getElementById("questionType")?.value;
  const optionsBox = document.getElementById("questionOptionsBox");
  const answerInput = document.getElementById("questionCorrectAnswer");

  if (!optionsBox || !answerInput) return;

  if (questionType === "numerical") {
    optionsBox.style.display = "none";
    answerInput.placeholder = "Correct Numerical Answer";
  } else if (questionType === "multicorrect") {
    optionsBox.style.display = "block";
    answerInput.placeholder = "Correct Answers (comma separated)";
  } else {
    optionsBox.style.display = "block";
    answerInput.placeholder = "Correct Answer";
  }
}

async function saveQuestion() {
  const examType = document.getElementById("questionExamType")?.value || "quiz";
  const quizId = document.getElementById("questionQuizId")?.value || "";
  const testSeriesId = document.getElementById("questionTestSeriesId")?.value || "";
  const courseId = document.getElementById("questionCourseId")?.value || "";
  const questionType = document.getElementById("questionType")?.value || "mcq";
  const order = Number(document.getElementById("questionOrder")?.value || 0);
  const marks = Number(document.getElementById("questionMarks")?.value || 1);
  const negativeMarks = Number(document.getElementById("questionNegativeMarks")?.value || 0);
  const question = document.getElementById("questionText")?.value.trim();
  const correctAnswer = document.getElementById("questionCorrectAnswer")?.value.trim();
  const isActive = document.getElementById("questionIsActive")?.checked ?? true;

  const options = [
    document.getElementById("option1")?.value.trim(),
    document.getElementById("option2")?.value.trim(),
    document.getElementById("option3")?.value.trim(),
    document.getElementById("option4")?.value.trim()
  ].filter(Boolean);

  if (!question) {
    alert("Please enter question text");
    return;
  }

  if (examType === "quiz" && !quizId) {
    alert("Please select quiz");
    return;
  }

  if (examType === "testseries" && !testSeriesId) {
    alert("Please select test series");
    return;
  }

  if (questionType !== "numerical" && options.length < 2) {
    alert("Please enter at least 2 options");
    return;
  }

  if (!correctAnswer) {
    alert("Please enter correct answer");
    return;
  }

  try {
    await addDoc(collection(db, "questions"), {
      examType,
      quizId: examType === "quiz" ? quizId : "",
      testSeriesId: examType === "testseries" ? testSeriesId : "",
      courseId,
      questionType,
      question,
      options,
      correctAnswer,
      marks,
      negativeMarks,
      order,
      isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    alert("Question added successfully");

    document.getElementById("questionExamType").value = "quiz";
    document.getElementById("questionQuizId").value = "";
    document.getElementById("questionTestSeriesId").value = "";
    document.getElementById("questionCourseId").value = "";
    document.getElementById("questionType").value = "mcq";
    document.getElementById("questionOrder").value = "";
    document.getElementById("questionMarks").value = "1";
    document.getElementById("questionNegativeMarks").value = "0";
    document.getElementById("questionText").value = "";
    document.getElementById("option1").value = "";
    document.getElementById("option2").value = "";
    document.getElementById("option3").value = "";
    document.getElementById("option4").value = "";
    document.getElementById("questionCorrectAnswer").value = "";
    document.getElementById("questionIsActive").checked = true;

    toggleQuestionTargetFields();
    toggleQuestionOptionFields();

    await loadQuestions();

  } catch (error) {
    console.error("Save question error:", error);
    alert("Error adding question");
  }
}

async function loadQuestions() {
  const list = document.getElementById("questionListAdmin");
  if (!list) return;
  list.innerHTML = "";

  try {
    const snap = await getDocs(query(collection(db, "questions"), orderBy("createdAt", "desc")));

    if (snap.empty) {
      list.innerHTML = `<div class="data-card"><p>No questions found</p></div>`;
      return;
    }

    snap.forEach(item => {
      const d = item.data();

      const card = document.createElement("div");
      card.className = "data-card";
      card.innerHTML = `
        <h4>${safeText(d.question)}</h4>
        <p>Exam Type: ${safeText(d.examType)}</p>
        <p>Question Type: ${safeText(d.questionType)}</p>
        <p>Quiz ID: ${safeText(d.quizId || "-")} | Test Series ID: ${safeText(d.testSeriesId || "-")}</p>
        <p>Marks: ${d.marks || 1} | Negative: ${d.negativeMarks || 0} | Order: ${d.order || 0}</p>
        <p>${d.isActive ? createBadge("Active","green") : createBadge("Inactive","red")}</p>
        <div class="data-actions">
          <button class="small-btn toggle-question-btn">${d.isActive ? "Deactivate" : "Activate"}</button>
          <button class="small-btn delete-question-btn">Delete</button>
        </div>
      `;

      card.querySelector(".toggle-question-btn").addEventListener("click", async () => {
        await updateDoc(doc(db, "questions", item.id), {
          isActive: !d.isActive,
          updatedAt: serverTimestamp()
        });
        await loadQuestions();
      });

      card.querySelector(".delete-question-btn").addEventListener("click", async () => {
        if (!confirm("Delete this question?")) return;
        await deleteDoc(doc(db, "questions", item.id));
        await loadQuestions();
      });

      list.appendChild(card);
    });

  } catch (error) {
    console.error("Load questions error:", error);
    list.innerHTML = `<div class="data-card"><p>Error loading questions</p></div>`;
  }
}

// ================= COUPONS =================
document.getElementById("saveCouponBtn")?.addEventListener("click", saveCoupon);

async function saveCoupon() {
  const code = document.getElementById("couponCode")?.value.trim().toUpperCase();
  const discountType = document.getElementById("couponDiscountType")?.value || "flat";
  const discountValue = Number(document.getElementById("couponDiscountValue")?.value || 0);
  const usageLimit = Number(document.getElementById("couponUsageLimit")?.value || 0);
  const expiryRaw = document.getElementById("couponExpiryDate")?.value;
  const isActive = document.getElementById("couponIsActive")?.checked ?? true;

  if (!code || discountValue <= 0) {
    alert("Please fill valid coupon details");
    return;
  }

  try {
    await setDoc(doc(db, "coupons", code), {
      code,
      discountType,
      discountValue,
      usageLimit,
      usedCount: 0,
      isActive,
      expiryDate: expiryRaw ? new Date(expiryRaw) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    alert("Coupon created successfully");

    document.getElementById("couponCode").value = "";
    document.getElementById("couponDiscountValue").value = "";
    document.getElementById("couponUsageLimit").value = "";
    document.getElementById("couponExpiryDate").value = "";
    document.getElementById("couponDiscountType").value = "flat";
    document.getElementById("couponIsActive").checked = true;

    await loadCoupons();

  } catch (error) {
    console.error("Save coupon error:", error);
    alert("Error creating coupon");
  }
}

async function loadCoupons() {
  const list = document.getElementById("couponListAdmin");
  if (!list) return;
  list.innerHTML = "";

  try {
    const snap = await getDocs(query(collection(db, "coupons"), orderBy("createdAt", "desc")));

    if (snap.empty) {
      list.innerHTML = `<div class="data-card"><p>No coupons found</p></div>`;
      return;
    }

    snap.forEach(item => {
      const d = item.data();

      const card = document.createElement("div");
      card.className = "data-card";
      card.innerHTML = `
        <h4>${safeText(d.code || item.id)}</h4>
        <p>${safeText(d.discountType)} • ${d.discountValue || 0}</p>
        <p>Used: ${d.usedCount || 0} / ${d.usageLimit || 0}</p>
        <p>Expiry: ${formatDate(d.expiryDate)}</p>
        <p>${d.isActive ? createBadge("Active", "green") : createBadge("Inactive", "red")}</p>
        <div class="data-actions">
          <button class="small-btn toggle-coupon-btn">${d.isActive ? "Deactivate" : "Activate"}</button>
          <button class="small-btn delete-coupon-btn">Delete</button>
        </div>
      `;

      card.querySelector(".toggle-coupon-btn").addEventListener("click", async () => {
        await updateDoc(doc(db, "coupons", item.id), {
          isActive: !d.isActive,
          updatedAt: serverTimestamp()
        });
        await loadCoupons();
      });

      card.querySelector(".delete-coupon-btn").addEventListener("click", async () => {
        if (!confirm(`Delete coupon "${d.code || item.id}"?`)) return;
        await deleteDoc(doc(db, "coupons", item.id));
        await loadCoupons();
      });

      list.appendChild(card);
    });

  } catch (error) {
    console.error("Load coupons error:", error);
    list.innerHTML = `<div class="data-card"><p>Error loading coupons</p></div>`;
  }
}

// ================= PODCASTS =================
document.getElementById("savePodcastBtn")?.addEventListener("click", savePodcast);

async function savePodcast() {
  const title = document.getElementById("podcastTitle")?.value.trim();
  const category = document.getElementById("podcastCategory")?.value.trim();
  const image = document.getElementById("podcastImage")?.value.trim();
  const videoUrl = document.getElementById("podcastVideoUrl")?.value.trim();
  const description = document.getElementById("podcastDescription")?.value.trim();
  const isActive = document.getElementById("podcastIsActive")?.checked ?? true;

  if (!title || !videoUrl) {
    alert("Please fill podcast title and video URL");
    return;
  }

  try {
    await addDoc(collection(db, "podcast"), {
      title,
      category: category || "",
      image: image || "",
      videoUrl,
      description: description || "",
      isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    alert("Podcast added successfully");

    document.getElementById("podcastTitle").value = "";
    document.getElementById("podcastCategory").value = "";
    document.getElementById("podcastImage").value = "";
    document.getElementById("podcastVideoUrl").value = "";
    document.getElementById("podcastDescription").value = "";
    document.getElementById("podcastIsActive").checked = true;

    await loadPodcasts();

  } catch (error) {
    console.error("Save podcast error:", error);
    alert("Error adding podcast");
  }
}

async function loadPodcasts() {
  const list = document.getElementById("podcastListAdmin");
  if (!list) return;
  list.innerHTML = "";

  try {
    const snap = await getDocs(query(collection(db, "podcast"), orderBy("createdAt", "desc")));

    if (snap.empty) {
      list.innerHTML = `<div class="data-card"><p>No podcasts found</p></div>`;
      return;
    }

    snap.forEach(item => {
      const d = item.data();
      const videoId = getYouTubeId(d.videoUrl || "");

      const card = document.createElement("div");
      card.className = "data-card";
      card.innerHTML = `
        <h4>${safeText(d.title)}</h4>
        <p>${safeText(d.category)}</p>
        <p>${safeText(d.description)}</p>
        <p>${d.isActive ? createBadge("Active", "green") : createBadge("Inactive", "red")}</p>
        <div class="data-actions">
          ${videoId ? `<a class="small-btn" href="https://www.youtube.com/watch?v=${videoId}" target="_blank" style="text-decoration:none;display:inline-flex;align-items:center;">Open</a>` : ""}
          <button class="small-btn toggle-podcast-btn">${d.isActive ? "Deactivate" : "Activate"}</button>
          <button class="small-btn delete-podcast-btn">Delete</button>
        </div>
      `;

      card.querySelector(".toggle-podcast-btn").addEventListener("click", async () => {
        await updateDoc(doc(db, "podcast", item.id), {
          isActive: !d.isActive,
          updatedAt: serverTimestamp()
        });
        await loadPodcasts();
      });

      card.querySelector(".delete-podcast-btn").addEventListener("click", async () => {
        if (!confirm(`Delete podcast "${d.title}"?`)) return;
        await deleteDoc(doc(db, "podcast", item.id));
        await loadPodcasts();
      });

      list.appendChild(card);
    });

  } catch (error) {
    console.error("Load podcasts error:", error);
    list.innerHTML = `<div class="data-card"><p>Error loading podcasts</p></div>`;
  }
}

// ================= ENQUIRIES =================
async function loadEnquiries() {
  const tbody = document.getElementById("enquiryTable");
  if (!tbody) return;
  tbody.innerHTML = "";

  try {
    const snap = await getDocs(query(collection(db, "enquiries"), orderBy("createdAt", "desc")));

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="5">No enquiries found</td></tr>`;
      return;
    }

    snap.forEach(item => {
      const d = item.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${safeText(d.name)}</td>
        <td>${safeText(d.email)}</td>
        <td>${safeText(d.phone)}</td>
        <td>${safeText(d.message)}</td>
        <td>${d.status === "new" ? createBadge("New", "blue") : createBadge(safeText(d.status || "Seen"), "green")}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error("Load enquiries error:", error);
    tbody.innerHTML = `<tr><td colspan="5">Error loading enquiries</td></tr>`;
  }
}

// ================= BOOKINGS =================
async function loadBookings() {
  const list = document.getElementById("bookingList");
  if (!list) return;
  list.innerHTML = "";

  try {
    const snap = await getDocs(query(collection(db, "bookings"), orderBy("createdAt", "desc")));

    if (snap.empty) {
      list.innerHTML = `<div class="data-card"><p>No bookings found</p></div>`;
      return;
    }

    snap.forEach(item => {
      const d = item.data();
      const card = document.createElement("div");
      card.className = "data-card";
      card.innerHTML = `
        <h4>${safeText(d.name)} • ${safeText(d.type || d.sessionType || "Mentorship")}</h4>
        <p>${safeText(d.email)} • ${safeText(d.phone)}</p>
        <p>Date: ${safeText(d.date)} | Time: ${safeText(d.time)}</p>
        <p>Price: ${formatCurrency(d.price || 0)}</p>
        <p>Status: ${safeText(d.status || "booked")}</p>
      `;
      list.appendChild(card);
    });

  } catch (error) {
    console.error("Load bookings error:", error);
    list.innerHTML = `<div class="data-card"><p>Error loading bookings</p></div>`;
  }
}

// ================= PAYMENTS =================
async function loadPayments() {
  const list = document.getElementById("paymentList");
  if (!list) return;
  list.innerHTML = "";

  try {
    const snap = await getDocs(query(collection(db, "payments"), orderBy("createdAt", "desc")));

    if (snap.empty) {
      list.innerHTML = `<div class="data-card"><p>No payments found</p></div>`;
      return;
    }

    snap.forEach(item => {
      const d = item.data();
      const card = document.createElement("div");
      card.className = "data-card";
      card.innerHTML = `
        <h4>${safeText(d.courseTitle || d.purchaseType || d.source || "Payment")}</h4>
        <p>${safeText(d.userName || d.name || "-")}</p>
        <p>${safeText(d.userEmail || d.email || "-")}</p>
        <p>Amount: ${formatCurrency(d.finalAmount || d.amount || 0)}</p>
        <p>Coupon: ${safeText(d.couponCode || "-")}</p>
        <p>Status: ${safeText(d.paymentStatus || d.status || "paid")}</p>
        <p>Transaction ID: ${safeText(d.transactionId || d.paymentId || "-")}</p>
      `;
      list.appendChild(card);
    });

  } catch (error) {
    console.error("Load payments error:", error);
    list.innerHTML = `<div class="data-card"><p>Error loading payments</p></div>`;
  }
}

// ================= USERS =================
async function loadUsers() {
  const list = document.getElementById("userList");
  if (!list) return;
  list.innerHTML = "";

  try {
    const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));

    if (snap.empty) {
      list.innerHTML = `<div class="data-card"><p>No users found</p></div>`;
      return;
    }

    snap.forEach(item => {
      const d = item.data();
      const card = document.createElement("div");
      card.className = "data-card";
      card.innerHTML = `
        <h4>${safeText(d.name || "Unnamed User")}</h4>
        <p>${safeText(d.email || "-")}</p>
        <p>Phone: ${safeText(d.phone || "-")}</p>
        <p>Role: ${safeText(d.role || "student")}</p>
        <p>Purchased Courses: ${getPurchasedCoursesCount(d)}</p>
        <p>${d.isActive !== false ? createBadge("Active", "green") : createBadge("Inactive", "red")}</p>
        <div class="data-actions">
          <button class="small-btn toggle-user-btn">${d.isActive !== false ? "Deactivate" : "Activate"}</button>
        </div>
      `;

      card.querySelector(".toggle-user-btn").addEventListener("click", async () => {
        await updateDoc(doc(db, "users", item.id), {
          isActive: d.isActive === false ? true : false,
          updatedAt: serverTimestamp()
        });
        await loadUsers();
      });

      list.appendChild(card);
    });

  } catch (error) {
    console.error("Load users error:", error);
    list.innerHTML = `<div class="data-card"><p>Error loading users</p></div>`;
  }
}

addLectureField();
addNoteField();
toggleQuestionTargetFields();
toggleQuestionOptionFields();