const fetch = require('node-fetch');

const SYSTEM_PROMPT = `You are a pricing assistant for ARK Furniture, a furniture refinishing and restoration company based in Oshawa, Ontario.

Your job: analyze a customer's email and furniture photo, then return a JSON object — no explanation, no markdown, no extra text. Just the raw JSON.

Return exactly this shape:
{
  "piece_type": string,
  "finish_preference": "stained" | "painted",
  "detail_rating": 1 | 2 | 3,
  "detail_reasoning": string,
  "opening_paragraph": string,
  "process_paragraph": string
}

PIECE TYPES — use exactly one of these:
Dining Chair, Sideboard, Dresser, Cabinet, Coffee Table, Bed Frame, Desk, Armoire, Hutch, Sidetable, Chest, Dining Table, Bookcase, Accent Chair

DETAIL RATING:
- 1 (×1.0): Small or simple piece, average size, clean lines, straightforward job
- 2 (×1.2): Medium complexity OR larger than average size
- 3 (×1.4): Large piece OR highly complex/detailed — a large flat MCM piece can be 3, and so can a small ornate piece. Size AND complexity both count.

FINISH PREFERENCE:
- "stained" → customer mentions: stained, natural wood, wood tone, wood look, stain, keep the wood
- "painted" → customer mentions: painted, colour, color, chalk paint, any specific paint colour
- If unclear, look at the piece in the photo — default to "stained" for solid wood pieces

opening_paragraph: 2 warm sentences personally addressing this specific piece — mention what you see (the wood, the style, the condition), and what the refinishing will achieve for them. Sound like a craftsperson who genuinely cares, not a salesperson.

process_paragraph: 1–2 sentences describing what the process involves for this specific piece and finish type. Be specific to what they asked for.

IMPORTANT: Respond with ONLY the JSON object. No preamble, no code fences, nothing else.`;

async function analyzeEmail({ customerName, customerEmail, message, imageBase64, imageMediaType }) {
  const content = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: imageMediaType || 'image/jpeg',
        data: imageBase64
      }
    },
    {
      type: 'text',
      text: `Customer name: ${customerName}
Customer email: ${customerEmail}
Customer message: "${message}"`
    }
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data.content.map(b => b.text || '').join('');
  const clean = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${clean}`);
  }
}

module.exports = { analyzeEmail };
