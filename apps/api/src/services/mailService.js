const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (env.smtpConfigured) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });

    return transporter;
  }

  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true,
  });

  return transporter;
};

const sendOtpEmail = async ({ email, otp, username, purpose }) => {
  const mailer = getTransporter();
  const usingPreviewTransport = !env.smtpConfigured;
  const actionCopy =
    purpose === "password_reset" ? "reset your password" : "verify your email";

  if (usingPreviewTransport && env.nodeEnv === "production") {
    return {
      deliveryMode: "unconfigured",
      messageId: null,
      preview: null,
      devOtp: null,
    };
  }

  const info = await mailer.sendMail({
    from: env.smtp.from,
    to: email,
    subject: `TradeReplica OTP to ${actionCopy}`,
    text: `Hi ${username}, your TradeReplica OTP is ${otp}. It expires in ${env.otpExpiryMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px;">
        <h2 style="margin-top: 0; color: #f8fafc;">TradeReplica Security Code</h2>
        <p>Hi ${username},</p>
        <p>Use the OTP below to ${actionCopy}.</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 24px 0; color: #22c55e;">
          ${otp}
        </div>
        <p>This code will expire in ${env.otpExpiryMinutes} minutes.</p>
        <p style="color: #94a3b8;">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });

  const preview =
    info.message && Buffer.isBuffer(info.message)
      ? info.message.toString()
      : null;

  return {
    messageId: info.messageId,
    deliveryMode: usingPreviewTransport ? "preview" : "smtp",
    devOtp:
      usingPreviewTransport && env.nodeEnv !== "production" ? otp : null,
    preview,
  };
};

module.exports = {
  sendOtpEmail,
};
