const nodemailer = require('nodemailer');
const config = require('../config/config');

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error('❌ Email service unavailable:', err.message);
  } else {
    console.log('✅ Email service ready');
  }
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Ticketing Support" <${config.mail.from}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<\/?[^>]+(>|$)/g, ''), // Strip HTML tags for plain text
    });
    console.log(`✅ Email sent to ${to}:`, info.messageId);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return null;
  }
};

module.exports = { sendEmail };
