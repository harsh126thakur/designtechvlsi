const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();

app.use(express.json());

// ✅ IMPORTANT: allow frontend requests
app.use(cors({
  origin: "*"
}));


// ================= ROOT CHECK =================
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});


// ================= RAZORPAY =================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ================= CREATE ORDER =================
app.post("/create-order", async (req, res) => {

  console.log("CREATE ORDER BODY:", req.body);

  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ error: "Amount missing" });
  }

  try {

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // ✅ FIX (avoid float issue)
      currency: "INR",
      receipt: "receipt_" + Date.now()
    });

    console.log("ORDER CREATED:", order);

    res.json(order);

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ================= EMAIL SETUP =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});


// ================= VERIFY PAYMENT =================
app.post("/verify-payment", async (req, res) => {

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      type,
      price,
      email,
      date,
      time
    } = req.body;

    console.log("VERIFY BODY:", req.body);

    // 🔐 SIGNATURE VERIFY
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // ================= SUCCESS =================
    if (expectedSignature === razorpay_signature) {

      console.log("✅ PAYMENT VERIFIED");

      // 📩 SEND EMAIL (non-blocking)
      transporter.sendMail({
        from: process.env.EMAIL,
        to: process.env.EMAIL,
        subject: "New Payment Received 🚀",
        html: `
          <h2>Payment Successful</h2>
          <p><b>Type:</b> ${type}</p>
          <p><b>Price:</b> ₹${price}</p>
          <p><b>Payment ID:</b> ${razorpay_payment_id}</p>
          <p><b>User Email:</b> ${email}</p>
          <p><b>Date:</b> ${date || "N/A"}</p>
          <p><b>Time:</b> ${time || "N/A"}</p>
        `
      }).catch(err => console.log("MAIL ERROR:", err));

      // ✅ VERY IMPORTANT: respond immediately
      return res.json({ success: true });

    } else {

      console.log("❌ SIGNATURE FAILED");

      return res.json({ success: false });
    }

  } catch (err) {

    console.error("VERIFY ERROR:", err);

    return res.status(500).json({ success: false });
  }

});


// ================= SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});