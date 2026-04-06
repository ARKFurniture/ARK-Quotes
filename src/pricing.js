// ARK Furniture — Pricing Data & Business Logic

const PRICING = {
  'Dining Chair':  { Restoration: 495,  Resurfacing: 195,  'Premium Refinishing': 350,  'Standard Refinishing': 195  },
  'Sideboard':     { Restoration: 1595, Resurfacing: 795,  'Premium Refinishing': 1395, 'Standard Refinishing': 795  },
  'Dresser':       { Restoration: 1595, Resurfacing: 795,  'Premium Refinishing': 1395, 'Standard Refinishing': 795  },
  'Cabinet':       { Restoration: 1495, Resurfacing: 695,  'Premium Refinishing': 1295, 'Standard Refinishing': 695  },
  'Coffee Table':  { Restoration: 995,  Resurfacing: 495,  'Premium Refinishing': 795,  'Standard Refinishing': 495  },
  'Bed Frame':     { Restoration: 1495, Resurfacing: 695,  'Premium Refinishing': 1295, 'Standard Refinishing': 695  },
  'Desk':          { Restoration: 1395, Resurfacing: 695,  'Premium Refinishing': 1195, 'Standard Refinishing': 695  },
  'Armoire':       { Restoration: 2495, Resurfacing: 1295, 'Premium Refinishing': 1995, 'Standard Refinishing': 1295 },
  'Hutch':         { Restoration: 2995, Resurfacing: 1495, 'Premium Refinishing': 2395, 'Standard Refinishing': 1495 },
  'Sidetable':     { Restoration: 495,  Resurfacing: 195,  'Premium Refinishing': 395,  'Standard Refinishing': 195  },
  'Chest':         { Restoration: 895,  Resurfacing: 395,  'Premium Refinishing': 695,  'Standard Refinishing': 395  },
  'Dining Table':  { Restoration: 1395, Resurfacing: 695,  'Premium Refinishing': 1195, 'Standard Refinishing': 695  },
  'Bookcase':      { Restoration: 1295, Resurfacing: 595,  'Premium Refinishing': 1095, 'Standard Refinishing': 595  },
  'Accent Chair':  { Restoration: 695,  Resurfacing: 295,  'Premium Refinishing': 595,  'Standard Refinishing': 295  },
};

const DETAIL_MULTIPLIERS = { 1: 1.0, 2: 1.2, 3: 1.4 };

// Given AI analysis, calculate the two prices to show
function calculatePrices(pieceType, finishPreference, detailRating) {
  const prices = PRICING[pieceType];
  if (!prices) throw new Error(`Unknown piece type: ${pieceType}`);

  const mult = DETAIL_MULTIPLIERS[detailRating] || 1.0;

  if (finishPreference === 'stained') {
    return {
      option1: { label: 'Resurfacing',  price: Math.round(prices['Resurfacing'] * mult)  },
      option2: { label: 'Restoration',  price: Math.round(prices['Restoration'] * mult)  },
      description: 'Resurfacing focuses on a clean sand-back and fresh stain to bring out the wood\'s natural tone. Restoration goes deeper — stripping back to raw wood, repairing any imperfections, and building up a full professional finish from scratch.'
    };
  } else {
    return {
      option1: { label: 'Standard Refinishing', price: Math.round(prices['Standard Refinishing'] * mult) },
      option2: { label: 'Premium Refinishing',  price: Math.round(prices['Premium Refinishing']  * mult) },
      description: 'Standard Refinishing delivers a clean, durable painted finish in your chosen colour. Premium Refinishing includes hand-applied techniques, specialty finishes, or added detail work for a truly custom result.'
    };
  }
}

module.exports = { PRICING, DETAIL_MULTIPLIERS, calculatePrices };
