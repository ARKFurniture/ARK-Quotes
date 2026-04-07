const fetch = require('node-fetch');

const RESEND_API_URL = 'https://api.resend.com/emails';

async function sendEmail({ to, toName, subject, html, replyTo }) {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'ARK Furniture <info@arkfurniture.ca>',
      to: [`${toName} <${to}>`],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Resend error: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function sendQuoteEmail({ toEmail, toName, pieceType, htmlBody }) {
  return sendEmail({
    to: toEmail,
    toName,
    subject: `Your ${pieceType} Refinishing Quote — ARK Furniture`,
    html: htmlBody,
    replyTo: 'info@arkfurniture.ca'
  });
}

async function sendApprovalNotification({ quoteId, customerName, customerEmail, pieceType, dashboardUrl }) {
  return sendEmail({
    to: process.env.NOTIFY_EMAIL || 'info@arkfurniture.ca',
    toName: 'ARK Furniture',
    subject: `[ARK] New quote ready — ${customerName} (${pieceType})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;padding:24px;">
        <h2 style="margin:0 0 16px;color:#0b1f3a;">New quote ready for approval</h2>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:8px 0;color:#666;width:120px;">Customer</td><td><strong>${customerName}</strong> &lt;${customerEmail}&gt;</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Piece</td><td>${pieceType}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Quote ID</td><td>#${quoteId}</td></tr>
        </table>
        <div style="margin-top:24px;">
          <a href="${dashboardUrl}?highlight=${quoteId}"
             style="display:inline-block;background:#0b1f3a;color:#fff;padding:12px 24px;
                    text-decoration:none;border-radius:4px;font-weight:bold;">
            Review &amp; Approve Quote
          </a>
        </div>
        <p style="margin-top:16px;font-size:13px;color:#999;">
          Automated notification from your ARK Furniture quote system.
        </p>
      </div>
    `
  });
}

module.exports = { sendQuoteEmail, sendApprovalNotification };
