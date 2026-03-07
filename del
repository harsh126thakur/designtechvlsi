async function register(){

let email = document.getElementById("email").value;
let password = document.getElementById("password").value;
let couponCode = document.getElementById("coupon").value;

try{

let userCredential = await firebase.auth().createUserWithEmailAndPassword(email,password);

let uid = userCredential.user.uid;

await db.collection("users").doc(uid).set({

email:email,

course1:false,
course2:false,
course3:false,
course4:false,
course5:false,
mentorship:false

});

if(couponCode !== ""){

await applyCoupon(couponCode,uid);

}

alert("Registration Successful");

window.location="dashboard.html";

}catch(error){

alert(error.message);

}

}

async function applyCoupon(code,uid){

let couponDoc = await db.collection("coupons").doc(code).get();

if(!couponDoc.exists){

alert("Invalid Coupon");

return;

}

let data = couponDoc.data();

if(!data.active){

alert("Coupon Disabled");

return;

}

let today = new Date();

let expiry = new Date(data.expiry);

if(today > expiry){

alert("Coupon Expired");

return;

}

if(data.usedCount >= data.maxUses){

alert("Coupon Limit Reached");

return;

}

await db.collection("coupons").doc(code).update({

usedCount: firebase.firestore.FieldValue.increment(1)

});

await db.collection("users").doc(uid).update({

course1:true,
course2:true,
course3:true,
course4:true,
course5:true,
mentorship:true

});

alert("Coupon Applied Successfully");

}
