const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  // In development without SMTP creds configured, log instead of throwing
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[emailService] SMTP not configured. Would send to ${to}: ${subject}`);
    return { simulated: true };
  }
  const info = await getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
  return info;
};

const templates = {
  verifyEmail: (name, link) => `
    <h2>Welcome, ${name}!</h2>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${link}">Verify Email</a>
  `,
  resetPassword: (name, link) => `
    <h2>Password Reset</h2>
    <p>Hi ${name}, click the link below to reset your password. This link expires in 30 minutes.</p>
    <a href="${link}">Reset Password</a>
  `,
  ticketConfirmation: (name, eventTitle, bookingNumber) => `
    <h2>Booking Confirmed!</h2>
    <p>Hi ${name}, your booking <strong>${bookingNumber}</strong> for <strong>${eventTitle}</strong> is confirmed.</p>
    <p>Your ticket with QR code is attached/available in your dashboard.</p>
  `,
};

module.exports = { sendEmail, templates };
