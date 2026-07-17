// Static store taxonomy (WinQuest-adopted Instruments & Robotics-Kits store).
// Categories and buying guides are fixed content; products come from the API.
export const STORE_CATEGORIES = [
  {
    "key": "guitars-ukuleles",
    "name": "Guitars & Ukuleles",
    "icon": "🎸",
    "guide": "guitars-ukuleles"
  },
  {
    "key": "keyboards-pianos",
    "name": "Keyboards & Pianos",
    "icon": "🎹",
    "guide": "keyboards-pianos"
  },
  {
    "key": "drums-percussion",
    "name": "Drums & Percussion",
    "icon": "🥁",
    "guide": "drums-percussion"
  },
  {
    "key": "indian-classical",
    "name": "Indian Classical Instruments",
    "icon": "🪕",
    "guide": null
  },
  {
    "key": "violins-strings",
    "name": "Violins & Strings",
    "icon": "🎻",
    "guide": "violins-strings"
  },
  {
    "key": "wind-woodwind",
    "name": "Wind & Woodwind",
    "icon": "🎷",
    "guide": "wind-woodwind"
  },
  {
    "key": "robotics-coding",
    "name": "Robotics & Coding Kits",
    "icon": "🤖",
    "guide": "robotics-beginner"
  }
];

export const BUYING_GUIDES = [
  {
    "slug": "guitars-ukuleles",
    "title": "How to Choose a Guitar or Ukulele for Your Child",
    "icon": "🎸",
    "blurb": "The right first guitar is the one your child can physically play in week one. Size and string comfort matter far more than brand.",
    "position": 0
  },
  {
    "slug": "keyboards-pianos",
    "title": "How to Choose a Keyboard or Digital Piano",
    "icon": "🎹",
    "blurb": "From 61-key starters to 88-key weighted pianos — match the keybed to your child's stage and exam plans.",
    "position": 1
  },
  {
    "slug": "drums-percussion",
    "title": "How to Choose Drums & Percussion",
    "icon": "🥁",
    "blurb": "Acoustic energy or quiet mesh pads? Kit size and noise are the two decisions that matter most.",
    "position": 2
  },
  {
    "slug": "violins-strings",
    "title": "How to Choose a Violin or String Instrument",
    "icon": "🎻",
    "blurb": "Sizing is everything with strings — a violin that fits the arm makes practice comfortable, not painful.",
    "position": 3
  },
  {
    "slug": "wind-woodwind",
    "title": "How to Choose a Wind or Woodwind Instrument",
    "icon": "🎷",
    "blurb": "Recorder, flute, clarinet or sax? Age, breath and budget point to the right first wind instrument.",
    "position": 4
  },
  {
    "slug": "robotics-beginner",
    "title": "Robotics & Coding Kits — Beginner Guide",
    "icon": "🤖",
    "blurb": "Screen-free robots and block coding build logic early — start with age, not ambition.",
    "position": 5
  },
  {
    "slug": "robotics-intermediate",
    "title": "Robotics & Coding Kits — Intermediate Guide",
    "icon": "🤖",
    "blurb": "Ready to move from blocks to text? Kits that bridge Scratch-style coding to C and Arduino.",
    "position": 6
  },
  {
    "slug": "robotics-advanced",
    "title": "Robotics & Coding Kits — Advanced Guide",
    "icon": "🤖",
    "blurb": "Arduino, ESP32 and AI/ML kits for teens building real, connected, intelligent projects.",
    "position": 7
  },
  {
    "slug": "robotics-ai-ml",
    "title": "AI & ML Kits — What to Buy",
    "icon": "🧠",
    "blurb": "Camera-equipped kits that take confident coders into computer vision and machine learning.",
    "position": 8
  }
];

export const CATEGORY_BY_KEY = Object.fromEntries(STORE_CATEGORIES.map(c => [c.key, c]));
