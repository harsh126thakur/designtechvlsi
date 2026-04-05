import { db, auth } from "./firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ================= AUTH =================
let currentUser = null;
let price = 0;
let originalPrice = 0;
let couponApplied = false;
let selectedCouponCode = "";

// ================= PARAMS =================
const params = new URLSearchParams(window.location.search);

// ✅ FIXED (no duplicate)
const courseId = params.get("id") || "";
const type = decodeURIComponent(params.get("type") || "");
const date = params.get("date") || "";
const time = params.get("time") || "";

//ADDED (price is optional, backend will calculate)
const frontendPrice = parseInt(params.get("price")) || 0;

price = frontendPrice;
originalPrice = frontendPrice;

// ================= UI =================
const titleEl = document.getElementById("title");
const amountEl = document.getElementById("amount");
const nameEl = document.getElementById("name");
const phoneEl = document.getElementById("phone");
const couponEl = document.getElementById("coupon");

if (titleEl) {
  titleEl.innerText = type || "Course Purchase";
}
updateAmountUI();
// ================= AUTH STATE =================
onAuthStateChanged(auth, async (user) => {
  currentUser = user || null;

  if (!currentUser) return;

  try {
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();

      if (nameEl && userData.name) nameEl.value = userData.name;
      if (phoneEl && userData.phone) phoneEl.value = userData.phone;
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
});

// ================= HELPERS =================
function updateAmountUI() {
  if (amountEl) {
    amountEl.innerText = `₹${price || 0}`;
  }
}

function sanitizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function normalizePurchasedCourses(existingValue) {
  if (!existingValue) return {};
  if (typeof existingValue === "object") return existingValue;
  return {};
}

function getValidityDateISO(months = 12) {
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + Number(months || 12));
  return expiry.toISOString();
}

function getFriendlyErrorMessage(error) {
  const message = error?.message || "";
  if (message.includes("Failed to fetch")) {
    return "Unable to connect to payment server. Please try again.";
  }
  return "Payment failed. Please try again.";
}

// ================= APPLY COUPON =================
export async function applyCoupon() {
  const code = (couponEl?.value || "").trim().toUpperCase();

  if (!code) {
    alert("Please enter coupon code");
    return;
  }

  if (couponApplied && selectedCouponCode === code) {
    alert("This coupon is already applied");
    return;
  }

  try {
    const couponRef = doc(db, "coupons", code);
    const snap = await getDoc(couponRef);

    if (!snap.exists()) {
      alert("Invalid coupon");
      return;
    }

    const couponData = snap.data();

    if (couponData.isActive === false) {
      alert("This coupon is inactive");
      return;
    }

    couponApplied = true;
    selectedCouponCode = code;

   alert("Coupon applied successfully");

async function refreshPriceFromBackend() {
  try {
    const response = await fetch("https://razorpay-server-ok0j.onrender.com/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        courseId: courseId || null,
        type: type || null,
        couponCode: selectedCouponCode || ""
      })
    });

    if (!response.ok) return;

    const data = await response.json();

    if (!data?.amount) return;

    // 🔥 UPDATE PRICE FROM BACKEND
    price = data.amount / 100;

    updateAmountUI();

  } catch (err) {
    console.error("Coupon price update error:", err);
  }
}
// 🔥 ADD THIS LINE
await refreshPriceFromBackend();
  } catch (error) {
    console.error("Coupon error:", error);
    alert("Error applying coupon");
  }
}

// ================= PAYMENT =================
export async function payNow() {
  try {
    const name = (nameEl?.value || "").trim();
    const phone = sanitizePhone(phoneEl?.value || "");

    if (!name || !phone) {
      alert("Please enter name and phone number");
      return;
    }

    if (phone.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }

    if (!currentUser) {
      alert("Please login first");
      window.location.href = "login.html";
      return;
    }

    // ✅ FIXED (support both)
    if (!courseId && !type) {
      alert("Invalid request");
      return;
    }

    updateAmountUI();

    // Wake server
    await fetch("https://razorpay-server-ok0j.onrender.com");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // ✅ FIXED (send both)
    const orderResponse = await fetch("https://razorpay-server-ok0j.onrender.com/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        courseId: courseId || null,
        type: type || null,
        couponCode: selectedCouponCode || ""
      })
    });

    if (!orderResponse.ok) {
      throw new Error("Unable to create order");
    }

    const order = await orderResponse.json();

    if (!order?.id || !order?.amount) {
      throw new Error("Invalid order response");
    }

    // ✅ TRUST BACKEND
    price = order.amount / 100;
    originalPrice = price;
    updateAmountUI();

    const options = {
      key: "rzp_live_ST5Uj4sGNxUAGJ",
      amount: order.amount,
      currency: "INR",
      name: "Design Tech VLSI",
      description: type || "Course Purchase",
      order_id: order.id,
      prefill: {
        name,
        email: currentUser.email || "",
        contact: phone
      },
      theme: {
        color: "#38bdf8"
      },

      handler: async function (response) {
        try {
          const verifyResponse = await fetch("https://razorpay-server-ok0j.onrender.com/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(response)
          });

          const verifyData = await verifyResponse.json();

          if (!verifyData.success) {
            alert("Payment verification failed");
            return;
          }

          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};

          const purchasedCourses = normalizePurchasedCourses(userData.purchasedCourses);

          await addDoc(collection(db, "bookings"), {
            userId: currentUser.uid,
            name,
            phone,
            email: currentUser.email || "",
            type,
            date,
            time,
            price: order.amount / 100,
            originalPrice: order.amount / 100,
            couponCode: selectedCouponCode || "",
            courseId: courseId || "",
            paymentId: response.razorpay_payment_id || "",
            orderId: response.razorpay_order_id || "",
            signature: response.razorpay_signature || "",
            createdAt: serverTimestamp()
          });

          // Course purchase logic (unchanged)
          if (courseId) {
            let validityMonths = 12;

            try {
              const courseRef = doc(db, "courses", courseId);
              const courseSnap = await getDoc(courseRef);

              if (courseSnap.exists()) {
                validityMonths = Number(courseSnap.data().validityMonths || 12);
              }
            } catch {}

            purchasedCourses[courseId] = {
              purchasedAt: new Date().toISOString(),
              validTill: getValidityDateISO(validityMonths),
              pricePaid: order.amount / 100,
              couponCode: selectedCouponCode || "",
              paymentId: response.razorpay_payment_id || ""
            };
          }

          await setDoc(userRef, { purchasedCourses }, { merge: true });

          alert("Payment successful");
          window.location.href = "success.html";

        } catch (err) {
          console.error(err);
          alert("Payment save failed. Contact support.");
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();

  } catch (error) {
    console.error("Payment error:", error);
    alert(getFriendlyErrorMessage(error));
  }
}