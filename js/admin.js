import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= YOUTUBE URL HELPERS =================
function convertToEmbedUrl(url) {
  if (!url) return "";

  url = url.trim();

  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (url.includes("youtube.com/watch?v=")) {
    const videoId = url.split("v=")[1].split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (url.includes("youtube.com/shorts/")) {
    const videoId = url.split("youtube.com/shorts/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return url;
}

function extractYouTubeVideoId(url) {
  if (!url) return "";

  url = url.trim();

  if (url.includes("youtube.com/embed/")) {
    return url.split("youtube.com/embed/")[1].split("?")[0];
  }

  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1].split("?")[0];
  }

  if (url.includes("youtube.com/watch?v=")) {
    return url.split("v=")[1].split("&")[0];
  }

  if (url.includes("youtube.com/shorts/")) {
    return url.split("youtube.com/shorts/")[1].split("?")[0];
  }

  return "";
}


// ================= LOGIN =================
window.login = async function(){

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorBox = document.getElementById("error");

  errorBox.innerText = "";

  if(!email || !password){
    errorBox.innerText = "Enter email & password";
    return;
  }

  try{

    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    const adminDoc = await getDoc(doc(db,"admins",user.email));

    if(!adminDoc.exists()){
      errorBox.innerText = "Access denied (not admin)";
      await signOut(auth);
      return;
    }

    document.getElementById("loginSection").style.display = "none";
    document.getElementById("dashboardSection").style.display = "block";

    loadAdminData();
    loadEnquiries();
    loadCourses();
    loadPodcasts();
    loadBookings();
    loadUsers();

  }catch(err){
    console.error(err);
    errorBox.innerText = err.message;
  }

};


// ================= LOGOUT =================
window.logout = async function(){
  await signOut(auth);
  location.reload();
};


// ================= ADD LECTURE =================
window.addLectureField = function(){

  const container = document.getElementById("lectureContainer");
  const div = document.createElement("div");

  div.innerHTML = `
    <input type="text" placeholder="Lecture Title">
    <input type="text" placeholder="Lecture Link">
    <button onclick="this.parentElement.remove()">❌</button>
  `;

  container.appendChild(div);
};


// ================= SAVE COURSE =================
async function saveNewCourse(){

  try{

    const title = document.getElementById("courseTitle").value.trim();
    const type = document.getElementById("courseType").value;
    const price = document.getElementById("coursePrice").value;

    const lectureDivs = document.querySelectorAll("#lectureContainer div");
    let lectures = [];

    lectureDivs.forEach(div=>{
      const inputs = div.querySelectorAll("input");

      const lectureTitle = inputs[0].value.trim();
      const lectureLink = inputs[1].value.trim();

      if(lectureTitle && lectureLink){
        lectures.push({
          title: lectureTitle,
          link: convertToEmbedUrl(lectureLink)
        });
      }
    });

    await addDoc(collection(db,"courses"),{
      title,
      type,
      price: type === "paid" ? Number(price) : 0,
      lectures
    });

    alert("Course Added");
    resetForm();
    loadCourses();

  }catch(err){
    console.error(err);
    alert("Error adding course");
  }

}

window.saveCourse = saveNewCourse;


// ================= RESET =================
function resetForm(){
  document.getElementById("courseTitle").value = "";
  document.getElementById("coursePrice").value = "";
  document.getElementById("lectureContainer").innerHTML = "";
  window.saveCourse = saveNewCourse;
}


// ================= LOAD COURSES =================
async function loadCourses(){

  const snap = await getDocs(collection(db,"courses"));
  let html = "";

  snap.forEach(docSnap=>{

    const data = docSnap.data();
    const id = docSnap.id;

    let lectureHTML = "";

    if(data.lectures){
      data.lectures.forEach(l=>{
        lectureHTML += `<li><a href="${l.link}" target="_blank">▶ ${l.title}</a></li>`;
      });
    }

    const safeTitle = (data.title || "").replace(/'/g, "\\'");

    html += `
      <div class="course">
        <h4>${data.title || ""}</h4>

        <p>
          ${(data.type || "").toUpperCase()}
          ${data.type === "paid" ? "₹" + (data.price || 0) : ""}
          <br>
          <span style="color:#38bdf8;">
            ${data.lectures ? data.lectures.length : 0} Lectures
          </span>
        </p>

        <ul>${lectureHTML}</ul>

        <button onclick="editCourse('${id}','${safeTitle}','${data.type || "free"}',${Number(data.price || 0)})">Edit</button>
        <button onclick="deleteCourse('${id}')">Delete</button>
      </div>
    `;

  });

  document.getElementById("courseListAdmin").innerHTML = html;
}


// ================= DELETE COURSE =================
window.deleteCourse = async function(id){
  if(!confirm("Delete course?")) return;

  await deleteDoc(doc(db,"courses",id));
  loadCourses();
};


// ================= EDIT COURSE =================
window.editCourse = async function(id,title,type,price){

  document.getElementById("courseTitle").value = title;
  document.getElementById("courseType").value = type;
  document.getElementById("coursePrice").value = price;

  const container = document.getElementById("lectureContainer");
  container.innerHTML = "";

  const snap = await getDocs(collection(db,"courses"));

  snap.forEach(docSnap=>{
    if(docSnap.id === id){

      const data = docSnap.data();

      if(data.lectures){
        data.lectures.forEach(l=>{
          const div = document.createElement("div");

          div.innerHTML = `
            <input value="${l.title}">
            <input value="${l.link}">
            <button onclick="this.parentElement.remove()">❌</button>
          `;

          container.appendChild(div);
        });
      }
    }
  });

  window.saveCourse = async function(){

    const lectureDivs = document.querySelectorAll("#lectureContainer div");
    let lectures = [];

    lectureDivs.forEach(div=>{
      const inputs = div.querySelectorAll("input");

      const lectureTitle = inputs[0].value.trim();
      const lectureLink = inputs[1].value.trim();

      if(lectureTitle && lectureLink){
        lectures.push({
          title: lectureTitle,
          link: convertToEmbedUrl(lectureLink)
        });
      }
    });

    await updateDoc(doc(db,"courses",id),{
      title: document.getElementById("courseTitle").value.trim(),
      type: document.getElementById("courseType").value,
      price: document.getElementById("courseType").value === "paid"
        ? Number(document.getElementById("coursePrice").value)
        : 0,
      lectures
    });

    alert("Updated");
    resetForm();
    loadCourses();
  };
};


// ================= ADMIN STATS =================
async function loadAdminData(){
  try{
    const [userSnap, enquirySnap, bookingSnap, paymentsSnap] = await Promise.all([
      getDocs(collection(db,"users")),
      getDocs(collection(db,"enquiries")),
      getDocs(collection(db,"bookings")),
      getDocs(collection(db,"payments")).catch(() => ({ empty: true, forEach: ()=>{}, size: 0 }))
    ]);

    let paidUsers = 0;
    let mentorshipRevenue = 0;
    let courseRevenue = 0;

    userSnap.forEach(docSnap=>{
      const data = docSnap.data();
      const purchasedCourses = data.purchasedCourses || [];

      if(Array.isArray(purchasedCourses) && purchasedCourses.length > 0){
        paidUsers++;
      }
    });

    bookingSnap.forEach(docSnap=>{
      const data = docSnap.data();
      const price = Number(data.price || 0);

      if(!isNaN(price)){
        mentorshipRevenue += price;
      }
    });

    if(!paymentsSnap.empty){
      paymentsSnap.forEach(docSnap=>{
        const data = docSnap.data();

        const source = (data.source || "").toLowerCase();
        const type = (data.type || "").toLowerCase();

        let amount = Number(data.amount ?? data.price ?? 0);

        if(isNaN(amount)) amount = 0;

        if(amount > 99999){
          amount = amount / 100;
        }

        if(source.includes("course") || type.includes("course")){
          courseRevenue += amount;
        }else if(source.includes("mentorship") || type.includes("mentorship") || type.includes("booking")){
          mentorshipRevenue += amount;
        }else{
          courseRevenue += amount;
        }
      });
    }

    const totalRevenue = mentorshipRevenue + courseRevenue;

    document.getElementById("totalUsers").innerText = userSnap.size;
    document.getElementById("totalEnquiries").innerText = enquirySnap.size;
    document.getElementById("paidUsers").innerText = paidUsers;
    document.getElementById("revenue").innerText = `₹${Math.round(totalRevenue)}`;
    document.getElementById("mentorshipRevenue").innerText = `₹${Math.round(mentorshipRevenue)}`;
    document.getElementById("courseRevenue").innerText = `₹${Math.round(courseRevenue)}`;

  }catch(err){
    console.error("Admin stats error:", err);
  }
}


// ================= USERS =================
async function loadUsers(){

  const userSnap = await getDocs(collection(db,"users"));
  let html = "";

  userSnap.forEach(docSnap=>{
    const data = docSnap.data();

    html += `
      <tr>
        <td>${data.name || "User"}</td>
        <td>${data.email || ""}</td>
        <td>-</td>
      </tr>
    `;
  });

  const userTable = document.getElementById("userTable");
  if(userTable) userTable.innerHTML = html;
}


// ================= ENQUIRIES =================
async function loadEnquiries(){

  const snap = await getDocs(collection(db,"enquiries"));
  let html = "";

  snap.forEach(docSnap=>{
    const d = docSnap.data();

    html += `
      <tr>
        <td>${d.name || ""}</td>
        <td>${d.email || ""}</td>
        <td>${d.phone || ""}</td>
        <td>${d.message || ""}</td>
      </tr>
    `;
  });

  document.getElementById("table").innerHTML = html;
}


// ================= ADD PODCAST =================
const podcastForm = document.getElementById("podcastForm");

if(podcastForm){
  podcastForm.addEventListener("submit", async (e)=>{

    e.preventDefault();

    const title = document.getElementById("pTitle").value.trim();
    const category = document.getElementById("pCategory").value.trim();
    const rawVideoUrl = document.getElementById("pUrl").value.trim();
    const videoUrl = convertToEmbedUrl(rawVideoUrl);

    if(!title || !videoUrl){
      alert("Fill required fields");
      return;
    }

    try{
      await addDoc(collection(db,"podcast"),{
        title,
        category,
        videoUrl,
        createdAt: new Date()
      });

      alert("Podcast added");
      podcastForm.reset();
      loadPodcasts();

    }catch(err){
      console.error(err);
      alert(err.message);
    }

  });
}


// ================= LOAD PODCAST =================
async function loadPodcasts(){

  const container = document.getElementById("podcastContainer");
  if(!container) return;

  container.innerHTML = "Loading...";

  try{
    const q = query(collection(db,"podcast"), orderBy("createdAt","desc"));
    const snapshot = await getDocs(q);

    container.innerHTML = "";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;

      const videoId = extractYouTubeVideoId(data.videoUrl || "");
      const thumbnail = videoId
        ? `https://img.youtube.com/vi/${videoId}/0.jpg`
        : "";

      container.innerHTML += `
        <div class="video-card">
          ${thumbnail ? `<img src="${thumbnail}" onclick="window.open('${data.videoUrl}','_blank')" />` : ""}
          <p>${data.title}</p>
          <small>${data.category || ""}</small>
          <button onclick="deletePodcast('${id}')">Delete</button>
        </div>
      `;
    });

  }catch(err){
    console.error(err);
    container.innerHTML = "Error loading podcasts";
  }
}


// ================= DELETE PODCAST =================
window.deletePodcast = async function(id){

  if(!confirm("Delete this podcast?")) return;

  await deleteDoc(doc(db,"podcast",id));
  alert("Deleted");
  loadPodcasts();
};


// ================= LOAD BOOKINGS =================
async function loadBookings(){

  const container = document.getElementById("bookingList");
  if(!container) return;

  container.innerHTML = "Loading...";

  const snapshot = await getDocs(collection(db,"bookings"));
  container.innerHTML = "";

  snapshot.forEach(docSnap => {

    const data = docSnap.data();

    const div = document.createElement("div");
    div.className = "booking-card";

    div.innerHTML = `
      <p><b>👤 Name:</b> ${data.name || "N/A"}</p>
      <p><b>📧 Email:</b> ${data.email || "N/A"}</p>
      <p><b>📱 Phone:</b> ${data.phone || "N/A"}</p>

      <hr>

      <p><b>📘 Type:</b> ${data.type || "N/A"}</p>
      <p><b>📅 Date:</b> ${data.date || "N/A"}</p>
      <p><b>⏰ Time:</b> ${data.time || "N/A"}</p>
      <p><b>💰 Price:</b> ₹${data.price || 0}</p>

      <hr>

      <p><b>💳 Payment ID:</b> ${data.paymentId || "N/A"}</p>
      <p><b>🕒 Booked At:</b> ${
        data.createdAt?.seconds
          ? new Date(data.createdAt.seconds * 1000).toLocaleString()
          : "N/A"
      }</p>

      <div class="booking-actions">
        <button class="delete-booking-btn" onclick="deleteBooking('${docSnap.id}')">Delete</button>
      </div>
    `;

    container.appendChild(div);
  });

  if(snapshot.empty){
    container.innerHTML = "No bookings found";
  }
}


// ================= DELETE BOOKING =================
window.deleteBooking = async function(id){

  if(!confirm("Delete this booking?")) return;

  await deleteDoc(doc(db,"bookings",id));

  alert("Booking deleted");

  loadBookings();
  loadAdminData();
};