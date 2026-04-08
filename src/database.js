const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/ark.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// ─── SCHEMA ──────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name    TEXT NOT NULL,
    customer_email   TEXT NOT NULL,
    piece_type       TEXT NOT NULL,
    finish           TEXT NOT NULL,
    detail_rating    INTEGER NOT NULL,
    detail_reasoning TEXT,
    option1_label    TEXT NOT NULL,
    option1_price    INTEGER NOT NULL,
    option2_label    TEXT NOT NULL,
    option2_price    INTEGER NOT NULL,
    option3_label    TEXT,
    option3_price    INTEGER,
    option4_label    TEXT,
    option4_price    INTEGER,
    pickup_date      TEXT,
    html_quote       TEXT NOT NULL,
    image_base64     TEXT,
    image_media_type TEXT,
    original_message TEXT,
    status           TEXT NOT NULL DEFAULT 'pending',
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    sent_at          TEXT,
    phone            TEXT,
    description      TEXT,
    furniture_pieces TEXT
  );
  -- Add columns to existing databases that predate this schema
  PRAGMA table_info(quotes);
`);

// Migrate existing databases — add columns if they don't exist
const existingCols = db.prepare("PRAGMA table_info(quotes)").all().map(c => c.name);
const newCols = [
  ['option3_label',    'TEXT'],
  ['option3_price',    'INTEGER'],
  ['option4_label',    'TEXT'],
  ['option4_price',    'INTEGER'],
  ['image_base64',     'TEXT'],
  ['image_media_type', 'TEXT'],
  ['original_message', 'TEXT'],
  ['phone',            'TEXT'],
  ['description',      'TEXT'],
  ['furniture_pieces', 'TEXT'],
];
for (const [col, type] of newCols) {
  if (!existingCols.includes(col)) {
    db.exec(`ALTER TABLE quotes ADD COLUMN ${col} ${type}`);
  }
}

// Seed default settings
const existingPickup = db.prepare("SELECT value FROM settings WHERE key = 'pickup_date'").get();
if (!existingPickup) {
  // Default to next Saturday
  const today = new Date();
  const daysUntilSat = (6 - today.getDay() + 7) % 7 || 7;
  const nextSat = new Date(today);
  nextSat.setDate(today.getDate() + daysUntilSat);
  db.prepare("INSERT INTO settings (key, value) VALUES ('pickup_date', ?)").run(
    nextSat.toISOString().split('T')[0]
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────
function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

function createQuote(data) {
  const stmt = db.prepare(`
    INSERT INTO quotes
      (customer_name, customer_email, piece_type, finish, detail_rating, detail_reasoning,
       option1_label, option1_price, option2_label, option2_price,
       option3_label, option3_price, option4_label, option4_price,
       pickup_date, html_quote, image_base64, image_media_type, original_message,
       phone, description, furniture_pieces, status)
    VALUES
      (@customer_name, @customer_email, @piece_type, @finish, @detail_rating, @detail_reasoning,
       @option1_label, @option1_price, @option2_label, @option2_price,
       @option3_label, @option3_price, @option4_label, @option4_price,
       @pickup_date, @html_quote, @image_base64, @image_media_type, @original_message,
       @phone, @description, @furniture_pieces, 'pending')
  `);
  const result = stmt.run(data);
  return result.lastInsertRowid;
}

function getQuote(id) {
  return db.prepare('SELECT * FROM quotes WHERE id = ?').get(id);
}

function getPendingQuotes() {
  return db.prepare("SELECT * FROM quotes WHERE status = 'pending' ORDER BY created_at DESC").all();
}

function getAllQuotes(limit = 50) {
  return db.prepare('SELECT * FROM quotes ORDER BY created_at DESC LIMIT ?').all(limit);
}

function updateQuoteStatus(id, status) {
  const sentAt = status === 'sent' ? new Date().toISOString() : null;
  db.prepare('UPDATE quotes SET status = ?, sent_at = ? WHERE id = ?').run(status, sentAt, id);
}

function updateQuoteHtml(id, html) {
  db.prepare('UPDATE quotes SET html_quote = ? WHERE id = ?').run(html, id);
}

function getStats() {
  const total   = db.prepare('SELECT COUNT(*) as n FROM quotes').get().n;
  const sent    = db.prepare("SELECT COUNT(*) as n FROM quotes WHERE status = 'sent'").get().n;
  const pending = db.prepare("SELECT COUNT(*) as n FROM quotes WHERE status = 'pending'").get().n;
  return { total, sent, pending };
}

module.exports = {
  db, getSetting, setSetting,
  createQuote, getQuote, getPendingQuotes, getAllQuotes,
  updateQuoteStatus, updateQuoteHtml, getStats
};
