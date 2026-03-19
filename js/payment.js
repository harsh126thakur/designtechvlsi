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

// UI SET
document.getElementById("amount").innerText = "Amount: ₹ " + price;
document.getElementById("title").innerText = type;


// ================= APPLY COUPON =================
window.applyCoupon = async function(){

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

};


// ================= PAYMENT (NO SERVER) =================
window.payNow = async function(){

try{

if(!currentUser){
alert("Please login first");
return;
}

// ✅ SAVE INTENT BEFORE PAYMENT (optional)
await addDoc(collection(db,"payments"),{
userId: currentUser.uid,
email: currentUser.email,
type,
price,
status: "initiated",
createdAt: new Date()
});

// ✅ REDIRECT TO RAZORPAY PAYMENT LINK
const paymentLink = "https://rzp.io/l/YOUR_PAYMENT_LINK";

window.location.href = paymentLink;

}catch(err){
console.error(err);
alert("Payment failed ❌");
}

};