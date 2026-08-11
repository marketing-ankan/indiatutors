// Pricing engine data — ported from the live site (ITO_PP config on /plans-pricing/),
// then reconciled against the official "IN Plan and Pricing" PDF (Jul 2026):
// Java 850/1200/1500, AWS 900/900/1200, and ₹600 group rates for the academic
// and competitive-exam subjects listed on the PDF's group sheet.
// Rates are per-class, per level [Beginner, Intermediate, Advanced]; *G = group-class rates.
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
  "rates": [
    {
      "name": "Piano",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "inrG": null
    },
    {
      "name": "Guitar",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "inrG": null
    },
    {
      "name": "Ukulele",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "inrG": null
    },
    {
      "name": "Keyboard",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "inrG": null
    },
    {
      "name": "Drums",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "inrG": null
    },
    {
      "name": "Violin",
      "cat": "Musical Instruments",
      "inr": [
        1000,
        1500,
        2000
      ],
      "inrG": null
    },
    {
      "name": "Veena",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "inrG": null
    },
    {
      "name": "Cello",
      "cat": "Musical Instruments",
      "inr": [
        1500,
        2000,
        2500
      ],
      "inrG": null
    },
    {
      "name": "Viola",
      "cat": "Musical Instruments",
      "inr": [
        1000,
        1500,
        2000
      ],
      "inrG": null
    },
    {
      "name": "Clarinet",
      "cat": "Musical Instruments",
      "inr": [
        1500,
        2000,
        2500
      ],
      "inrG": null
    },
    {
      "name": "Tabla",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "inrG": null
    },
    {
      "name": "Indian Flute",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "inrG": null
    },
    {
      "name": "Western Flute",
      "cat": "Musical Instruments",
      "inr": [
        1000,
        1500,
        2000
      ],
      "inrG": null
    },
    {
      "name": "Saxophone",
      "cat": "Musical Instruments",
      "inr": [
        1000,
        1500,
        2000
      ],
      "inrG": null
    },
    {
      "name": "Music Theory",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "inrG": null
    },
    {
      "name": "Trumpet",
      "cat": "Musical Instruments",
      "inr": [
        1500,
        2000,
        2500
      ],
      "inrG": null
    },
    {
      "name": "Sitar",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "inrG": null
    },
    {
      "name": "Recorder",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "inrG": null
    },
    {
      "name": "Carnatic Violin",
      "cat": "Musical Instruments",
      "inr": [
        1000,
        1500,
        2000
      ],
      "inrG": null
    },
    {
      "name": "Carnatic Vocal Music",
      "cat": "Vocal Music",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": null
    },
    {
      "name": "Hindustani Vocal Music",
      "cat": "Vocal Music",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": null
    },
    {
      "name": "Western Vocal Music",
      "cat": "Vocal Music",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": null
    },
    {
      "name": "Scratch",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Blockly",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Roblox & Minecraft",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Python",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Java",
      "cat": "IT Technologies",
      "inr": [
        850,
        1200,
        1500
      ],
      "inrG": [
        425,
        600,
        750
      ]
    },
    {
      "name": "C++",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Web Development",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "MIT App Inventor",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Robotics",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "AI & ML",
      "cat": "IT Technologies",
      "inr": [
        1200,
        1200,
        1200
      ],
      "inrG": [
        600,
        600,
        600
      ]
    },
    {
      "name": "Data Science",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        450,
        450,
        600
      ]
    },
    {
      "name": "AI Prompting",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Graphics Design",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Video Editing",
      "cat": "IT Technologies",
      "inr": [
        900,
        900,
        1200
      ],
      "inrG": [
        450,
        450,
        600
      ]
    },
    {
      "name": "Animation",
      "cat": "IT Technologies",
      "inr": [
        900,
        900,
        1200
      ],
      "inrG": [
        450,
        450,
        600
      ]
    },
    {
      "name": "VFX",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "AWS",
      "cat": "IT Technologies",
      "inr": [
        900,
        900,
        1200
      ],
      "inrG": [
        450,
        450,
        600
      ]
    },
    {
      "name": "DevOps",
      "cat": "IT Technologies",
      "inr": [
        900,
        900,
        1200
      ],
      "inrG": [
        450,
        450,
        600
      ]
    },
    {
      "name": "Rubik's Cube",
      "cat": "Mind Sports",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Chess",
      "cat": "Mind Sports",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Arts & Painting",
      "cat": "Creative Skills",
      "inr": [
        600,
        800,
        1200
      ],
      "inrG": [
        200,
        300,
        500
      ]
    },
    {
      "name": "Art and Craft",
      "cat": "Creative Skills",
      "inr": [
        600,
        800,
        1200
      ],
      "inrG": [
        200,
        300,
        500
      ]
    },
    {
      "name": "Creative Writing",
      "cat": "Creative Skills",
      "inr": [
        600,
        800,
        1200
      ],
      "inrG": [
        300,
        400,
        600
      ]
    },
    {
      "name": "Public Speaking",
      "cat": "Creative Skills",
      "inr": [
        300,
        400,
        600
      ],
      "inrG": [
        150,
        200,
        300
      ]
    },
    {
      "name": "Spelling Competition",
      "cat": "Creative Skills",
      "inr": [
        600,
        800,
        1200
      ],
      "inrG": [
        300,
        400,
        600
      ]
    },
    {
      "name": "Bollywood Dance",
      "cat": "Dance",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Kuchipudi Dance",
      "cat": "Dance",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Bharatnatyam Dance",
      "cat": "Dance",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Kathak Dance",
      "cat": "Dance",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Hip Hop Dance",
      "cat": "Dance",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Zumba Dance",
      "cat": "Dance",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Western Dance",
      "cat": "Dance",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Spanish",
      "cat": "Languages",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "French",
      "cat": "Languages",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "German",
      "cat": "Languages",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Mandarin",
      "cat": "Languages",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Russian",
      "cat": "Languages",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Sanskrit",
      "cat": "Languages",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Hindi",
      "cat": "Languages",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Tamil",
      "cat": "Languages",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Telugu",
      "cat": "Languages",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Kannada",
      "cat": "Languages",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Malayalam",
      "cat": "Languages",
      "inr": [
        600,
        900,
        1200
      ],
      "inrG": [
        300,
        450,
        600
      ]
    },
    {
      "name": "Phonics, Numbers & Language Development",
      "cat": "Academics — Primary & Middle (Classes 1-8)",
      "inr": [
        600
      ],
      "inrG": null
    },
    {
      "name": "Mathematics Grade 1-7",
      "cat": "Academics — Primary & Middle (Classes 1-8)",
      "inr": [
        600
      ],
      "inrG": null
    },
    {
      "name": "Mathematics Grade 8",
      "cat": "Academics — Primary & Middle (Classes 1-8)",
      "inr": [
        750
      ],
      "inrG": null
    },
    {
      "name": "Vedic Maths (Grade 3-6)",
      "cat": "Academics — Primary & Middle (Classes 1-8)",
      "inr": [
        600
      ],
      "inrG": null
    },
    {
      "name": "Vedic Maths (Advanced)",
      "cat": "Academics — Primary & Middle (Classes 1-8)",
      "inr": [
        1000
      ],
      "inrG": null
    },
    {
      "name": "English Grade 1-7",
      "cat": "Academics — Primary & Middle (Classes 1-8)",
      "inr": [
        600
      ],
      "inrG": null
    },
    {
      "name": "English Grade 8",
      "cat": "Academics — Primary & Middle (Classes 1-8)",
      "inr": [
        750
      ],
      "inrG": null
    },
    {
      "name": "Science Grade 1-7",
      "cat": "Academics — Primary & Middle (Classes 1-8)",
      "inr": [
        600
      ],
      "inrG": null
    },
    {
      "name": "Science Grade 8",
      "cat": "Academics — Primary & Middle (Classes 1-8)",
      "inr": [
        750
      ],
      "inrG": null
    },
    {
      "name": "Social Science Grade 1-7",
      "cat": "Academics — Primary & Middle (Classes 1-8)",
      "inr": [
        600
      ],
      "inrG": null
    },
    {
      "name": "Social Science Grade 8",
      "cat": "Academics — Primary & Middle (Classes 1-8)",
      "inr": [
        750
      ],
      "inrG": null
    },
    {
      "name": "Abacus",
      "cat": "Academics — Primary & Middle (Classes 1-8)",
      "inr": [
        600
      ],
      "inrG": null
    },
    {
      "name": "Mathematics Grade 9-10",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1000
      ],
      "inrG": null
    },
    {
      "name": "Mathematics Grade 11-12",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    },
    {
      "name": "English Grade 9-10",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1000
      ],
      "inrG": null
    },
    {
      "name": "English Grade 11-12",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    },
    {
      "name": "Science Grade 9-10",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1000
      ],
      "inrG": null
    },
    {
      "name": "Physics Grade 11-12",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    },
    {
      "name": "Chemistry Grade 11-12",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    },
    {
      "name": "Biology Grade 11-12",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    },
    {
      "name": "Social Science Grade 9-10",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1000
      ],
      "inrG": null
    },
    {
      "name": "Essay Writing",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1000
      ],
      "inrG": null
    },
    {
      "name": "Economics",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    },
    {
      "name": "History Grade 11-12",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    },
    {
      "name": "Political Science Grade 11-12",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    },
    {
      "name": "Geography Grade 11-12",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    },
    {
      "name": "Accountancy Grade 11-12",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    },
    {
      "name": "Business Studies Grade 11-12",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    },
    {
      "name": "Applied Mathematics Grade 11-12",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    },
    {
      "name": "Computer Science Grade 11-12",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    },
    {
      "name": "Informatics Practices Grade 11-12",
      "cat": "Academics — Secondary & Senior Secondary (Classes 9-12)",
      "inr": [
        1200
      ],
      "inrG": null
    }
  ]
};
