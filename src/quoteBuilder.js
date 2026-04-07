// Builds the branded ARK Furniture HTML quote email

function buildQuoteHTML({ customerName, customerEmail, pieceType, finishPreference, openingParagraph, processParagraph, option1, option2, option3, option4, priceDescription, pickupDate }) {

  const pickupDisplay = pickupDate ? formatDate(pickupDate) : 'Contact us to schedule';
  const subjectEncoded = encodeURIComponent(`${pieceType} Quote — ARK Furniture (${customerName})`);

  const isUnsure = finishPreference === 'unsure';
  const finishLabel = isUnsure
    ? 'All Options — Free Design Consultation Included'
    : finishPreference === 'stained' ? 'Stained Wood Finish' : 'Painted Finish';

  // Build price lines
  let priceLines = '';
  if (isUnsure) {
    priceLines = `
      <p style="margin:0 0 10px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:.05em;">Stained wood finish</p>
      <ul style="margin:0 0 14px 20px;line-height:1.9;">
        <li><strong>Resurfacing:</strong> $${option1.price.toLocaleString()} + HST</li>
        <li><strong>Restoration:</strong> $${option2.price.toLocaleString()} + HST</li>
      </ul>
      <p style="margin:0 0 10px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:.05em;">Painted finish</p>
      <ul style="margin:0 0 0 20px;line-height:1.9;">
        <li><strong>Basic Painting:</strong> $${option3.price.toLocaleString()} + HST</li>
        <li><strong>Premium Painting:</strong> $${option4.price.toLocaleString()} + HST</li>
      </ul>`;
  } else {
    priceLines = `
      <ul style="margin:0 0 0 20px;line-height:1.9;">
        <li><strong>${escapeHtml(option1.label)}:</strong> $${option1.price.toLocaleString()} + HST</li>
        <li style="margin-top:6px;"><strong>${escapeHtml(option2.label)}:</strong> $${option2.price.toLocaleString()} + HST</li>
      </ul>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>ARK Furniture — Quote for ${escapeHtml(customerName)}</title>
<style>
@media only screen and (max-width:640px){
  .container{width:100%!important;}
  .inner{padding:20px!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background:#000000;">
<div style="display:none;opacity:0;width:0;height:0;overflow:hidden;color:transparent;mso-hide:all;">
  Your ${escapeHtml(pieceType.toLowerCase())} refinishing quote from ARK Furniture.
</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#000000;">
<tr><td align="center">
<table role="presentation" width="600" class="container" cellspacing="0" cellpadding="0" style="max-width:100%;background:#FFFFFF;">

  <!-- HEADER -->
  <tr>
    <td align="center" style="padding:18px 24px;">
      <a href="https://arkfurniture.ca" target="_blank">
        <img src="https://cdn.shopify.com/s/files/1/0607/5491/9639/files/ARKLogo.png?v=1636138147"
             width="160" alt="ARK Furniture" style="display:block;border:0;background:#FFFFFF;">
      </a>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td class="inner" style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#1c1c1c;">

      <p style="margin:0 0 14px;">Hi ${escapeHtml(customerName)},</p>
      <p style="margin:0 0 14px;">${escapeHtml(openingParagraph)}</p>
      <p style="margin:0 0 14px;">${escapeHtml(processParagraph)}</p>

      <!-- QUOTE BOX -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;border:1px solid #eee;">
        <tr>
          <td style="padding:20px;background:#fafafa;font-size:15px;">
            <p style="margin:0 0 14px;"><strong>${escapeHtml(pieceType)} — ${escapeHtml(finishLabel)}</strong></p>
            ${priceLines}
            <p style="margin:14px 0 0 0;font-size:14px;color:#555;">${escapeHtml(priceDescription)}</p>
          </td>
        </tr>
      </table>

      <!-- BOOKING DETAILS -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eee;margin-bottom:24px;">
        <tr>
          <td style="padding:16px;background:#fafafa;font-size:15px;">
            <ul style="margin:0 0 0 20px;padding:0;line-height:1.7;">
              <li><strong>Next available pickup:</strong> ${escapeHtml(pickupDisplay)}</li>
              <li>Pickup &amp; delivery included</li>
              <li>Turnaround time: approximately <strong>1 month</strong></li>
              <li>50% deposit to reserve your booking</li>
              <li><strong>10% savings if paid in full upfront</strong></li>
              <li>Free design consultation included with every job</li>
            </ul>
          </td>
        </tr>
      </table>

      ${isUnsure
        ? `<p style="margin:0 0 14px;">Our complimentary design consultation will help you land on the perfect direction — colour, sheen, and finish style — so the result looks intentional and beautiful in your space.</p>`
        : `<p style="margin:0 0 14px;">If you'd like help choosing the final tone or colour, our complimentary design consultation is included with every job — we'll make sure the result complements your space perfectly.</p>`
      }

      <p style="margin:0 0 24px;">Let me know if you'd like to move forward and I'll take care of everything from there.</p>

    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td align="center" style="padding:0 28px 24px 28px;">
      <table role="presentation" cellspacing="0" cellpadding="0">
        <tr>
          <td style="background:#0b1f3a;border-radius:4px;">
            <a href="mailto:info@arkfurniture.ca?subject=${subjectEncoded}"
               style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;
                      font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;">
              Reply to Continue
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td align="center" style="padding:16px;font-size:12px;color:#777;font-family:Arial,Helvetica,sans-serif;">
      © ${new Date().getFullYear()} ARK Furniture. All rights reserved.
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function formatDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { buildQuoteHTML };
