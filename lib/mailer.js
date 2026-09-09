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

export function sendVendorDriveLinksEmail({ to, vendorName, projectCode, eventType, eventDate, rawUrl, editedUrl }) {
  if (!to) return Promise.resolve();
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date TBD';
  return sendMail({
    to,
    subject: `Upload links ready — ${projectCode}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#171717;line-height:1.6;">
        <div style="padding:28px 0;border-bottom:1px solid #eee;"><h2 style="margin:0;color:#111;">Pikture <span style="color:#C8A45D;">Factory</span></h2></div>
        <div style="padding:28px 0;">
          <p>Hi ${vendorName || 'there'},</p>
          <p>The upload workspace for <b>${projectCode}</b> is ready. Please use the private links below to upload your files for the ${eventType || 'event'} on ${formattedDate}.</p>
          <p><a href="${rawUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;margin:5px 0;">Upload RAW Files</a></p>
          <p><a href="${editedUrl}" style="display:inline-block;background:#C8A45D;color:#111;padding:12px 18px;border-radius:8px;text-decoration:none;margin:5px 0;font-weight:600;">Upload EDITED Files</a></p>
          <p style="font-size:13px;color:#666;">Please keep the original file structure where possible. These links open the project's private upload folders.</p>
        </div>
      </div>`,
  });
}

export function sendVendorOnboardingRequestEmail({ vendor, preferredDate, preferredTime, notes }) {
  const adminTo = process.env.EMAIL_USER;
  if (!adminTo) return Promise.resolve();
  const date = new Date(preferredDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return sendMail({
    to: adminTo,
    subject: `Vendor onboarding request — ${vendor.vendorCode || vendor.businessName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#171717;line-height:1.6;">
        <h2 style="margin-bottom:4px;">New onboarding request</h2>
        <p style="color:#666;">A vendor has requested a guided onboarding call.</p>
        <div style="background:#F7F7F7;border-radius:12px;padding:18px;">
          <p><b>Vendor:</b> ${vendor.firstName || ''} ${vendor.lastName || ''}</p>
          <p><b>Business:</b> ${vendor.businessName || '—'}</p>
          <p><b>Code:</b> ${vendor.vendorCode || '—'}</p>
          <p><b>Phone:</b> ${vendor.phone || '—'}</p>
          <p><b>Preferred slot:</b> ${date} at ${preferredTime}</p>
          <p><b>Notes:</b> ${notes || '—'}</p>
        </div>
      </div>`,
  });
}
