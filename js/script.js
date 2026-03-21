// ================= FIREBASE SETUP =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// 🔥 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyA9ses0NXK4OI9JcEH3ym8nDS-kvBlBT_8",
  authDomain: "designtechvlsi.firebaseapp.com",
  projectId: "designtechvlsi",
  storageBucket: "designtechvlsi.firebasestorage.app",
  messagingSenderId: "268545364402",
  appId: "1:268545364402:web:57a3d1d3fb8535998754ab",
  measurementId: "G-F5KGZK2JDK"
};


// 🔥 INIT
const app = initializeApp(firebaseConfig);
getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);


// ================= 🌌 FLOATING STARS =================
(function createStars() {
  let starsContainer = document.getElementById("stars");

  if (!starsContainer) {
    starsContainer = document.createElement("div");
    starsContainer.className = "stars";
    document.body.appendChild(starsContainer);
  }

  if (starsContainer.children.length > 0) return;

  for (let i = 0; i < 120; i++) {
    let star = document.createElement("div");
    star.className = "star";

    star.style.left = Math.random() * 100 + "vw";

    let size = Math.random() * 3 + "px";
    star.style.width = size;
    star.style.height = size;

    star.style.animationDuration = (6 + Math.random() * 10) + "s";
    star.style.animationDelay = Math.random() * 5 + "s";
    star.style.opacity = Math.random();

    starsContainer.appendChild(star);
  }
})();


// ================= ENQUIRY FORM =================
const enquiryForm = document.getElementById("enquiryForm");

if (enquiryForm) {
  enquiryForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const phone = document.getElementById("phone")?.value.trim();
    const message = document.getElementById("message")?.value.trim();

    if (!name || !email || !phone || !message) {
      alert("⚠️ Please fill all fields");
      return;
    }

    const btn = enquiryForm.querySelector("button");
    btn.innerText = "Submitting...";
    btn.disabled = true;

    try {
      await addDoc(collection(db, "enquiries"), {
        name,
        email,
        phone,
        message,
        status: "new",
        createdAt: new Date()
      });

      alert("✅ Enquiry submitted successfully");
      enquiryForm.reset();

    } catch (error) {
      console.error("Enquiry Error:", error);
      alert("❌ Error submitting enquiry");
    }

    btn.innerText = "Submit";
    btn.disabled = false;
  });
}


// ================= LOGOUT =================
window.logout = function () {
  signOut(auth)
    .then(() => {
      alert("Logged out successfully");
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
      alert("❌ Logout failed");
    });
};


// ================= 🌙 DARK MODE =================
const modeToggle = document.getElementById("modeToggle");

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("dark-mode");
}

if (modeToggle) {
  modeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "light");
    } else {
      localStorage.setItem("theme", "dark");
    }
  });
}


// ================= FAQ TOGGLE =================
window.toggleFAQ = function (el) {
  if (!el) return;

  const p = el.nextElementSibling;
  if (!p) return;

  p.style.display = (p.style.display === "block") ? "none" : "block";
};


// ================= POPUP HANDLER =================
function togglePopup(id, show = true) {
  const el = document.getElementById(id);
  if (!el) return;

  el.style.display = show ? "flex" : "none";
}

// LOGIN
window.openLogin = () => togglePopup("loginPopup", true);
window.closeLogin = () => togglePopup("loginPopup", false);

// SIGNUP
window.openSignup = () => togglePopup("signupPopup", true);
window.closeSignup = () => togglePopup("signupPopup", false);

// ADMIN
window.openAdmin = () => togglePopup("adminPopup", true);
window.closeAdmin = () => togglePopup("adminPopup", false);


// ================= CLICK OUTSIDE POPUP =================
window.addEventListener("click", function (e) {
  ["loginPopup", "signupPopup", "adminPopup"].forEach(id => {
    const popup = document.getElementById(id);
    if (popup && e.target === popup) {
      popup.style.display = "none";
    }
  });
});


// ================= GLOBAL ERROR HANDLER =================
window.addEventListener("error", function (e) {
  console.error("Global Error:", e.message);
});


// ================= FEATURED COURSES FRONT =================
function formatPrice(type, price) {
  if ((type || "").toLowerCase() === "free") return "Free";
  return `₹${Number(price || 0).toLocaleString("en-IN")}`;
}

function getLectureCount(lectures) {
  return Array.isArray(lectures) ? lectures.length : 0;
}

function hasNotes(notes) {
  if (Array.isArray(notes)) return notes.length > 0;
  if (typeof notes === "string") return notes.trim().length > 0;
  if (notes && typeof notes === "object") return Object.keys(notes).length > 0;
  return false;
}

function safeText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getCourseImage(imagePath) {
  if (!imagePath) return "images/course-placeholder.jpg";
  return imagePath;
}

function createCourseCard(courseId, data) {
  const title = safeText(data.title, "Untitled Course");
  const description = safeText(
    data.description,
    "Structured learning program for VLSI and semiconductor career growth."
  );
  const image = getCourseImage(data.image);
  const type = safeText(data.type, "paid").toLowerCase();
  const level = safeText(data.level, "All Levels");
  const validityMonths = Number(data.validityMonths || 12);
  const lectureCount = getLectureCount(data.lectures);
  const price = formatPrice(type, data.price);
  const notesAvailable = hasNotes(data.notes);

  return `
    <div class="course-card" data-aos="fade-up">
      <div class="course-image-wrap">
        <img src="${image}" alt="${title}">
      </div>

      <div class="course-top">
        <span class="course-badge">${type === "free" ? "Free Access" : "Premium Course"}</span>
        <span class="course-type">${price}</span>
      </div>

      <h3>${title}</h3>

      <div class="course-meta">
        <span class="course-chip level">${level}</span>
        <span class="course-chip validity">${validityMonths} Month${validityMonths > 1 ? "s" : ""} Access</span>
        ${notesAvailable ? `<span class="course-chip notes">Notes Included</span>` : ""}
      </div>

      <p class="course-desc">${description}</p>

      <div class="course-stats">
        <div class="course-stat">
          <small>Lectures</small>
          <strong>${lectureCount}</strong>
        </div>

        <a href="login.html" class="btn btn-primary btn-small">View Course</a>
      </div>
    </div>
  `;
}

async function loadFeaturedCoursesFront() {
  const container = document.getElementById("featuredCourses");

  if (!container) return;

  container.innerHTML = `<div class="course-loading-card">Loading active courses...</div>`;

  try {
    let snapshot;

    try {
      const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
      snapshot = await getDocs(q);
    } catch (sortError) {
      console.warn("Course orderBy failed, loading without sorting:", sortError);
      snapshot = await getDocs(collection(db, "courses"));
    }

    if (snapshot.empty) {
      container.innerHTML = `<div class="course-empty-card">No active courses available right now.</div>`;
      return;
    }

    const courses = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      if (data.isActive === false) return;

      courses.push({
        id: docSnap.id,
        ...data
      });
    });

    if (courses.length === 0) {
      container.innerHTML = `<div class="course-empty-card">No active courses available right now.</div>`;
      return;
    }

    container.innerHTML = courses
      .slice(0, 6)
      .map(course => createCourseCard(course.id, course))
      .join("");

    if (window.AOS) {
      window.AOS.refresh();
    }

  } catch (error) {
    console.error("Featured courses load error:", error);
    container.innerHTML = `<div class="course-error-card">Failed to load courses.</div>`;
  }
}


// ================= PODCAST FRONT =================
async function loadPodcastsFront() {
  const container = document.getElementById("podcastContainerFront");

  if (!container) {
    console.log("❌ Podcast container not found");
    return;
  }

  container.innerHTML = "Loading...";

  try {
    const q = query(collection(db, "podcast"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    console.log("🔥 Podcasts fetched:", snapshot.size);

    container.innerHTML = "";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();

      let videoId = "";

      if (data.videoUrl.includes("watch?v=")) {
        videoId = data.videoUrl.split("watch?v=")[1].split("&")[0];
      }
      else if (data.videoUrl.includes("youtu.be/")) {
        videoId = data.videoUrl.split("youtu.be/")[1].split("?")[0];
      }
      else if (data.videoUrl.includes("shorts/")) {
        videoId = data.videoUrl.split("shorts/")[1].split("?")[0];
      }

      if (!videoId) {
        console.log("Invalid URL:", data.videoUrl);
        return;
      }

      const thumbnail = `https://img.youtube.com/vi/${videoId}/0.jpg`;

      container.innerHTML += `
        <div class="video-card" onclick="window.open('${data.videoUrl}','_blank')">
          <img src="${thumbnail}" alt="${data.title}">
          <p>${data.title}</p>
        </div>
      `;
    });

  } catch (err) {
    console.error("Podcast error:", err);
    container.innerHTML = "❌ Failed to load podcasts";
  }
}


// 🔥 CALL FUNCTIONS
loadFeaturedCoursesFront();
loadPodcastsFront();


// ================= PREMIUM FAQ =================
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {
  const question = item.querySelector(".faq-question");

  if (!question) return;

  question.addEventListener("click", () => {
    faqItems.forEach(i => {
      if (i !== item) i.classList.remove("active");
    });

    item.classList.toggle("active");
  });
});