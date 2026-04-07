require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');

const { analyzeEmail } = require('./ai');
const { calculatePrices } = require('./pricing');
const { buildQuoteHTML } = require('./quoteBuilder');
const { sendQuoteEmail, sendApprovalNotification } = require('./mailer');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ──────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled so dashboard iframe works
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve the dashboard as static HTML
app.use(express.static(path.join(__dirname, '../public')));

// Multer for file uploads (Zapier sends image as multipart)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are accepted'));
  }
});

// Simple API key auth middleware
function requireAuth(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.apiKey;
  if (key && key === process.env.DASHBOARD_API_KEY) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ─── HEALTH CHECK ────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────────────────
// ZAPIER ENDPOINT
// Zapier sends: customer name, email, message body, and image attachment
// ─────────────────────────────────────────────────────────────────────────
app.post('/process-email', upload.single('image'), async (req, res) => {
  try {
    // Accept either multipart (with file) or JSON (with base64)
    const customerName  = req.body.customer_name  || req.body.customerName;
    const customerEmail = req.body.customer_email || req.body.customerEmail;
    const message       = req.body.message        || req.body.body || '';

    if (!customerName || !customerEmail) {
      return res.status(400).json({ error: 'customer_name and customer_email are required' });
    }

    // Get image — multipart file, base64, or URL (Zapier sends attachments as URLs)
    let imageBase64, imageMediaType;
    if (req.file) {
      imageBase64    = req.file.buffer.toString('base64');
      imageMediaType = req.file.mimetype;
    } else if (req.body.image_base64) {
      const raw = req.body.image_base64;
      if (raw.startsWith('data:')) {
        const [header, data] = raw.split(',');
        imageBase64    = data;
        imageMediaType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      } else {
        imageBase64    = raw;
        imageMediaType = req.body.image_media_type || 'image/jpeg';
      }
    } else if (req.body.image_url) {
      // Zapier sends attachments as URLs — fetch and convert to base64
      const imgRes = await fetch(req.body.image_url);
      if (!imgRes.ok) throw new Error('Failed to fetch image from URL: ' + imgRes.status);
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      imageMediaType = contentType.split(';')[0];
      const buffer = await imgRes.buffer();
      imageBase64 = buffer.toString('base64');
    } else {
      return res.status(400).json({ error: 'An image is required (multipart file, image_base64, or image_url)' });
    }

    // 1. AI analysis
    console.log(`[${new Date().toISOString()}] Processing quote for ${customerName} <${customerEmail}>`);
    const analysis = await analyzeEmail({ customerName, customerEmail, message, imageBase64, imageMediaType });
    console.log(`[AI] piece=${analysis.piece_type} finish=${analysis.finish_preference} detail=${analysis.detail_rating}`);

    // 2. Calculate prices
    const { option1, option2, description: priceDescription } = calculatePrices(
      analysis.piece_type,
      analysis.finish_preference,
      analysis.detail_rating
    );

    // 3. Get current pickup date from DB
    const pickupDate = db.getSetting('pickup_date');

    // 4. Build HTML quote
    const htmlQuote = buildQuoteHTML({
      customerName,
      customerEmail,
      pieceType:         analysis.piece_type,
      finishPreference:  analysis.finish_preference,
      openingParagraph:  analysis.opening_paragraph,
      processParagraph:  analysis.process_paragraph,
      option1,
      option2,
      priceDescription,
      pickupDate
    });

    // 5. Save to database
    const quoteId = db.createQuote({
      customer_name:    customerName,
      customer_email:   customerEmail,
      piece_type:       analysis.piece_type,
      finish:           analysis.finish_preference,
      detail_rating:    analysis.detail_rating,
      detail_reasoning: analysis.detail_reasoning,
      option1_label:    option1.label,
      option1_price:    option1.price,
      option2_label:    option2.label,
      option2_price:    option2.price,
      pickup_date:      pickupDate,
      html_quote:       htmlQuote
    });

    console.log(`[DB] Quote #${quoteId} saved — status: pending`);

    // 6. Notify yourself for approval
    const dashboardUrl = process.env.DASHBOARD_URL || `https://${process.env.FLY_APP_NAME}.fly.dev`;
    try {
      await sendApprovalNotification({ quoteId, customerName, customerEmail, pieceType: analysis.piece_type, dashboardUrl });
      console.log(`[MAIL] Approval notification sent for quote #${quoteId}`);
    } catch (mailErr) {
      console.error('[MAIL] Failed to send approval notification:', mailErr.message);
      // Non-fatal — quote is still saved
    }

    res.json({
      success: true,
      quote_id: quoteId,
      message: `Quote #${quoteId} generated and pending approval`,
      analysis: {
        piece_type:       analysis.piece_type,
        finish:           analysis.finish_preference,
        detail_rating:    analysis.detail_rating,
        detail_reasoning: analysis.detail_reasoning
      }
    });

  } catch (err) {
    console.error('[ERROR] /process-email:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// DASHBOARD API ROUTES (protected)
// ─────────────────────────────────────────────────────────────────────────

// GET all pending quotes
app.get('/api/quotes/pending', requireAuth, (req, res) => {
  res.json(db.getPendingQuotes());
});

// GET all quotes (history)
app.get('/api/quotes', requireAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(db.getAllQuotes(limit));
});

// GET single quote HTML (for preview iframe)
app.get('/api/quotes/:id/preview', requireAuth, (req, res) => {
  const quote = db.getQuote(parseInt(req.params.id));
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  res.setHeader('Content-Type', 'text/html');
  res.send(quote.html_quote);
});

// PATCH quote HTML (when you edit in dashboard)
app.patch('/api/quotes/:id/html', requireAuth, (req, res) => {
  const { html } = req.body;
  if (!html) return res.status(400).json({ error: 'html is required' });
  db.updateQuoteHtml(parseInt(req.params.id), html);
  res.json({ success: true });
});

// POST approve — sends the email
app.post('/api/quotes/:id/approve', requireAuth, async (req, res) => {
  try {
    const quote = db.getQuote(parseInt(req.params.id));
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (quote.status === 'sent') return res.status(400).json({ error: 'Quote already sent' });

    await sendQuoteEmail({
      toEmail:   quote.customer_email,
      toName:    quote.customer_name,
      pieceType: quote.piece_type,
      htmlBody:  quote.html_quote
    });

    db.updateQuoteStatus(quote.id, 'sent');
    console.log(`[MAIL] Quote #${quote.id} sent to ${quote.customer_email}`);
    res.json({ success: true, message: `Quote sent to ${quote.customer_email}` });

  } catch (err) {
    console.error('[ERROR] /approve:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST discard
app.post('/api/quotes/:id/discard', requireAuth, (req, res) => {
  const quote = db.getQuote(parseInt(req.params.id));
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  db.updateQuoteStatus(quote.id, 'discarded');
  res.json({ success: true });
});

// GET settings
app.get('/api/settings', requireAuth, (req, res) => {
  res.json({
    pickup_date: db.getSetting('pickup_date')
  });
});

// PUT settings
app.put('/api/settings', requireAuth, (req, res) => {
  const { pickup_date } = req.body;
  if (pickup_date) db.setSetting('pickup_date', pickup_date);
  res.json({ success: true, pickup_date: db.getSetting('pickup_date') });
});

// GET stats
app.get('/api/stats', requireAuth, (req, res) => {
  res.json(db.getStats());
});

// ─────────────────────────────────────────────────────────────────────────
// FALLBACK — serve dashboard for any non-API route
// ─────────────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─────────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ARK Furniture Quote Server running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
});
