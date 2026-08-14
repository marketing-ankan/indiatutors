// Pricing engine data — ported from the live site (ITO_PP config on /plans-pricing/),
// then reconciled against the official "IN Plan and Pricing" PDF (Jul 2026):
// Java 850/1200/1500, AWS 900/900/1200, and ₹600 group rates for the academic
// and competitive-exam subjects listed on the PDF's group sheet.
// Rates are per-class, per level [Beginner, Intermediate, Advanced]; *G = group-class rates.
import RATES from '../../../database/data/rates.json';

export const PRICING = {
  "discount": "40",
  "currency": "INR",
  "gst": "18",
  "plans": [
    {
      "key": "monthly",
      "name": "Monthly Plan",
      "tag": "Starter",
      "badge": "STARTER",
      "best": "Trying the program",
      "months": 1,
      "mult": 4,
      "discount": 0,
      "featured": false,
      "accent": "#15803d",
      "note": "Entry-level foundation",
      "benefits": [
        [
          "4–5 Live Classes per Month",
          "1 hour/week | Music: 45 min"
        ],
        [
          "Homework Help Support",
          "Doubt clearing between classes"
        ],
        [
          "Access to Video Materials",
          "Available during active subscription"
        ],
        [
          "Basic Teacher Feedback",
          "Informal progress inputs"
        ],
        [
          "Digital Books Library",
          "Core learning resources included"
        ]
      ]
    },
    {
      "key": "quarterly",
      "name": "Quarterly Plan",
      "tag": "Best Seller",
      "badge": "BEST SELLER",
      "best": "Consistent progress",
      "months": 3,
      "mult": 12,
      "discount": 10,
      "featured": true,
      "accent": "#dc2626",
      "note": "Most popular choice",
      "benefits": [
        [
          "12 Live Classes (3 Months)",
          "Structured weekly learning"
        ],
        [
          "10% Plan Discount",
          "Better value vs monthly"
        ],
        [
          "Teacher Assessment Every Quarter",
          "Detailed progress report"
        ],
        [
          "Certificate of Completion",
          "After successful quarterly review"
        ],
        [
          "AI Progress Dashboard",
          "Track performance, attendance & growth"
        ]
      ]
    },
    {
      "key": "annual",
      "name": "Annual Plan",
      "tag": "Maximum Advantage",
      "badge": "SAVE 20%",
      "best": "High achievers",
      "months": 12,
      "mult": 48,
      "discount": 20,
      "featured": false,
      "accent": "#ea580c",
      "note": "Best value / flagship plan",
      "benefits": [
        [
          "48 Live Classes (12 Months)",
          "Complete yearly learning roadmap"
        ],
        [
          "Flat 20% Discount",
          "Maximum savings"
        ],
        [
          "Quarterly Teacher Assessments",
          "4× per year — continuous monitoring"
        ],
        [
          "Parent-Teacher Meetings (PTM)",
          "Scheduled academic reviews"
        ],
        [
          "Premium Priority Support",
          "Books, videos & homework help — all included"
        ]
      ]
    }
  ],
  "levels": [
    "Beginner",
    "Intermediate",
    "Advanced",
    "Professional"
  ],
  "regFee": {
    "INR": 750
  },
  // Rates come from database/data/rates.json so the PHP that prices an order
  // reads the same numbers this page quotes. They used to be able to disagree,
  // and did: a course advertised at 600 was billed at 300. Edit that file.
  "rates": RATES.rates,
};
