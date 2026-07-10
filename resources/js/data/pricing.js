// Pricing engine data — ported from the live site (ITO_PP config on /plans-pricing/).
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
    "INR": 750,
    "USD": 10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Guitar",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Ukulele",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Keyboard",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Drums",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Violin",
      "cat": "Musical Instruments",
      "inr": [
        1000,
        1500,
        2000
      ],
      "usd": [
        15,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Veena",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Cello",
      "cat": "Musical Instruments",
      "inr": [
        1500,
        2000,
        2500
      ],
      "usd": [
        20,
        30,
        40
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Viola",
      "cat": "Musical Instruments",
      "inr": [
        1000,
        1500,
        2000
      ],
      "usd": [
        15,
        20,
        30
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Clarinet",
      "cat": "Musical Instruments",
      "inr": [
        1500,
        2000,
        2500
      ],
      "usd": [
        20,
        30,
        40
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Tabla",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Indian Flute",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Western Flute",
      "cat": "Musical Instruments",
      "inr": [
        1000,
        1500,
        2000
      ],
      "usd": [
        15,
        20,
        30
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Saxophone",
      "cat": "Musical Instruments",
      "inr": [
        1000,
        1500,
        2000
      ],
      "usd": [
        15,
        20,
        30
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Music Theory",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Trumpet",
      "cat": "Musical Instruments",
      "inr": [
        1500,
        2000,
        2500
      ],
      "usd": [
        20,
        30,
        40
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Sitar",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Recorder",
      "cat": "Musical Instruments",
      "inr": [
        600,
        1000,
        1500
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Carnatic Violin",
      "cat": "Musical Instruments",
      "inr": [
        1000,
        1500,
        2000
      ],
      "usd": [
        15,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Carnatic Vocal Music",
      "cat": "Vocal Music",
      "inr": [
        600,
        900,
        1200
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Hindustani Vocal Music",
      "cat": "Vocal Music",
      "inr": [
        600,
        900,
        1200
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Western Vocal Music",
      "cat": "Vocal Music",
      "inr": [
        600,
        900,
        1200
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Scratch",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "usd": [
        10,
        12.5,
        15
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        6.25,
        7.5
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
      "usd": [
        10,
        12.5,
        15
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        6.25,
        7.5
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
      "usd": [
        10,
        12.5,
        15
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        6.25,
        7.5
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
      "usd": [
        10,
        12.5,
        15
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        6.25,
        7.5
      ]
    },
    {
      "name": "Java",
      "cat": "IT Technologies",
      "inr": [
        850,
        900,
        1200
      ],
      "usd": [
        15,
        20,
        25
      ],
      "inrG": [
        425,
        600,
        750
      ],
      "usdG": [
        7.5,
        10,
        12.5
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
      "usd": [
        10,
        12.5,
        15
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        6.25,
        7.5
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
      "usd": [
        10,
        12.5,
        15
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        6.25,
        7.5
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
      "usd": [
        10,
        12.5,
        15
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        6.25,
        7.5
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
      "usd": [
        10,
        12.5,
        15
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        6.25,
        7.5
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
      "usd": [
        15,
        15,
        15
      ],
      "inrG": [
        600,
        600,
        600
      ],
      "usdG": [
        7.5,
        7.5,
        7.5
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
      "usd": [
        15,
        15,
        15
      ],
      "inrG": [
        450,
        450,
        600
      ],
      "usdG": [
        7.5,
        7.5,
        7.5
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
      "usd": [
        10,
        12.5,
        15
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        6.25,
        7.5
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
      "usd": [
        10,
        12.5,
        15
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        6.25,
        7.5
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
      "usd": [
        12.5,
        12.5,
        15
      ],
      "inrG": [
        450,
        450,
        600
      ],
      "usdG": [
        6.25,
        6.25,
        7.5
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
      "usd": [
        12.5,
        12.5,
        15
      ],
      "inrG": [
        450,
        450,
        600
      ],
      "usdG": [
        6.25,
        6.25,
        7.5
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
      "usd": [
        12.5,
        12.5,
        15
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        6.25,
        6.25,
        7.5
      ]
    },
    {
      "name": "AWS",
      "cat": "IT Technologies",
      "inr": [
        600,
        900,
        1200
      ],
      "usd": [
        15,
        15,
        20
      ],
      "inrG": [
        450,
        450,
        600
      ],
      "usdG": [
        7.5,
        7.5,
        10
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
      "usd": [
        15,
        15,
        20
      ],
      "inrG": [
        450,
        450,
        600
      ],
      "usdG": [
        7.5,
        7.5,
        10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
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
      "usd": [
        10,
        12.5,
        20
      ],
      "inrG": [
        200,
        300,
        500
      ],
      "usdG": [
        3,
        5,
        7.5
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
      "usd": null,
      "inrG": [
        200,
        300,
        500
      ],
      "usdG": null
    },
    {
      "name": "Creative Writing",
      "cat": "Creative Skills",
      "inr": [
        600,
        800,
        1200
      ],
      "usd": [
        10,
        12.5,
        20
      ],
      "inrG": [
        300,
        400,
        600
      ],
      "usdG": [
        5,
        6.25,
        10
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
      "usd": [
        5,
        7.5,
        10
      ],
      "inrG": [
        150,
        200,
        300
      ],
      "usdG": [
        2.5,
        3.75,
        5
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
      "usd": [
        10,
        12.5,
        20
      ],
      "inrG": [
        300,
        400,
        600
      ],
      "usdG": [
        5,
        6.25,
        10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
      ]
    },
    {
      "name": "Western Dance Dance",
      "cat": "Dance",
      "inr": [
        600,
        900,
        1200
      ],
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
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
      "usd": [
        10,
        15,
        20
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        5,
        7.5,
        10
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
      "usd": [
        8,
        12,
        16
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        4,
        6,
        8
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
      "usd": [
        8,
        12,
        16
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        4,
        6,
        8
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
      "usd": [
        8,
        12,
        16
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        4,
        6,
        8
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
      "usd": [
        8,
        12,
        16
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        4,
        6,
        8
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
      "usd": [
        8,
        12,
        16
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        4,
        6,
        8
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
      "usd": [
        8,
        12,
        16
      ],
      "inrG": [
        300,
        450,
        600
      ],
      "usdG": [
        4,
        6,
        8
      ]
    },
    {
      "name": "Phonics, Numbers & Language Development",
      "cat": "Academics — Elementary & Middle School",
      "inr": [
        600
      ],
      "usd": [
        10
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Mathematics Grade 1-7",
      "cat": "Academics — Elementary & Middle School",
      "inr": [
        600
      ],
      "usd": [
        10
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Mathematics Grade 8",
      "cat": "Academics — Elementary & Middle School",
      "inr": [
        750
      ],
      "usd": [
        12.5
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Vedic Maths (Grade 3-6)",
      "cat": "Academics — Elementary & Middle School",
      "inr": [
        600
      ],
      "usd": [
        10
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Vedic Maths (Advanced)",
      "cat": "Academics — Elementary & Middle School",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "English Grade 1-7",
      "cat": "Academics — Elementary & Middle School",
      "inr": [
        600
      ],
      "usd": [
        10
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "English Grade 8",
      "cat": "Academics — Elementary & Middle School",
      "inr": [
        750
      ],
      "usd": [
        12.5
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Science Grade 1-7",
      "cat": "Academics — Elementary & Middle School",
      "inr": [
        600
      ],
      "usd": [
        10
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Science Grade 8",
      "cat": "Academics — Elementary & Middle School",
      "inr": [
        750
      ],
      "usd": [
        12.5
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Social Studies Grade 1-7",
      "cat": "Academics — Elementary & Middle School",
      "inr": [
        600
      ],
      "usd": [
        10
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Social Studies Grade 8",
      "cat": "Academics — Elementary & Middle School",
      "inr": [
        750
      ],
      "usd": [
        12.5
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Abacus",
      "cat": "Academics — Elementary & Middle School",
      "inr": [
        600
      ],
      "usd": [
        10
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Mathematics Grade 9-10",
      "cat": "Academics — High School",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Mathematics Grade 11-12",
      "cat": "Academics — High School",
      "inr": [
        1200
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "English Grade 9-10",
      "cat": "Academics — High School",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "English Grade 11-12",
      "cat": "Academics — High School",
      "inr": [
        1200
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Science Grade 9-10",
      "cat": "Academics — High School",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Physics Grade 11-12",
      "cat": "Academics — High School",
      "inr": [
        1200
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Chemistry Grade 11-12",
      "cat": "Academics — High School",
      "inr": [
        1200
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Biology Grade 11-12",
      "cat": "Academics — High School",
      "inr": [
        1200
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Social Studies Grade 9-10",
      "cat": "Academics — High School",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Social Studies Grade 11-12",
      "cat": "Academics — High School",
      "inr": [
        1200
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Integrated Math I/II/III",
      "cat": "Academics — High School",
      "inr": [
        1200
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Algebra I",
      "cat": "Academics — High School",
      "inr": [
        1200
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Algebra II",
      "cat": "Academics — High School",
      "inr": [
        1200
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Geometry",
      "cat": "Academics — High School",
      "inr": [
        1200
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Pre-Calculus",
      "cat": "Academics — High School",
      "inr": [
        1200
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Calculus",
      "cat": "Academics — High School",
      "inr": [
        1200
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Essay Writing",
      "cat": "Academics — High School",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Economics",
      "cat": "Academics — High School",
      "inr": [
        1200
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Honors Chemistry",
      "cat": "Academics — High School",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Honors Biology",
      "cat": "Academics — High School",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Honors Physics",
      "cat": "Academics — High School",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Physics 1/2",
      "cat": "AP Courses",
      "inr": [
        1200
      ],
      "usd": [
        18
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Physics C",
      "cat": "AP Courses",
      "inr": [
        1500
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Physics C Mechanics",
      "cat": "AP Courses",
      "inr": [
        1500
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Chemistry",
      "cat": "AP Courses",
      "inr": [
        1200
      ],
      "usd": [
        18
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Biology",
      "cat": "AP Courses",
      "inr": [
        1200
      ],
      "usd": [
        18
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Pre-Calculus",
      "cat": "AP Courses",
      "inr": [
        1200
      ],
      "usd": [
        18
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Calculus AB",
      "cat": "AP Courses",
      "inr": [
        1500
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Calculus BC",
      "cat": "AP Courses",
      "inr": [
        1500
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP English Language",
      "cat": "AP Courses",
      "inr": [
        1200
      ],
      "usd": [
        18
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Spanish",
      "cat": "AP Courses",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP French",
      "cat": "AP Courses",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Computer Science",
      "cat": "AP Courses",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Computer Science Principles",
      "cat": "AP Courses",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP US History",
      "cat": "AP Courses",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP European History",
      "cat": "AP Courses",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Statistics",
      "cat": "AP Courses",
      "inr": [
        1500
      ],
      "usd": [
        20
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Music Theory",
      "cat": "AP Courses",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Micro Economics",
      "cat": "AP Courses",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "AP Macro Economics",
      "cat": "AP Courses",
      "inr": [
        1000
      ],
      "usd": [
        15
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "English SAT/PSAT",
      "cat": "Standardized Tests",
      "inr": [
        1200
      ],
      "usd": [
        18
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Math SAT/PSAT",
      "cat": "Standardized Tests",
      "inr": [
        1200
      ],
      "usd": [
        18
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "Digital SAT/PSAT Math",
      "cat": "Standardized Tests",
      "inr": [
        1200
      ],
      "usd": null,
      "inrG": null,
      "usdG": null
    },
    {
      "name": "NMSQT",
      "cat": "Standardized Tests",
      "inr": [
        1200
      ],
      "usd": [
        18
      ],
      "inrG": null,
      "usdG": null
    },
    {
      "name": "ACT",
      "cat": "Standardized Tests",
      "inr": [
        1200
      ],
      "usd": [
        18
      ],
      "inrG": null,
      "usdG": null
    }
  ],
  "countries": [
    {
      "name": "India",
      "currency": "INR"
    },
    {
      "name": "United States",
      "currency": "USD"
    },
    {
      "name": "United Kingdom",
      "currency": "USD"
    },
    {
      "name": "Canada",
      "currency": "USD"
    },
    {
      "name": "Australia",
      "currency": "USD"
    },
    {
      "name": "United Arab Emirates",
      "currency": "USD"
    },
    {
      "name": "Singapore",
      "currency": "USD"
    },
    {
      "name": "Saudi Arabia",
      "currency": "USD"
    },
    {
      "name": "Qatar",
      "currency": "USD"
    },
    {
      "name": "Kuwait",
      "currency": "USD"
    },
    {
      "name": "Germany",
      "currency": "USD"
    },
    {
      "name": "France",
      "currency": "USD"
    },
    {
      "name": "Netherlands",
      "currency": "USD"
    },
    {
      "name": "New Zealand",
      "currency": "USD"
    },
    {
      "name": "Ireland",
      "currency": "USD"
    },
    {
      "name": "Malaysia",
      "currency": "USD"
    },
    {
      "name": "Hong Kong",
      "currency": "USD"
    },
    {
      "name": "South Africa",
      "currency": "USD"
    },
    {
      "name": "Nigeria",
      "currency": "USD"
    },
    {
      "name": "Other",
      "currency": "USD"
    }
  ],
  "timezones": [
    "IST (India)",
    "GST (Gulf)",
    "GMT/BST (UK)",
    "CET (Europe)",
    "EST (US East)",
    "CST (US Central)",
    "MST (US Mountain)",
    "PST (US West)",
    "AEST (Australia East)",
    "NZST (New Zealand)",
    "SGT (Singapore)",
    "Other"
  ]
};
