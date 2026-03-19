const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();

app.use(express.json());
app.use(cors());


// 🔐 RAZORPAY
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ================= CREATE ORDER =================
app.post("/create-order", async (req, res) => {

  const { amount } = req.body;

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: "receipt_" + Date.now()
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).send(err);
  }
});


// ================= EMAIL SETUP =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kspqa126@gmail.com",
    pass: "btolvqrfstnraabo"
  }
});


// ================= VERIFY PAYMENT =================
app.post("/verify-payment", async (req, res) => {

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    type,
    price,
    email
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", "eLDa13udpqxLNRCegHp3XIFt")
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {

    // 📩 SEND EMAIL
    await transporter.sendMail({
      from: "kspqa126@gmail.com",
      to: "kspqa126@gmail.com",
      subject: "New Payment Received 🚀",
      html: `
        <h2>Payment Successful</h2>
        <p><b>Type:</b> ${type}</p>
        <p><b>Price:</b> ₹${price}</p>
        <p><b>Payment ID:</b> ${razorpay_payment_id}</p>
        <p><b>User Email:</b> ${email}</p>
      `
    });

    res.json({ success: true });

  } else {
    res.status(400).json({ success: false });
  }

});


// ================= SERVER =================
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
