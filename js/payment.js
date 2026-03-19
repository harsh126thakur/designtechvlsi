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


// ================= PAYMENT =================
window.payNow = async function(){

const user = auth.currentUser;

if(!user){
alert("Please login first");
return;
}

// 🔐 STEP 1: CREATE ORDER
const res = await fetch("http://localhost:5000/create-order", {
method: "POST",
headers: {"Content-Type":"application/json"},
body: JSON.stringify({ amount: price })
});

const order = await res.json();


// 🔐 STEP 2: RAZORPAY
const options = {

key: "rzp_live_SONJ2W1OZ1qVLZ",
amount: order.amount,
currency: "INR",
name: "Design Tech VLSI",
description: type,
order_id: order.id,

handler: async function(response){

// 🔐 STEP 3: VERIFY PAYMENT
const verifyRes = await fetch("http://localhost:5000/verify-payment", {
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