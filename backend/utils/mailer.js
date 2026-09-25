const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // If no SMTP credentials provided, use Ethereal (logs to console in dev)
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your@gmail.com') {
    // Ethereal test account — emails show up in console
    transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false,
      auth:   { user: 'ethereal_test', pass: 'ethereal_test' },
    });
    console.log('[Mailer] ⚠  No SMTP configured — emails will be logged to console only');
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

/**
 * Send an email.
 * Falls back to console logging if SMTP is not configured.
 */
async function sendMail({ to, subject, text, html }) {
  const shopName  = process.env.SHOP_NAME  || 'Isa & Dagi Mobile Shop';
  const shopEmail = process.env.SHOP_EMAIL || 'noreply@isadagi.com';

  // Dev / no-config fallback — just log to console
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your@gmail.com') {
    console.log('\n══════════════════════════════════════════');
    console.log(`[EMAIL LOG] To: ${to}`);
    console.log(`[EMAIL LOG] Subject: ${subject}`);
    console.log('[EMAIL LOG] Body:');
    console.log(text || html);
    console.log('══════════════════════════════════════════\n');
    return { success: true, preview: null };
  }

  try {
    const info = await getTransporter().sendMail({
      from:    `"${shopName}" <${shopEmail}>`,
      to,
      subject,
      text,
      html: html || `<pre style="font-family:Arial,sans-serif;">${text}</pre>`,
    });
    console.log(`[Mailer] ✓ Email sent to ${to} — ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Mailer] ✗ Failed to send email:', err.message);
    return { success: false, error: err.message };
  }
}

// ── Pre-built email templates ──────────────────────────────────────────────

async function sendOrderConfirmation(order) {
  const itemsText = order.items
    .map(i => `  - ${i.itemName} x${i.quantity} @ $${i.itemPrice.toFixed(2)}`)
    .join('\n');

  const paymentLabels = { cod: 'Cash on Delivery', bank: 'Bank Transfer', telebirr: 'Telebirr', cbe: 'CBE Birr' };
  const payLabel = paymentLabels[order.paymentMethod] || order.paymentMethod.toUpperCase();

  const text =
    `Hi ${order.fullName},\n\n` +
    `Thank you for your order! We have received it and will contact you shortly.\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `ORDER SUMMARY — #${order._id}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${itemsText}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Total:       $${order.totalAmount.toFixed(2)}\n` +
    `Payment:     ${payLabel}\n` +
    `Delivery to: ${order.address}, ${order.city}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `We'll call you on ${order.phone} to confirm delivery.\n\n` +
    `Questions? Contact us:\n` +
    `  Phone: ${process.env.SHOP_PHONE || '+251 929 346 248'}\n` +
    `  Telegram: @isadagishop\n\n` +
    `— Isa & Dagi Mobile Shop\nMerkato, Samson Building, Addis Ababa`;

  return sendMail({ to: order.email, subject: `Order Confirmed #${order._id} — Isa & Dagi Mobile Shop`, text });
}

async function sendOrderCancellation(order) {
  const text =
    `Hi ${order.fullName},\n\n` +
    `Your order #${order._id} has been cancelled as requested.\n\n` +
    `If you did not request this or need help, please contact us:\n` +
    `  Phone: ${process.env.SHOP_PHONE || '+251 929 346 248'}\n` +
    `  Telegram: @isadagishop\n\n` +
    `— Isa & Dagi Mobile Shop`;

  return sendMail({ to: order.email, subject: `Order #${order._id} Cancelled — Isa & Dagi`, text });
}

async function sendPasswordReset(email, firstName, resetUrl) {
  const text =
    `Hi ${firstName},\n\n` +
    `You requested a password reset for your Isa & Dagi Mobile Shop account.\n\n` +
    `Click the link below to reset your password (valid for 1 hour):\n\n` +
    `${resetUrl}\n\n` +
    `If you did not request this, please ignore this email.\n\n` +
    `— Isa & Dagi Mobile Shop\nMerkato, Samson Building, Addis Ababa`;

  return sendMail({ to: email, subject: 'Password Reset — Isa & Dagi Mobile Shop', text });
}

module.exports = { sendMail, sendOrderConfirmation, sendOrderCancellation, sendPasswordReset };
