// ARK Furniture — Pricing Data & Business Logic

const PRICING = {
  'Dining Chair':  { Restoration: 495,  Resurfacing: 195,  'Premium Painting': 350,  'Basic Painting': 195  },
  'Sideboard':     { Restoration: 1595, Resurfacing: 795,  'Premium Painting': 1395, 'Basic Painting': 795  },
  'Dresser':       { Restoration: 1595, Resurfacing: 795,  'Premium Painting': 1395, 'Basic Painting': 795  },
  'Cabinet':       { Restoration: 1495, Resurfacing: 695,  'Premium Painting': 1295, 'Basic Painting': 695  },
  'Coffee Table':  { Restoration: 995,  Resurfacing: 495,  'Premium Painting': 795,  'Basic Painting': 495  },
  'Bed Frame':     { Restoration: 1495, Resurfacing: 695,  'Premium Painting': 1295, 'Basic Painting': 695  },
  'Desk':          { Restoration: 1395, Resurfacing: 695,  'Premium Painting': 1195, 'Basic Painting': 695  },
  'Armoire':       { Restoration: 2495, Resurfacing: 1295, 'Premium Painting': 1995, 'Basic Painting': 1295 },
  'Hutch':         { Restoration: 2995, Resurfacing: 1495, 'Premium Painting': 2395, 'Basic Painting': 1495 },
  'Sidetable':     { Restoration: 495,  Resurfacing: 195,  'Premium Painting': 395,  'Basic Painting': 195  },
  'Chest':         { Restoration: 895,  Resurfacing: 395,  'Premium Painting': 695,  'Basic Painting': 395  },
  'Dining Table':  { Restoration: 1395, Resurfacing: 695,  'Premium Painting': 1195, 'Basic Painting': 695  },
  'Bookcase':      { Restoration: 1295, Resurfacing: 595,  'Premium Painting': 1095, 'Basic Painting': 595  },
  'Accent Chair':  { Restoration: 695,  Resurfacing: 295,  'Premium Painting': 595,  'Basic Painting': 295  },
};

const DETAIL_MULTIPLIERS = { 1: 1.0, 2: 1.2, 3: 1.4 };

// Round to nearest x95 (e.g. 1113 -> 1095, 1552 -> 1595, 234 -> 295)
function roundToX95(value) {
  const lower = Math.floor(value / 100) * 100 - 5;  // e.g. 1095
  const upper = lower + 100;                          // e.g. 1195
  // Pick whichever x95 is closest
  const result = (value - lower <= upper - value) ? lower : upper;
  // Make sure we never go below 95
  return Math.max(95, result);
}

function calculatePrices(pieceType, finishPreference, detailRating) {
  const prices = PRICING[pieceType];
  if (!prices) throw new Error(`Unknown piece type: ${pieceType}`);
  const mult = DETAIL_MULTIPLIERS[detailRating] || 1.0;

  if (finishPreference === 'stained') {
    return {
      option1: { label: 'Resurfacing', price: roundToX95(prices['Resurfacing'] * mult) },
      option2: { label: 'Restoration', price: roundToX95(prices['Restoration'] * mult) },
      description: 'Resurfacing touches up blemishes and applies a clear coat over the existing finish — ideal if you want to keep the existing colour and dramatically improve appearance and durability without the cost of a full restoration. Restoration takes the piece back to raw wood, develops the final colour, and applies our Italian professional furniture-grade finish for maximum durability and a like-new result.'
    };
  } else if (finishPreference === 'painted') {
    return {
      option1: { label: 'Basic Painting', price: roundToX95(prices['Basic Painting'] * mult) },
      option2: { label: 'Premium Painting', price: roundToX95(prices['Premium Painting'] * mult) },
      description: 'Basic Painting is a budget-friendly painted finish with less intensive prep work — a great option for the right piece. Premium Painting includes professional prep, a tannin and dye-blocking sealer, a building primer, and our high-end 3-coat Italian painting system, resulting in a smooth, hard-wearing finish with heat, chemical, and metal mark resistance.'
    };
  } else {
    // unsure — return all 4 options
    return {
      option1: { label: 'Resurfacing',     price: Math.round(prices['Resurfacing']     * mult) },
      option2: { label: 'Restoration',     price: Math.round(prices['Restoration']     * mult) },
      option3: { label: 'Basic Painting',  price: Math.round(prices['Basic Painting']  * mult) },
      option4: { label: 'Premium Painting',price: Math.round(prices['Premium Painting']* mult) },
      description: 'Not sure which direction is right for you? No problem — our free design consultation will guide you through the options so the final result complements your space perfectly. Here are all of our service options so you can see the full range.'
    };
  }
}

module.exports = { PRICING, DETAIL_MULTIPLIERS, calculatePrices };
