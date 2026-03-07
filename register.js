async function register(){

let name = document.getElementById("name").value;
let email = document.getElementById("email").value;
let password = document.getElementById("password").value;
let coupon = document.getElementById("coupon").value;

let courseAccess = false;
let couponUsed = null;

if(coupon !== ""){

let couponDoc = await db.collection("coupons").doc(coupon).get();

if(couponDoc.exists){

let data = couponDoc.data();

let today = new Date();
let expiry = new Date(data.expiry);

if(data.active && today <= expiry && data.usedCount < data.maxUses){

courseAccess = true;
couponUsed = coupon;

await db.collection("coupons").doc(coupon).update({
usedCount: firebase.firestore.FieldValue.increment(1)
});

}else{

alert("Coupon expired or usage limit reached");
return;

}

}else{

alert("Invalid Coupon Code");
return;

}

}

firebase.auth().createUserWithEmailAndPassword(email,password)
.then(async (userCredential)=>{

let uid = userCredential.user.uid;

await db.collection("students").doc(uid).set({

name:name,
email:email,
courseAccess:courseAccess,
couponUsed:couponUsed

});

alert("Registration Successful");

window.location="dashboard.html";

})
.catch((error)=>{

alert(error.message);

});

}
