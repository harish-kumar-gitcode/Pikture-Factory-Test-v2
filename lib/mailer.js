import nodemailer from 'nodemailer';

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html }) {
  try {
    await getTransporter().sendMail({
      from: `"Pikture Factory" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Don't crash the request if email fails — just log it.
    console.error('Email send failed:', err.message);
  }
}

export function sendClientCredentialsEmail({ to, name, username, password }) {
  return sendMail({
    to,
    subject: 'Your Pikture Factory Project Access',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;">
        <h2 style="color:#111;">Welcome to Pikture Factory, ${name}!</h2>
        <p>Your project dashboard is ready. Use the credentials below to log in and track your shoot from booking to final delivery.</p>
        <div style="background:#F7F7F7;border-radius:10px;padding:16px;margin:20px 0;">
          <p><b>Username:</b> ${username}</p>
          <p><b>Password:</b> ${password}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login/client" style="background:#111;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;">Log In</a>
        <p style="margin-top:24px;color:#666;font-size:13px;">If you didn't expect this email, please contact us at ${process.env.EMAIL_USER}.</p>
      </div>`,
  });
}

export function sendVendorApprovalEmail({ to, name, username, password }) {
  return sendMail({
    to,
    subject: "You're approved! Welcome to Pikture Factory",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;">
        <h2 style="color:#C8A45D;">Congratulations, ${name}! 🎉</h2>
        <p>Your vendor profile has been approved. You're now part of the Pikture Factory network.</p>
        <div style="background:#F7F7F7;border-radius:10px;padding:16px;margin:20px 0;">
          <p><b>Username:</b> ${username}</p>
          <p><b>Password:</b> ${password}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login/vendor" style="background:#C8A45D;color:#111;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:600;">Log In to Vendor Panel</a>
      </div>`,
  });
}

export function sendVendorRejectionEmail({ to, name }) {
  return sendMail({
    to,
    subject: 'Update on your Pikture Factory application',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;">
        <h2 style="color:#111;">Hi ${name},</h2>
        <p>Thank you for applying to Pikture Factory. We've added your profile to our waitlist — we'll reach out as soon as a fit opens up in your category or location.</p>
      </div>`,
  });
}
