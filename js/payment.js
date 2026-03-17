import { db, auth } from "./firebase.js";

import {
doc,
getDoc,
setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= GET DATA =================
const params = new URLSearchParams(window.location.search);

const courseId = params.get("id");
let price = Number(params.get("price"));

document.getElementById("amount").innerText = "Amount: ₹ " + price;


// ================= APPLY COUPON =================
window.applyCoupon = async function(){

const code = document.getElementById("coupon").value;

const snap = await getDoc(doc(db,"coupons",code));

if(!snap.exists()){
alert("Invalid coupon");
return;
}

const discount = snap.data().discount;

price = price - (price * discount / 100);

document.getElementById("amount").innerText = "Amount: ₹ " + price;

};


// ================= RAZORPAY PAYMENT =================
window.payNow = function(){

const options = {

key: "rzp_live_SONJ2W1OZ1qVLZ", // your key

amount: price * 100,
currency: "INR",

name: "Design Tech VLSI",
description: "Course Purchase",

handler: async function(){

const user = auth.currentUser;

// 🔥 GET EXISTING DATA
const userRef = doc(db,"users",user.uid);
const snap = await getDoc(userRef);

let courses = [];

if(snap.exists()){
courses = snap.data().purchasedCourses || [];
}

// 🔥 ADD NEW COURSE
if(!courses.includes(courseId)){
courses.push(courseId);
}

// 🔥 SAVE BACK
await setDoc(userRef,{
purchasedCourses: courses
},{merge:true});

alert("Payment Successful 🎉");

// redirect
window.location.href = `course.html?id=${courseId}`;

}

};

const rzp = new Razorpay(options);
rzp.open();

};
