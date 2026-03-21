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

const courseId = params.get("id") || "";
const rawPrice = Number(params.get("price")) || 0;
const type = decodeURIComponent(params.get("type") || "Course Purchase");
const date = params.get("date") || "";
const time = params.get("time") || "";

price = rawPrice;
originalPrice = rawPrice;

// ================= UI =================
const titleEl = document.getElementById("title");
const amountEl = document.getElementById("amount");
const nameEl = document.getElementById("name");
const phoneEl = document.getElementById("phone");
const couponEl = document.getElementById("coupon");

if (titleEl) {
  titleEl.innerText = type;
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

      if (nameEl && userData.name) {
        nameEl.value = userData.name;
      }

      if (phoneEl && userData.phone) {
        phoneEl.value = userData.phone;
      }
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
});

// ================= HELPERS =================
function updateAmountUI() {
  if (amountEl) {
    amountEl.innerText = `₹${price}`;
  }
}

function sanitizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function normalizePurchasedCourses(existingValue) {
  if (!existingValue) return {};

  if (Array.isArray(existingValue)) {
    const mapped = {};
    existingValue.forEach((id) => {
      mapped[id] = {
        purchasedAt: new Date().toISOString(),
        legacy: true
      };
    });
    return mapped;
  }

  if (typeof existingValue === "object") {
    return existingValue;
  }

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
    const discount = Number(couponData.discount || 0);
    const isActive = couponData.isActive !== false;

    if (!isActive) {
      alert("This coupon is inactive");
      return;
    }

    if (discount <= 0) {
      alert("Invalid coupon discount");
      return;
    }

    let discountedPrice = originalPrice - (originalPrice * discount / 100);

    if (discountedPrice < 10) {
      discountedPrice = 10;
    }

    price = Math.round(discountedPrice);
    couponApplied = true;
    selectedCouponCode = code;

    updateAmountUI();
    alert("Coupon applied successfully");
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

    if (!price || price < 1) {
      alert("Invalid payment amount");
      return;
    }

    // Wake server
    await fetch("https://razorpay-server-ok0j.onrender.com");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create order
    const orderResponse = await fetch("https://razorpay-server-ok0j.onrender.com/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount: price })
    });

    if (!orderResponse.ok) {
      throw new Error("Unable to create order");
    }

    const order = await orderResponse.json();

    if (!order?.id || !order?.amount) {
      throw new Error("Invalid order response");
    }

    const options = {
      key: "rzp_live_ST5Uj4sGNxUAGJ",
      amount: order.amount,
      currency: "INR",
      name: "Design Tech VLSI",
      description: type,
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

          // Save booking/payment record
          await addDoc(collection(db, "bookings"), {
            userId: currentUser.uid,
            name,
            phone,
            email: currentUser.email || "",
            type,
            date,
            time,
            price,
            originalPrice,
            couponCode: selectedCouponCode || "",
            courseId: courseId || "",
            paymentId: response.razorpay_payment_id || "",
            orderId: response.razorpay_order_id || "",
            signature: response.razorpay_signature || "",
            createdAt: serverTimestamp()
          });

          // Save user basic profile
          const mergedUserData = {
            name,
            phone,
            email: currentUser.email || userData.email || "",
            updatedAt: serverTimestamp()
          };

          // Save purchased course access if course payment
          if (courseId) {
            let validityMonths = 12;

            try {
              const courseRef = doc(db, "courses", courseId);
              const courseSnap = await getDoc(courseRef);

              if (courseSnap.exists()) {
                const courseData = courseSnap.data();
                validityMonths = Number(courseData.validityMonths || 12);
              }
            } catch (courseError) {
              console.error("Error loading course validity:", courseError);
            }

            purchasedCourses[courseId] = {
              purchasedAt: new Date().toISOString(),
              validTill: getValidityDateISO(validityMonths),
              pricePaid: price,
              couponCode: selectedCouponCode || "",
              paymentId: response.razorpay_payment_id || ""
            };

            mergedUserData.purchasedCourses = purchasedCourses;
          }

          await setDoc(userRef, mergedUserData, { merge: true });

          alert("Payment successful");
          window.location.href = "success.html";
        } catch (handlerError) {
          console.error("Post-payment error:", handlerError);
          alert("Payment was successful, but saving data failed. Please contact support.");
        }
      },
      modal: {
        ondismiss: function () {
          console.log("Payment popup closed");
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error("Payment error:", error);
    alert(getFriendlyErrorMessage(error));
    throw error;
  }
}