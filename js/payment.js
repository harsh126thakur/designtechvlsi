import { db, auth } from "./firebase.js";

import {
doc,
getDoc,
setDoc,
addDoc,
collection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= GET DATA =================
const params = new URLSearchParams(window.location.search);

const courseId = params.get("id");
let price = Number(params.get("price"));
const type = params.get("type") || "Course Purchase";

// 🔥 SLOT DATA
const date = params.get("date");
const time = params.get("time");

document.getElementById("amount").innerText = "Amount: ₹ " + price;


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

// 🔥 FIX PRICE
if(price < 10){
price = 10;
}

price = Math.round(price);

document.getElementById("amount").innerText = "Amount: ₹ " + price;

alert("Coupon Applied ✅");
};


// ================= PAYMENT =================
window.payNow = async function(){

const user = auth.currentUser;

if(!user){
alert("Please login first");
return;
}

// 🔐 CREATE ORDER
const res = await fetch("https://designtechvlsi.onrender.com/create-order", {
method: "POST",
headers: {"Content-Type":"application/json"},
body: JSON.stringify({ amount: price })
});

const order = await res.json();


// 🔐 RAZORPAY
const options = {

key: "rzp_live_SONJ2W1OZ1qVLZ",
amount: order.amount,
currency: "INR",
name: "Design Tech VLSI",
description: type,
order_id: order.id,

handler: async function(response){

// 🔐 VERIFY PAYMENT
const verifyRes = await fetch("https://designtechvlsi.onrender.com/verify-payment", {
method: "POST",
headers: {"Content-Type":"application/json"},
body: JSON.stringify({
...response,
courseId,
userId: user.uid,
type,
price,
email: user.email,
date,
time
})
});

const data = await verifyRes.json();

if(data.success){

// ================= SAVE BOOKING =================
if(date && time){

await addDoc(collection(db,"bookings"),{
userId: user.uid,
email: user.email,
type: type,
date: date,
time: time,
price: price,
paymentId: response.razorpay_payment_id,
createdAt: new Date()
});

}

// ================= COURSE PURCHASE =================
if(courseId){

const userRef = doc(db,"users",user.uid);
const snap = await getDoc(userRef);

let courses = snap.exists() ? snap.data().purchasedCourses || [] : [];

if(!courses.includes(courseId)){
courses.push(courseId);
}

await setDoc(userRef,{ purchasedCourses: courses },{ merge:true });

}

alert("Payment Verified ✅");

window.location.href = "success.html";

}else{
alert("Payment verification failed ❌");
}

}

};

const rzp = new Razorpay(options);
rzp.open();

};