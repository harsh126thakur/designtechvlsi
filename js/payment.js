import { db, auth } from "./firebase.js";

import {
doc,
getDoc,
setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= GET DATA =================
const params = new URLSearchParams(window.location.search);

const courseId = params.get("id");   // course OR mentorship
let price = Number(params.get("price"));
const type = params.get("type") || "Course Purchase";

document.getElementById("amount").innerText = "Amount: ₹ " + price;


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

// 🔥 APPLY DISCOUNT
price = price - (price * discount / 100);

// 🔥 FIX: prevent 0 or very low price
if(price < 10){
  price = 10;
}

// 🔥 ROUND VALUE
price = Math.round(price);

// UPDATE UI
document.getElementById("amount").innerText = "Amount: ₹ " + price;

alert("Coupon Applied ✅");

}catch(err){
  console.error(err);
  alert("Error applying coupon");
}

};


// ================= PAYMENT =================
window.payNow = async function(){

const user = auth.currentUser;

if(!user){
alert("Please login first");
return;
}

// DEBUG
console.log("FINAL PRICE:", price);

// 🔐 STEP 1: CREATE ORDER (RENDER URL)
const res = await fetch("https://designtechvlsi.onrender.com/create-order", {
method: "POST",
headers: {"Content-Type":"application/json"},
body: JSON.stringify({ amount: Math.round(price) })
});

const order = await res.json();


// 🔐 STEP 2: RAZORPAY
const options = {

key: "rzp_live_ST5Uj4sGNxUAGJ",
amount: order.amount,
currency: "INR",
name: "Design Tech VLSI",
description: type,
order_id: order.id,

handler: async function(response){

// 🔐 STEP 3: VERIFY PAYMENT
const verifyRes = await fetch("https://designtechvlsi.onrender.com/verify-payment", {
method: "POST",
headers: {"Content-Type":"application/json"},
body: JSON.stringify({
...response,
courseId: courseId,
userId: user.uid,
type: type,
price: price,
email: user.email
})
});

const data = await verifyRes.json();

if(data.success){

// ================= COURSE PURCHASE =================
if(courseId){

const userRef = doc(db,"users",user.uid);
const snap = await getDoc(userRef);

let courses = [];

if(snap.exists()){
courses = snap.data().purchasedCourses || [];
}

if(!courses.includes(courseId)){
courses.push(courseId);
}

await setDoc(userRef,{
purchasedCourses: courses
},{merge:true});

}

// ================= SUCCESS =================
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