import { db, auth } from "./firebase.js";

import {
doc,
getDoc,
setDoc,
addDoc,
collection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ================= AUTH =================
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});


// ================= GET DATA =================
const params = new URLSearchParams(window.location.search);

const courseId = params.get("id");
let price = Number(params.get("price"));
const type = params.get("type") || "Course Purchase";
const date = params.get("date");
const time = params.get("time");

// UI
document.getElementById("amount").innerText = "Amount: ₹ " + price;
document.getElementById("title").innerText = type;


// ================= APPLY COUPON =================
export async function applyCoupon(){

const code = document.getElementById("coupon").value.toUpperCase();

if(!code){
alert("Enter coupon");
return;
}

try{

const snap = await getDoc(doc(db,"coupons",code));

if(!snap.exists()){
alert("Invalid coupon");
return;
}

const discount = snap.data().discount;

price = price - (price * discount / 100);

if(price < 10) price = 10;

price = Math.round(price);

document.getElementById("amount").innerText = "Amount: ₹ " + price;

alert("Coupon Applied ✅");

}catch(err){
console.error(err);
alert("Coupon error");
}

}


// ================= PAYMENT =================
export async function payNow(){

console.log("PAY CLICKED 🔥");

try{

if(!currentUser){
alert("Please login first");
return;
}

// 🔥 WAKE UP RENDER SERVER
console.log("Waking server...");
await fetch("https://razorpay-server-ok0j.onrender.com");

// ⏳ small delay (important)
await new Promise(resolve => setTimeout(resolve, 2000));


// ================= CREATE ORDER =================
const res = await fetch("https://razorpay-server-ok0j.onrender.com/create-order", {
method: "POST",
headers: {"Content-Type":"application/json"},
body: JSON.stringify({ amount: price })
});

if(!res.ok){
throw new Error("Server not responding");
}

const order = await res.json();

console.log("ORDER:", order);


// ================= RAZORPAY =================
const options = {

key: "rzp_live_ST5Uj4sGNxUAGJ",
amount: order.amount,
currency: "INR",
name: "Design Tech VLSI",
description: type,
order_id: order.id,

handler: async function(response){

try{

// ================= VERIFY =================
const verifyRes = await fetch("https://razorpay-server-ok0j.onrender.com/verify-payment", {
method: "POST",
headers: {"Content-Type":"application/json"},
body: JSON.stringify(response)
});

const data = await verifyRes.json();

if(!data.success){
alert("Payment verification failed ❌");
return;
}

alert("Payment Successful 🎉");


// ================= SAVE BOOKING =================
await addDoc(collection(db,"bookings"),{
userId: currentUser.uid,
email: currentUser.email,
type,
date,
time,
price,
paymentId: response.razorpay_payment_id,
createdAt: new Date()
});


// ================= SAVE COURSE =================
if(courseId){

const userRef = doc(db,"users",currentUser.uid);
const snap = await getDoc(userRef);

let courses = snap.exists() ? snap.data().purchasedCourses || [] : [];

if(!courses.includes(courseId)){
courses.push(courseId);
}

await setDoc(userRef,{ purchasedCourses: courses },{ merge:true });

}

window.location.href = "success.html";

}catch(err){
console.error("POST PAYMENT ERROR:", err);
alert("Error saving data");
}

}

};


// ================= OPEN RAZORPAY =================
const rzp = new Razorpay(options);
rzp.open();

}catch(err){
console.error("PAY ERROR:", err);
alert("Server waking up... please try again in 5 seconds");
}

}