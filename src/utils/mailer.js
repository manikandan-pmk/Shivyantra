// src/utils/mailer.js
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // ❗ Must be false for port 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendMail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Shivyantra" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ Email sent to ${to} (Message ID: ${info.messageId})`);
    return info;
  } catch (err) {
    console.error("❌ Email send failed:");
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
    console.error("Error response:", err.response);
    throw new Error(`Failed to send email: ${err.message}`);
  }
};

module.exports = { sendMail };
