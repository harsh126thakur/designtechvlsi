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

console.log("TYPE:", type);
console.log("DATE:", date);
console.log("TIME:", time);

document.getElementById("amount").innerText = "Amount: ₹ " + price;
document.getElementById("title").innerText = type;


// ================= APPLY COUPON =================
window.applyCoupon = async function(){

const code = document.getElementById("coupon").value.toUpperCase();

if(!code){
alert("Enter coupon");
return;
}

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
};


// ================= PAYMENT =================
window.payNow = async function(){

if(!currentUser){
alert("Please login first");
return;
}

console.log("USER:", currentUser.email);

// CREATE ORDER
const res = await fetch("https://designtechvlsi.onrender.com/create-order", {
method: "POST",
headers: {"Content-Type":"application/json"},
body: JSON.stringify({ amount: price })
});

const order = await res.json();

console.log("ORDER:", order);


// RAZORPAY
const options = {

key: "rzp_live_SONJ2W1OZ1qVLZ",
amount: order.amount,
currency: "INR",
name: "Design Tech VLSI",
description: type,
order_id: order.id,

handler: async function(response){

console.log("PAYMENT:", response);

// VERIFY
const verifyRes = await fetch("https://designtechvlsi.onrender.com/verify-payment", {
method: "POST",
headers: {"Content-Type":"application/json"},
body: JSON.stringify({
...response,
courseId,
userId: currentUser.uid,
type,
price,
email: currentUser.email,
date,
time
})
});

const data = await verifyRes.json();

console.log("VERIFY:", data);


// ================= SUCCESS =================
if(data.success){

console.log("Saving booking...");

// SAVE BOOKING
await addDoc(collection(db,"bookings"),{
  userId: currentUser.uid,
  email: currentUser.email,
  type: type,
  date: date || "Not Selected",
  time: time || "Not Selected",
  price: Number(price),
  paymentId: response.razorpay_payment_id,
  createdAt: new Date()
});

console.log("BOOKING SAVED");

// COURSE PURCHASE
if(courseId){

const userRef = doc(db,"users",currentUser.uid);
const snap = await getDoc(userRef);

let courses = snap.exists() ? snap.data().purchasedCourses || [] : [];

if(!courses.includes(courseId)){
courses.push(courseId);
}

await setDoc(userRef,{ purchasedCourses: courses },{ merge:true });

}

alert("Payment Successful 🎉");

window.location.href = "success.html";

}else{

console.log("Verification failed");

alert("Payment verification failed ❌");

}

}

};

const rzp = new Razorpay(options);
rzp.open();

};