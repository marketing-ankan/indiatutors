// Category-bar navigation — ported 1:1 from the live site header.
// Targets remapped: /product/→/courses/{slug}, /product-category/→/courses?category=, /?s=→/courses?search=, /shop/→/courses, /tutors/→/find-tutors.
export const CATALOG_NAV = [
 {
  "label": "Home",
  "to": "/",
  "mega": null,
  "items": [],
  "footer": []
 },
 {
  "label": "Our Courses",
  "to": "/courses",
  "mega": [
   {
    "label": "🎓 By Board",
    "to": "/courses?category=academics-secondary-senior-secondary-classes-9-12",
    "items": [
     { "label": "🏫 CBSE", "to": "/board/cbse" },
     { "label": "📚 ICSE / ISC", "to": "/board/icse" },
     { "label": "🌍 IGCSE / Cambridge", "to": "/board/igcse" },
     { "label": "📍 State Boards", "to": "/board/state-boards" },
     { "label": "📖 NCERT", "to": "/board/ncert" }
    ]
   },
   {
    "label": "📘 Academics — Primary & Middle (Classes 1-8)",
    "to": "/courses?category=academics-primary-middle-classes-1-8",
    "items": [
     {
      "label": "🧮 Abacus",
      "to": "/courses/abacus"
     },
     {
      "label": "📖 English Grade 1-7",
      "to": "/courses/english-grade-1-7"
     },
     {
      "label": "📖 English Grade 8",
      "to": "/courses/english-grade-8"
     },
     {
      "label": "📐 Mathematics Grade 1-7",
      "to": "/courses/mathematics-grade-1-7"
     },
     {
      "label": "📐 Mathematics Grade 8",
      "to": "/courses/mathematics-grade-8"
     },
     {
      "label": "🔤 Phonics, Numbers & Language Development",
      "to": "/courses/phonics-numbers-language-development"
     },
     {
      "label": "🔬 Science Grade 1-7",
      "to": "/courses/science-grade-1-7"
     },
     {
      "label": "🔬 Science Grade 8",
      "to": "/courses/science-grade-8"
     },
     {
      "label": "🌍 Social Science Grade 1-7",
      "to": "/courses/social-science-grade-1-7"
     },
     {
      "label": "🌍 Social Science Grade 8",
      "to": "/courses/social-science-grade-8"
     },
     {
      "label": "📐 Vedic Maths (Advanced)",
      "to": "/courses/vedic-maths-advanced"
     },
     {
      "label": "📐 Vedic Maths (Grade 3-6)",
      "to": "/courses/vedic-maths-grade-3-6"
     }
    ]
   },
   {
    "label": "📘 Academics — Secondary & Senior Secondary (Classes 9-12)",
    "to": "/courses?category=academics-secondary-senior-secondary-classes-9-12",
    "items": [
     {
      "label": "🧬 Biology Grade 11-12",
      "to": "/courses/biology-grade-11-12"
     },
     {
      "label": "🧪 Chemistry Grade 11-12",
      "to": "/courses/chemistry-grade-11-12"
     },
     {
      "label": "📊 Economics",
      "to": "/courses/economics"
     },
     {
      "label": "📖 English Grade 11-12",
      "to": "/courses/english-grade-11-12"
     },
     {
      "label": "📖 English Grade 9-10",
      "to": "/courses/english-grade-9-10"
     },
     {
      "label": "📐 Mathematics Grade 11-12",
      "to": "/courses/mathematics-grade-11-12"
     },
     {
      "label": "📐 Mathematics Grade 9-10",
      "to": "/courses/mathematics-grade-9-10"
     },
     {
      "label": "⚛️ Physics Grade 11-12",
      "to": "/courses/physics-grade-11-12"
     },
     {
      "label": "🔬 Science Grade 9-10",
      "to": "/courses/science-grade-9-10"
     },
     {
      "label": "🌍 Social Science Grade 9-10",
      "to": "/courses/social-science-grade-9-10"
     },
     {
      "label": "📜 History Grade 11-12",
      "to": "/courses/history-grade-11-12"
     },
     {
      "label": "🏛️ Political Science Grade 11-12",
      "to": "/courses/political-science-grade-11-12"
     },
     {
      "label": "🗺️ Geography Grade 11-12",
      "to": "/courses/geography-grade-11-12"
     },
     {
      "label": "📒 Accountancy Grade 11-12",
      "to": "/courses/accountancy-grade-11-12"
     },
     {
      "label": "💼 Business Studies Grade 11-12",
      "to": "/courses/business-studies-grade-11-12"
     },
     {
      "label": "📐 Applied Mathematics Grade 11-12",
      "to": "/courses/applied-mathematics-grade-11-12"
     },
     {
      "label": "💻 Computer Science Grade 11-12",
      "to": "/courses/computer-science-grade-11-12"
     },
     {
      "label": "📊 Informatics Practices Grade 11-12",
      "to": "/courses/informatics-practices-grade-11-12"
     }
    ]
   },
   {
    "label": "🏆 Competitive Exams",
    "to": "/competitive-exams",
    "items": [
     { "label": "⚡ JEE Main", "to": "/courses/jee-main" },
     { "label": "⚡ JEE Advanced", "to": "/courses/jee-advanced" },
     { "label": "🧬 NEET (UG)", "to": "/courses/neet-ug" },
     { "label": "📝 CUET (UG)", "to": "/courses/cuet-ug" },
     { "label": "🏅 Olympiads (IMO / NSO / IEO)", "to": "/courses/olympiad-preparation" },
     { "label": "🌐 IELTS / TOEFL (study abroad)", "to": "/book-demo?subject=IELTS / TOEFL" }
    ]
   },
   {
    "label": "♟️ Mind Sports",
    "to": "/courses?category=mind-sports",
    "items": [
     {
      "label": "♟️ Chess",
      "to": "/courses/chess"
     },
     {
      "label": "♟️ Chess Strategy & Mind Sports",
      "to": "/courses/chess-strategy-mind-sports"
     },
     {
      "label": "🧩 Rubik’s Cube",
      "to": "/courses/rubiks-cube"
     }
    ]
   },
   {
    "label": "💻 IT Technologies",
    "to": "/courses?category=it-technologies",
    "items": [
     {
      "label": "💻 AI & ML",
      "to": "/courses/ai-ml"
     },
     {
      "label": "🤖 AI Prompting",
      "to": "/courses/ai-prompting"
     },
     {
      "label": "🎬 Animation",
      "to": "/courses/animation"
     },
     {
      "label": "☁️ AWS",
      "to": "/courses/aws"
     },
     {
      "label": "🎮 Blockly",
      "to": "/courses/blockly"
     },
     {
      "label": "💻 C++",
      "to": "/courses/c"
     },
     {
      "label": "🔬 Data Science",
      "to": "/courses/data-science"
     },
     {
      "label": "☁️ DevOps",
      "to": "/courses/devops"
     },
     {
      "label": "🎨 Graphics Design",
      "to": "/courses/graphics-design"
     },
     {
      "label": "☕ Java",
      "to": "/courses/java"
     },
     {
      "label": "📱 MIT App Inventor",
      "to": "/courses/mit-app-inventor"
     },
     {
      "label": "🐍 Python",
      "to": "/courses/python"
     },
     {
      "label": "🎮 Roblox & Minecraft",
      "to": "/courses/roblox-minecraft"
     },
     {
      "label": "🦾 Robotics",
      "to": "/courses/robotics"
     },
     {
      "label": "🎮 Scratch",
      "to": "/courses/scratch"
     },
     {
      "label": "🎬 VFX",
      "to": "/courses/vfx"
     },
     {
      "label": "🎬 Video Editing",
      "to": "/courses/video-editing"
     },
     {
      "label": "🌐 Web Development",
      "to": "/courses/web-development"
     }
    ]
   },
   {
    "label": "🎸 Musical Instruments",
    "to": "/courses?category=musical-instruments",
    "items": [
     {
      "label": "🎻 Carnatic Violin",
      "to": "/courses/carnatic-violin"
     },
     {
      "label": "🎻 Cello",
      "to": "/courses/cello"
     },
     {
      "label": "🎷 Clarinet",
      "to": "/courses/clarinet"
     },
     {
      "label": "🥁 Drums",
      "to": "/courses/drums"
     },
     {
      "label": "🎸 Guitar",
      "to": "/courses/guitar"
     },
     {
      "label": "🎶 Indian Flute",
      "to": "/courses/indian-flute"
     },
     {
      "label": "🎹 Keyboard",
      "to": "/courses/keyboard"
     },
     {
      "label": "🎼 Music Theory",
      "to": "/courses/music-theory"
     },
     {
      "label": "🎹 Piano",
      "to": "/courses/piano"
     },
     {
      "label": "🎶 Recorder",
      "to": "/courses/recorder"
     },
     {
      "label": "🎷 Saxophone",
      "to": "/courses/saxophone"
     },
     {
      "label": "🪕 Sitar",
      "to": "/courses/sitar"
     },
     {
      "label": "🥁 Tabla",
      "to": "/courses/tabla"
     },
     {
      "label": "🎺 Trumpet",
      "to": "/courses/trumpet"
     },
     {
      "label": "🎸 Ukulele",
      "to": "/courses/ukulele"
     },
     {
      "label": "🪕 Veena",
      "to": "/courses/veena"
     },
     {
      "label": "🎻 Viola",
      "to": "/courses/viola"
     },
     {
      "label": "🎻 Violin",
      "to": "/courses/violin"
     }
    ]
   },
   {
    "label": "🎤 Vocal Music",
    "to": "/courses?category=vocal-music",
    "items": [
     {
      "label": "🎤 Carnatic Vocal Music",
      "to": "/courses/carnatic-vocal-music"
     },
     {
      "label": "🎤 Hindustani Vocal Music",
      "to": "/courses/hindustani-vocal-music"
     },
     {
      "label": "🎤 Western Vocal Music",
      "to": "/courses/western-vocal-music"
     }
    ]
   },
   {
    "label": "🌐 Languages",
    "to": "/courses?category=languages",
    "items": [
     {
      "label": "🇫🇷 French",
      "to": "/courses/french"
     },
     {
      "label": "🇩🇪 German",
      "to": "/courses/german"
     },
     {
      "label": "🪔 Hindi",
      "to": "/courses/hindi"
     },
     {
      "label": "🌐 Kannada",
      "to": "/courses/kannada"
     },
     {
      "label": "🌐 Malayalam",
      "to": "/courses/malayalam"
     },
     {
      "label": "🇨🇳 Mandarin",
      "to": "/courses/mandarin"
     },
     {
      "label": "🇷🇺 Russian",
      "to": "/courses/russian"
     },
     {
      "label": "📿 Sanskrit",
      "to": "/courses/sanskrit"
     },
     {
      "label": "🇪🇸 Spanish",
      "to": "/courses/spanish"
     },
     {
      "label": "📖 Spoken English & Confident Communication",
      "to": "/courses/spoken-english-confident-communication"
     },
     {
      "label": "🌴 Tamil",
      "to": "/courses/tamil"
     },
     {
      "label": "🌐 Telugu",
      "to": "/courses/telugu"
     }
    ]
   },
   {
    "label": "💃 Dance",
    "to": "/courses?category=dance",
    "items": [
     {
      "label": "💃 Bharatnatyam Dance",
      "to": "/courses/bharatnatyam-dance"
     },
     {
      "label": "💃 Bollywood Dance",
      "to": "/courses/bollywood-dance"
     },
     {
      "label": "💃 Hip Hop Dance",
      "to": "/courses/hip-hop-dance"
     },
     {
      "label": "💃 Kathak Dance",
      "to": "/courses/kathak-dance"
     },
     {
      "label": "💃 Kuchipudi Dance",
      "to": "/courses/kuchipudi-dance"
     },
     {
      "label": "💃 Western Dance",
      "to": "/courses/western-dance-dance"
     },
     {
      "label": "💃 Zumba Dance",
      "to": "/courses/zumba-dance"
     }
    ]
   },
   {
    "label": "🎨 Creative Skills",
    "to": "/courses?category=creative-skills",
    "items": [
     {
      "label": "✂️ Art and Craft",
      "to": "/courses/art-and-craft"
     },
     {
      "label": "🎨 Arts & Painting",
      "to": "/courses/arts-painting"
     },
     {
      "label": "✍️ Creative Writing",
      "to": "/courses/creative-writing"
     },
     {
      "label": "🗣️ Public Speaking",
      "to": "/courses/public-speaking"
     },
     {
      "label": "📝 Essay Writing",
      "to": "/courses/essay-writing"
     },
     {
      "label": "🔤 Spelling Competition",
      "to": "/courses/spelling-competition"
     }
    ]
   }
  ],
  "items": [],
  "footer": [
   {
    "label": "🔍 Browse all courses →",
    "to": "/courses"
   },
   {
    "label": "👩‍🏫 Find a tutor →",
    "to": "/find-tutors"
   },
   {
    "label": "🎁 Free demo classes →",
    "to": "/free-classes"
   }
  ]
 },
 {
  "label": "Video Courses",
  "to": "/video-courses",
  "mega": null,
  "items": [
   { "label": "🐍 Python for Kids", "to": "/video-courses/python-for-kids-self-paced" },
   { "label": "🎨 Arts & Painting Fundamentals", "to": "/video-courses/arts-painting-fundamentals-video" },
   { "label": "🧮 NCERT Class 10 Maths", "to": "/video-courses/ncert-class-10-maths-video" }
  ],
  "footer": [
   { "label": "🎬 All video courses →", "to": "/video-courses" }
  ]
 },
 {
  "label": "Group Classes",
  "to": "/group-classes",
  "mega": [
   {
    "label": "♟️ Mind Sports",
    "to": "/courses?category=mind-sports",
    "items": [
     {
      "label": "♟️ Chess",
      "to": "/courses/chess"
     },
     {
      "label": "🧩 Rubik’s Cube",
      "to": "/courses/rubiks-cube"
     }
    ]
   },
   {
    "label": "💻 IT Technologies",
    "to": "/courses?category=it-technologies",
    "items": [
     {
      "label": "🐍 Python",
      "to": "/courses/python"
     },
     {
      "label": "🎮 Roblox & Minecraft",
      "to": "/courses/roblox-minecraft"
     },
     {
      "label": "🦾 Robotics",
      "to": "/courses/robotics"
     },
     {
      "label": "🎮 Scratch",
      "to": "/courses/scratch"
     }
    ]
   },
   {
    "label": "🌐 Languages",
    "to": "/courses?category=languages",
    "items": [
     {
      "label": "🇫🇷 French",
      "to": "/courses/french"
     },
     {
      "label": "🪔 Hindi",
      "to": "/courses/hindi"
     },
     {
      "label": "🇪🇸 Spanish",
      "to": "/courses/spanish"
     },
     {
      "label": "🌴 Tamil",
      "to": "/courses/tamil"
     },
     {
      "label": "🌐 Telugu",
      "to": "/courses/telugu"
     }
    ]
   },
   {
    "label": "💃 Dance",
    "to": "/courses?category=dance",
    "items": [
     {
      "label": "💃 Bollywood Dance",
      "to": "/courses/bollywood-dance"
     },
     {
      "label": "💃 Hip Hop Dance",
      "to": "/courses/hip-hop-dance"
     }
    ]
   },
   {
    "label": "🎨 Creative Skills",
    "to": "/courses?category=creative-skills",
    "items": [
     {
      "label": "✂️ Art and Craft",
      "to": "/courses/art-and-craft"
     },
     {
      "label": "🎨 Arts & Painting",
      "to": "/courses/arts-painting"
     },
     {
      "label": "✍️ Creative Writing",
      "to": "/courses/creative-writing"
     },
     {
      "label": "🗣️ Public Speaking",
      "to": "/courses/public-speaking"
     },
     {
      "label": "🔤 Spelling Competition",
      "to": "/courses/spelling-competition"
     }
    ]
   }
  ],
  "items": [],
  "footer": [
   {
    "label": "🏫 All group classes →",
    "to": "/group-classes"
   },
   {
    "label": "🎯 Book a free demo →",
    "to": "/book-demo"
   }
  ]
 },
 {
  "label": "Events & Workshops",
  "to": "/events-workshops",
  "mega": null,
  "items": [
   {
    "label": "🎨 Art and Painting",
    "to": "/courses?search=Art%20and%20Painting"
   },
   {
    "label": "✂️ Art and Craft",
    "to": "/courses?search=Art%20and%20Craft"
   },
   {
    "label": "🇪🇸 Spanish Language",
    "to": "/courses?search=Spanish"
   },
   {
    "label": "🇫🇷 French Language",
    "to": "/courses?search=French"
   },
   {
    "label": "♟️ Chess",
    "to": "/courses?search=Chess"
   },
   {
    "label": "🧩 Rubik’s Cube",
    "to": "/courses?search=Rubik's%20Cube"
   },
   {
    "label": "🎮 Scratch",
    "to": "/courses?search=Scratch"
   },
   {
    "label": "🐍 Python",
    "to": "/courses?search=Python"
   },
   {
    "label": "🧮 Abacus",
    "to": "/courses?search=Abacus"
   },
   {
    "label": "📐 Vedic Maths",
    "to": "/courses?search=Vedic%20Maths"
   },
   {
    "label": "🦾 Robotics",
    "to": "/courses?search=Robotics"
   },
   {
    "label": "🗣️ Public Speaking",
    "to": "/courses?search=Public%20Speaking"
   }
  ],
  "footer": [
   {
    "label": "📅 View all events →",
    "to": "/events-workshops"
   }
  ]
 },
 {
  "label": "Free Classes",
  "to": "/free-classes",
  "mega": null,
  "items": [
   {
    "label": "🎨 Art and Painting",
    "to": "/courses?search=Art%20and%20Painting"
   },
   {
    "label": "✂️ Art and Craft",
    "to": "/courses?search=Art%20and%20Craft"
   },
   {
    "label": "🇪🇸 Spanish Language",
    "to": "/courses?search=Spanish"
   },
   {
    "label": "🇫🇷 French Language",
    "to": "/courses?search=French"
   },
   {
    "label": "♟️ Chess",
    "to": "/courses?search=Chess"
   },
   {
    "label": "🧩 Rubik’s Cube",
    "to": "/courses?search=Rubik's%20Cube"
   },
   {
    "label": "🎮 Scratch",
    "to": "/courses?search=Scratch"
   }
  ],
  "footer": [
   {
    "label": "🎁 View all free classes →",
    "to": "/free-classes"
   }
  ]
 },
 {
  "label": "Physical Classes",
  "to": "/physical-classes",
  "mega": null,
  "items": [],
  "footer": []
 },
 {
  "label": "Competitive Exams",
  "to": "/competitive-exams",
  "mega": null,
  "items": [
   {
    "label": "⚡ JEE Main",
    "to": "/courses/jee-main"
   },
   {
    "label": "⚡ JEE Advanced",
    "to": "/courses/jee-advanced"
   },
   {
    "label": "🧬 NEET (UG)",
    "to": "/courses/neet-ug"
   },
   {
    "label": "📝 CUET (UG)",
    "to": "/courses/cuet-ug"
   },
   {
    "label": "🏆 Olympiads (IMO / NSO / IEO)",
    "to": "/courses/olympiad-preparation"
   },
   {
    "label": "🌐 IELTS / TOEFL",
    "to": "/book-demo?subject=IELTS / TOEFL"
   }
  ],
  "footer": [
   {
    "label": "🏅 All Exams →",
    "to": "/competitive-exams"
   }
  ]
 },
 {
  "label": "Skill Programmes",
  "to": "/skill-programmes",
  "mega": null,
  "items": [],
  "footer": []
 }
];
