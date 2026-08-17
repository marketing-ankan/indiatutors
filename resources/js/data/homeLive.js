// Content scraped 1:1 from the live indiatutorsonline.com homepage (July 2026).
// The WP theme server-renders every card with fixed ratings/copy, so this file
// mirrors that data verbatim to keep the React homepage pixel-identical.

import { imageFor } from './courseImages.js';
import { ASSET_V } from './assetVersion.js';

const UP = 'https://indiatutorsonline.com/wp-content/uploads/';

// Homepage tutor portraits, self-hosted from the live theme's media library.
// Kept under teachers/home/ so they don't collide with the tutor-directory
// portraits in teachers/, which are different crops of a different roster.
const teacherImg = slug => `/build/images/teachers/home/${slug}.png?v=${ASSET_V}`;

// Card description templates ({T} = course title, exactly as the live theme prints them)
export const D = [
  'Personalised {T} coaching that turns weak areas into strengths.',
  'Exam-ready {T} with structured practice and live doubt-solving.',
  'Concept-clear {T} tutoring aligned to your school board.',
  'Concept mastery + timed practice for {T} success.',
  'Master {T} for a 4–5 with targeted, exam-style coaching.',
  'Score-focused {T} prep with past-paper drills and expert mentors.',
  'Test-day ready: {T} strategy, pacing and review.',
  'Targeted {T} prep — strategy, timing and full-length practice.',
  'Boost your {T} score with structured drills and mock tests.',
  'Level up your {T} with tactics, drills and rated practice.',
  'Think faster — guided {T} training for all levels.',
  'Build real {T} projects while learning core concepts live.',
  'From basics to a portfolio — guided live {T} coding.',
  'Hands-on, project-first {T} for curious young coders.',
  'From first notes to recital — structured {T} training for every level.',
  'Master {T} step by step with personalised, performance-focused coaching.',
  'Learn {T} from home with posture, breathing and technique guidance.',
  'Discover your musical voice through structured, personalised {T} lessons.',
  '{T} builds breath control, focus, discipline and musical sensitivity.',
  'Build technique, theory and stage confidence in live {T} sessions.',
  '{T} training that develops coordination, listening and expression.',
  'A graded {T} programme in the Hindustani tradition, foundation to performance.',
  'Interactive live {T} classes, 1:1 or small group, on a schedule that suits you.',
  '{T} builds discipline, coordination and confidence through regular practice.',
  'Live {T} classes with a certificate of completion at the end of each level.',
  'Carnatic {T} — intricate melody, rhythmic precision and the South Indian tradition.',
  'Hindustani {T} — improvisation, raag development and the classical North Indian style.',
  'Expert {T} instructors, personalised feedback and a clear path from first class to stage.',
  'Speak {T} confidently with conversation-led live lessons.',
  'From first words to fluency — personalised {T} coaching.',
  'Grammar, fluency and real conversation in structured {T} classes.',
  'From basics to stage — graded, personalised {T} training.',
  'Learn {T} with technique, rhythm and choreography from expert gurus.',
  'Build grace and discipline with live {T} classes.',
  'Build skill and confidence in expressive {T} classes.',
  'Create, refine, showcase — personalised {T} coaching.',
  'A structured {T} programme — from first session to confident delivery.',
  'Small-batch {T} coaching: tactics, drills and friendly matches.',
  'Group {T} sessions — strategy, practice and progress tracking.',
  'Group {T} sessions: hands-on projects and shared problem-solving.',
  'Build {T} projects as a team in small, mentor-led batches.',
  'Practise {T} with peers in conversation-led group sessions.',
  'Learn {T} together — interactive, batch-based and fluency-focused.',
  'Group {T} classes: speaking drills, real dialogue, shared progress.',
  'Dance {T} as a group — choreography, rhythm and team energy.',
  'Small-batch {T} classes — shared projects and expert feedback.',
  'Group {T}: collaborative, project-based and confidence-building.',
];

// Feature-list variants (4 ticks per card, exactly as live)
export const F = [
  ['Live doubt-solving','Regular assessments','Learns at own pace','Exam-focused practice'],
  ['Regular assessments','Learns at own pace','Exam-focused practice','First demo free'],
  ['Board-aligned curriculum','Live doubt-solving','Regular assessments','Learns at own pace'],
  ['Expert subject mentors','Full-length mocks','Concept mastery','First demo free'],
  ['Score-focused coaching','Expert subject mentors','Full-length mocks','Concept mastery'],
  ['Past-paper practice','Score-focused coaching','Expert subject mentors','Full-length mocks'],
  ['Score-improvement focus','Expert test mentors','Flexible scheduling','First demo free'],
  ['Strategy & timing drills','Full-length mock tests','Score-improvement focus','Expert test mentors'],
  ['Full-length mock tests','Score-improvement focus','Expert test mentors','Flexible scheduling'],
  ['Rated practice games','Expert coaches','Progress tracking','Flexible scheduling'],
  ['Expert coaches','Progress tracking','Flexible scheduling','First demo free'],
  ['Build a real portfolio','Live mentor support','Concept + hands-on','Flexible scheduling'],
  ['Live mentor support','Concept + hands-on','Flexible scheduling','First demo free'],
  ['Project-based learning','Build a real portfolio','Live mentor support','Concept + hands-on'],
  ['Recital & exam prep','Personalised practice plan','Flexible scheduling','First demo free'],
  ['Live 1:1 & group classes','Graded syllabus & exam prep','Recital preparation','Personalised practice plan'],
  ['Graded syllabus & exam prep','Recital preparation','Personalised practice plan','Flexible scheduling'],
  ['Breath & pitch training','Stage & exam prep','Flexible scheduling','First demo free'],
  ['Conversation-led classes','Fluency & speaking focus','Structured grammar','Native-level mentors'],
  ['Structured grammar','Native-level mentors','Flexible scheduling','First demo free'],
  ['Fluency & speaking focus','Structured grammar','Native-level mentors','Flexible scheduling'],
  ['Technique + choreography','Stage & exam prep','Expert gurus','Flexible scheduling'],
  ['Graded syllabus','Technique + choreography','Stage & exam prep','Expert gurus'],
  ['Stage & exam prep','Expert gurus','Flexible scheduling','First demo free'],
  ['Portfolio building','Expert artist mentors','Personalised feedback','Flexible scheduling'],
  ['Expert artist mentors','Personalised feedback','Flexible scheduling','First demo free'],
  ['Small interactive batches','Learn with peers','Affordable group pricing','Live weekly sessions'],
  ['Live weekly sessions','Structured curriculum','In-class doubt-solving','Flexible batch timings'],
  ['Affordable group pricing','Live weekly sessions','Structured curriculum','In-class doubt-solving'],
  ['Structured curriculum','In-class doubt-solving','Flexible batch timings','First class free'],
  ['Learn with peers','Affordable group pricing','Live weekly sessions','Structured curriculum'],
];

// Product image per slug (live card artwork; null = navy gradient letter placeholder)
export const IMG = {
  'abacus': null,
  'english-grade-1-7': '2026/05/English-8-300x225.jpg',
  'english-grade-11-12': '2026/05/English-7-300x225.jpg',
  'english-grade-8': '2026/05/English-9-300x225.jpg',
  'english-grade-9-10': '2026/05/English-6-300x225.jpg',
  'mathematics-grade-1-7': null,
  'mathematics-grade-11-12': null,
  'mathematics-grade-8': null,
  'mathematics-grade-9-10': null,
  'phonics-numbers-language-development': null,
  'science-grade-1-7': '2026/05/Kids-Science-1-300x225.jpg',
  'science-grade-8': '2026/05/Kids-Science-2-300x225.jpg',
  'science-grade-9-10': '2026/05/Kids-Science-300x225.jpg',
  'social-science-grade-1-7': '2026/05/Social-Studies-.jpg-3-300x225.jpeg',
  'social-science-grade-8': '2026/05/Social-Studies-.jpg-2-300x225.jpeg',
  'social-science-grade-9-10': '2026/05/Social-Studies-.jpg-300x225.jpeg',
  'vedic-maths-advanced': '2026/05/Vedic-Math-300x225.jpg',
  'vedic-maths-grade-3-6': null,
  'biology-grade-11-12': '2026/05/Biology-300x225.jpg',
  'chemistry-grade-11-12': '2026/05/AP-Chemistry-300x225.jpg',
  'economics': null,
  'essay-writing': null,
  'physics-grade-11-12': '2026/05/Physics.jpg-300x225.jpeg',
  'chess': '2026/05/Chess-300x225.jpg',
  'chess-strategy-mind-sports': '2026/04/Chess-300x225.jpg',
  'rubiks-cube': '2026/05/Rubik-pixabay-54101-300x222.png',
  'ai-ml': '2026/05/AIML-300x225.jpg',
  'ai-prompting': '2026/05/AI-Prompting-300x225.jpg',
  'animation': '2026/05/Animation-300x225.jpg',
  'aws': null,
  'blockly': '2026/05/Blockly-300x225.jpg',
  'c': '2026/05/content-writing-course1s-1-300x225.jpg',
  'data-science': '2026/05/Data-Science-300x225.jpg',
  'devops': null,
  'graphics-design': '2026/05/Graphics-Design-300x225.jpg',
  'java': '2026/05/JAva-300x225.jpg',
  'mit-app-inventor': '2026/05/App-Developement-29-300x225.jpg',
  'python': '2026/05/Python-300x225.jpg',
  'roblox-minecraft': null,
  'robotics': '2026/05/Robotics-300x225.jpg',
  'scratch': '2026/05/Scratch-300x225.jpg',
  'vfx': '2026/05/VFX.jpg-300x225.jpeg',
  'video-editing': '2026/05/Video-Editing-300x225.jpg',
  'web-development': '2026/05/Web-Developement-300x225.jpg',
  'carnatic-violin': '2026/05/Carnatic-3-300x225.jpg',
  'cello': '2026/05/Cello-300x225.jpg',
  'clarinet': '2026/05/clarinet-300x225.png',
  'drums': null,
  'guitar': '2026/05/Guitar-300x225.jpg',
  'indian-flute': null,
  'keyboard': '2026/05/Keyboard-300x225.jpg',
  'music-theory': '2026/05/music-theory.jpg-300x225.jpeg',
  'piano': '2026/05/Piano-1-300x225.jpg',
  'recorder': null,
  'saxophone': '2026/05/Saxophone-300x225.jpg',
  'sitar': null,
  'tabla': '2026/05/Tabla-1-300x225.jpg',
  'trumpet': '2026/05/Trumpet-300x225.jpg',
  'ukulele': '2026/05/Ukulele-300x225.jpg',
  'veena': '2026/05/Veena-300x225.jpg',
  'viola': '2026/05/AI-Prompting-1-300x225.jpg',
  'violin': '2026/05/Violin-300x225.jpg',
  'western-flute': '2026/05/Sanskrit-1-300x225.webp',
  'carnatic-vocal-music': '2026/05/Carnatic-4-300x225.jpg',
  'hindustani-vocal-music': '2026/05/Hindustani-Vocal.jpg-300x225.jpeg',
  'western-vocal-music': '2026/05/Western-Music-.jpg-300x225.jpeg',
  'french': '2026/05/French-300x225.jpg',
  'german': '2026/05/German-300x225.jpg',
  'hindi': '2026/05/Hindi-300x225.jpg',
  'kannada': '2026/05/Kannada-300x225.jpg',
  'malayalam': '2026/05/Malayalam-300x225.jpg',
  'mandarin': '2026/05/Mandarin-300x225.jpg',
  'russian': '2026/05/Russian-300x225.jpg',
  'sanskrit': '2026/05/Sanskrit-300x225.jpg',
  'spanish': '2026/05/Spanish-300x225.jpg',
  'spoken-english-confident-communication': null,
  'tamil': null,
  'telugu': null,
  'bharatnatyam-dance': '2026/05/Bharatnatyam.jpg-300x225.jpeg',
  'bollywood-dance': '2026/05/Bollywood-300x225.jpg',
  'hip-hop-dance': null,
  'kathak-dance': '2026/05/Kathak-300x225.jpg',
  'kuchipudi-dance': '2026/05/Kuchipudi-300x225.jpg',
  'western-dance-dance': '2026/05/Sanskrit-300x225.webp',
  'zumba-dance': null,
  'art-and-craft': null,
  'arts-painting': '2026/05/Arts-And-Painting-1-300x225.jpg',
  'creative-writing': '2026/05/content-writing-course1s-300x225.jpg',
  'public-speaking': '2026/05/Public-Speaking-300x225.jpg',
  'spelling-competition': null,
};

// Self-hosted photo first, WP hotlink only as the fallback — same precedence the
// product pages use (see courseImages.js). IMG only covers courses that existed on
// the old WP site, so the 18 India-localisation additions (JEE, NEET, CUET,
// Olympiad, the Class 11-12 commerce/CS subjects…) had no entry and rendered as
// empty grey cards; every one of them does have a self-hosted photo on disk.
export const imgUrl = slug => imageFor({ slug, image_url: IMG[slug] ? UP + IMG[slug] : null });

// Card tuple: [title, slug, rating, reviews, descIdx, featIdx, priceNow, priceWas, subFilter]
const COURSE_PANELS_RAW = {
  'academics-primary-middle-classes-1-8': {
    subs: ['All','Abacus','English','Mathematics','Science','Social Science','Vedic Maths'],
    cards: [
      ['Abacus','abacus','4.9',377,0,0,'₹600','₹1,000','abacus'],
      ['English Grade 1-7','english-grade-1-7','4.9',221,0,0,'₹600','₹1,000','english'],
      ['English Grade 8','english-grade-8','4.8',234,1,1,'₹750','₹1,250','english'],
      ['Mathematics Grade 1-7','mathematics-grade-1-7','4.7',91,2,2,'₹600','₹1,000','mathematics'],
      ['Mathematics Grade 8','mathematics-grade-8','4.8',130,2,2,'₹750','₹1,250','mathematics'],
      ['Phonics, Numbers & Language Development','phonics-numbers-language-development','4.7',395,2,2,'₹600','₹1,000',''],
      ['Science Grade 1-7','science-grade-1-7','4.6',260,0,0,'₹600','₹1,000','science'],
      ['Science Grade 8','science-grade-8','4.7',299,0,0,'₹750','₹1,250','science'],
      ['Social Science Grade 1-7','social-science-grade-1-7','4.9',325,2,2,'₹600','₹1,000','social-science'],
      ['Social Science Grade 8','social-science-grade-8','4.8',338,0,0,'₹750','₹1,250','social-science'],
      ['Vedic Maths (Advanced)','vedic-maths-advanced','4.8',182,0,0,'₹1,000','₹1,700','vedic-maths'],
      ['Vedic Maths (Grade 3-6)','vedic-maths-grade-3-6','4.9',169,2,2,'₹600','₹1,000','vedic-maths'],
    ],
  },
  'academics-secondary-senior-secondary-classes-9-12': {
    subs: ['All','Mathematics','English','Science','Physics','Chemistry','Biology','Social Science','History','Political Science','Geography','Accountancy','Business Studies','Economics','Computer Science'],
    cards: [
      ['Biology Grade 11-12','biology-grade-11-12','4.9',125,1,1,'₹1,200','₹2,000','biology'],
      ['Chemistry Grade 11-12','chemistry-grade-11-12','4.7',99,2,2,'₹1,200','₹2,000','chemistry'],
      ['Economics','economics','4.8',450,2,2,'₹1,200','₹2,000','economics'],
      ['English Grade 11-12','english-grade-11-12','4.6',468,1,1,'₹1,200','₹2,000','english'],
      ['English Grade 9-10','english-grade-9-10','4.8',442,2,2,'₹1,000','₹1,700','english'],
      ['Mathematics Grade 11-12','mathematics-grade-11-12','4.6',416,0,0,'₹1,200','₹2,000','mathematics'],
      ['Mathematics Grade 9-10','mathematics-grade-9-10','4.7',403,2,2,'₹1,000','₹1,700','mathematics'],
      ['Physics Grade 11-12','physics-grade-11-12','4.8',86,1,1,'₹1,200','₹2,000','physics'],
      ['Science Grade 9-10','science-grade-9-10','4.8',494,0,0,'₹1,000','₹1,700','science'],
      ['Social Science Grade 9-10','social-science-grade-9-10','4.8',190,0,0,'₹1,000','₹1,700','social-science'],
      ['History Grade 11-12','history-grade-11-12','4.8',164,1,1,'₹1,200','₹2,000','history'],
      ['Political Science Grade 11-12','political-science-grade-11-12','4.7',131,1,1,'₹1,200','₹2,000','political-science'],
      ['Geography Grade 11-12','geography-grade-11-12','4.8',147,2,2,'₹1,200','₹2,000','geography'],
      ['Accountancy Grade 11-12','accountancy-grade-11-12','4.9',276,0,0,'₹1,200','₹2,000','accountancy'],
      ['Business Studies Grade 11-12','business-studies-grade-11-12','4.8',241,1,1,'₹1,200','₹2,000','business-studies'],
      ['Applied Mathematics Grade 11-12','applied-mathematics-grade-11-12','4.7',118,2,2,'₹1,200','₹2,000','mathematics'],
      ['Computer Science Grade 11-12','computer-science-grade-11-12','4.9',309,0,0,'₹1,200','₹2,000','computer-science'],
      ['Informatics Practices Grade 11-12','informatics-practices-grade-11-12','4.7',152,1,1,'₹1,200','₹2,000','computer-science'],
    ],
  },
  'competitive-exams': {
    subs: ['All','JEE','NEET','CUET','Olympiads'],
    cards: [
      ['JEE Main','jee-main','4.9',412,0,0,'₹1,500','₹2,500','jee'],
      ['JEE Advanced','jee-advanced','4.8',238,1,1,'₹1,800','₹3,000','jee'],
      ['NEET (UG)','neet-ug','4.9',457,0,0,'₹1,500','₹2,500','neet'],
      ['CUET (UG)','cuet-ug','4.7',196,2,2,'₹1,200','₹2,000','cuet'],
      ['Olympiad Preparation (Maths, Science & English)','olympiad-preparation','4.8',283,1,1,'₹900','₹1,500','olympiads'],
    ],
  },
  'mind-sports': {
    subs: ['All','Chess'],
    cards: [
      ['Chess','chess','4.9',485,9,9,'₹300','₹500','chess'],
      ['Chess Strategy & Mind Sports','chess-strategy-mind-sports','4.9',425,10,10,'₹750','₹1,250',''],
      ['Rubik’s Cube','rubiks-cube','4.6',420,10,10,'₹300','₹500',''],
    ],
  },
  'it-technologies': {
    subs: ['All','Scratch','Python','Java','C++','Web Development','Robotics','Data Science','AI Prompting','Graphics Design','Video Editing','Animation','VFX','AWS','DevOps','MIT App Inventor','Blockly'],
    cards: [
      ['AI & ML','ai-ml','4.7',87,11,11,'₹600','₹1,000',''],
      ['AI Prompting','ai-prompting','4.7',295,12,12,'₹300','₹500','ai-prompting'],
      ['Animation','animation','4.7',43,13,13,'₹450','₹750','animation'],
      ['AWS','aws','4.7',199,13,13,'₹450','₹750','aws'],
      ['Blockly','blockly','4.7',227,11,11,'₹300','₹500','blockly'],
      ['C++','c','4.7',183,13,13,'₹300','₹500','c'],
      ['Data Science','data-science','4.6',100,12,12,'₹450','₹750','data-science'],
      ['DevOps','devops','4.6',368,11,11,'₹450','₹750','devops'],
      ['Graphics Design','graphics-design','4.9',373,12,12,'₹300','₹500','graphics-design'],
      ['Java','java','4.6',40,11,11,'₹425','₹750','java'],
      ['MIT App Inventor','mit-app-inventor','4.9',313,11,11,'₹300','₹500','mit-app-inventor'],
      ['Python','python','4.8',474,12,12,'₹300','₹500','python'],
      ['Roblox & Minecraft','roblox-minecraft','4.7',331,13,13,'₹300','₹500',''],
      ['Robotics','robotics','4.8',482,12,12,'₹300','₹500','robotics'],
      ['Scratch','scratch','4.8',214,13,13,'₹300','₹500','scratch'],
      ['VFX','vfx','4.8',186,12,12,'₹300','₹500','vfx'],
      ['Video Editing','video-editing','4.8',386,13,13,'₹450','₹750','video-editing'],
      ['Web Development','web-development','4.6',248,12,12,'₹300','₹500','web-development'],
    ],
  },
  'musical-instruments': {
    subs: ['All','Cello','Saxophone','Guitar','Ukulele','Piano','Violin','Viola','Veena','Indian Flute','Western Flute','Clarinet','Drums','Trumpet','Keyboard','Tabla','Music Theory','Sitar','Recorder','Carnatic Violin'],
    cards: [
      ['Carnatic Violin','carnatic-violin','4.8',466,14,14,'₹1,000','₹1,700','carnatic-violin'],
      ['Cello','cello','4.7',315,15,15,'₹1,500','₹2,500','cello'],
      ['Clarinet','clarinet','4.8',458,16,14,'₹1,500','₹2,500','clarinet'],
      ['Drums','drums','4.7',159,15,15,'₹600','₹1,000','drums'],
      ['Guitar','guitar','4.7',463,17,15,'₹600','₹1,000','guitar'],
      ['Indian Flute','indian-flute','4.6',128,18,15,'₹600','₹1,000','indian-flute'],
      ['Keyboard','keyboard','4.8',146,14,14,'₹600','₹1,000','keyboard'],
      ['Music Theory','music-theory','4.7',271,14,14,'₹600','₹1,000','music-theory'],
      ['Piano','piano','4.9',437,19,16,'₹600','₹1,000','piano'],
      ['Recorder','recorder','4.9',401,15,15,'₹600','₹1,000','recorder'],
      ['Saxophone','saxophone','4.7',167,20,15,'₹1,000','₹1,700','saxophone'],
      ['Sitar','sitar','4.6',336,21,16,'₹600','₹1,000','sitar'],
      ['Tabla','tabla','4.7',471,22,15,'₹600','₹1,000','tabla'],
      ['Trumpet','trumpet','4.9',297,23,16,'₹1,500','₹2,500','trumpet'],
      ['Ukulele','ukulele','4.6',120,24,15,'₹600','₹1,000','ukulele'],
      ['Veena','veena','4.8',302,14,14,'₹600','₹1,000','veena'],
      ['Viola','viola','4.7',419,14,14,'₹1,000','₹1,700','viola'],
      ['Violin','violin','4.6',276,15,15,'₹1,000','₹1,700','violin'],
      ['Western Flute','western-flute','4.9',141,18,16,'₹1,000','₹1,700','western-flute'],
    ],
  },
  'vocal-music': {
    subs: ['All','Carnatic','Hindustani','Western'],
    cards: [
      ['Carnatic Vocal Music','carnatic-vocal-music','4.9',45,25,17,'₹600','₹1,000','carnatic'],
      ['Hindustani Vocal Music','hindustani-vocal-music','4.6',84,26,17,'₹600','₹1,000','hindustani'],
      ['Western Vocal Music','western-vocal-music','4.8',162,27,17,'₹600','₹1,000','western'],
    ],
  },
  'languages': {
    subs: ['All','Spanish','French','German','Mandarin','Russian','Sanskrit','Hindi','Tamil','Telugu','Kannada','Malayalam'],
    cards: [
      ['French','french','4.8',262,28,18,'₹300','₹500','french'],
      ['German','german','4.6',444,29,19,'₹300','₹500','german'],
      ['Hindi','hindi','4.8',374,29,19,'₹300','₹500','hindi'],
      ['Kannada','kannada','4.8',278,28,18,'₹300','₹500','kannada'],
      ['Malayalam','malayalam','4.7',291,30,20,'₹300','₹500','malayalam'],
      ['Mandarin','mandarin','4.8',62,29,19,'₹300','₹500','mandarin'],
      ['Russian','russian','4.6',88,30,20,'₹300','₹500','russian'],
      ['Sanskrit','sanskrit','4.8',322,30,20,'₹300','₹500','sanskrit'],
      ['Spanish','spanish','4.7',223,28,18,'₹300','₹500','spanish'],
      ['Spoken English & Confident Communication','spoken-english-confident-communication','4.6',372,29,19,'₹650','₹1,100',''],
      ['Tamil','tamil','4.8',426,28,18,'₹300','₹500','tamil'],
      ['Telugu','telugu','4.9',57,30,20,'₹300','₹500','telugu'],
    ],
  },
  'dance': {
    subs: ['All','Bollywood','Kuchipudi','Bharatnatyam','Kathak','Hip Hop','Zumba','Western Dance'],
    cards: [
      ['Bharatnatyam Dance','bharatnatyam-dance','4.7',267,31,21,'₹300','₹500','bharatnatyam'],
      ['Bollywood Dance','bollywood-dance','4.7',59,32,22,'₹300','₹500','bollywood'],
      ['Hip Hop Dance','hip-hop-dance','4.9',449,32,22,'₹300','₹500','hip-hop'],
      ['Kathak Dance','kathak-dance','4.9',293,32,22,'₹300','₹500','kathak'],
      ['Kuchipudi Dance','kuchipudi-dance','4.6',124,33,23,'₹300','₹500','kuchipudi'],
      ['Western Dance','western-dance-dance','4.7',171,33,23,'₹300','₹500','western-dance'],
      ['Zumba Dance','zumba-dance','4.8',462,31,21,'₹300','₹500','zumba'],
    ],
  },
  'creative-skills': {
    subs: ['All','Art and Craft','Public Speaking','Creative Writing','Essay Writing','Spelling Competition'],
    cards: [
      ['Art and Craft','art-and-craft','4.7',51,34,24,'₹200','₹350','art-and-craft'],
      ['Arts & Painting','arts-painting','4.8',194,35,25,'₹200','₹350',''],
      ['Creative Writing','creative-writing','4.9',233,35,25,'₹300','₹500','creative-writing'],
      ['Essay Writing','essay-writing','4.8',398,35,25,'₹1,000','₹1,700','essay-writing'],
      ['Public Speaking','public-speaking','4.7',311,36,25,'₹150','₹250','public-speaking'],
      ['Spelling Competition','spelling-competition','4.6',428,35,25,'₹300','₹500','spelling-competition'],
    ],
  },
};

const GROUP_PANELS_RAW = {
  'mind-sports': {
    subs: ['All','Chess'],
    cards: [
      ['Chess','chess','4.9',485,37,26,'₹300','₹500','chess'],
      ['Rubik’s Cube','rubiks-cube','4.6',420,38,26,'₹300','₹500',''],
    ],
  },
  'it-technologies': {
    subs: ['All','Scratch','Python','Robotics'],
    cards: [
      ['Python','python','4.8',474,39,27,'₹300','₹500','python'],
      ['Roblox & Minecraft','roblox-minecraft','4.7',331,40,28,'₹300','₹500',''],
      ['Robotics','robotics','4.8',482,39,29,'₹300','₹500','robotics'],
      ['Scratch','scratch','4.8',214,40,27,'₹300','₹500','scratch'],
    ],
  },
  'languages': {
    subs: ['All','Spanish','French','Hindi','Tamil','Telugu'],
    cards: [
      ['French','french','4.8',262,41,29,'₹300','₹500','french'],
      ['Hindi','hindi','4.8',374,42,27,'₹300','₹500','hindi'],
      ['Spanish','spanish','4.7',223,41,30,'₹300','₹500','spanish'],
      ['Tamil','tamil','4.8',426,41,28,'₹300','₹500','tamil'],
      ['Telugu','telugu','4.9',57,43,29,'₹300','₹500','telugu'],
    ],
  },
  'dance': {
    subs: ['All','Bollywood','Hip Hop'],
    cards: [
      ['Bollywood Dance','bollywood-dance','4.7',59,44,27,'₹300','₹500','bollywood'],
      ['Hip Hop Dance','hip-hop-dance','4.9',449,44,27,'₹300','₹500','hip-hop'],
    ],
  },
  'creative-skills': {
    subs: ['All','Art and Craft','Public Speaking','Creative Writing','Spelling Competition'],
    cards: [
      ['Art and Craft','art-and-craft','4.7',51,45,28,'₹200','₹350','art-and-craft'],
      ['Arts & Painting','arts-painting','4.8',194,46,27,'₹200','₹350',''],
      ['Creative Writing','creative-writing','4.9',233,46,30,'₹300','₹500','creative-writing'],
      ['Public Speaking','public-speaking','4.7',311,46,28,'₹150','₹250','public-speaking'],
      ['Spelling Competition','spelling-competition','4.6',428,46,30,'₹300','₹500','spelling-competition'],
    ],
  },
};

const expandCard = group => ([t, slug, r, n, d, f, now, was, sub]) => ({
  title: t, slug, rating: r, reviews: n,
  desc: D[d].split('{T}').join(t),
  feats: F[f],
  now, was, sub,
  per: group ? '/ per class · group' : '/ per class',
  img: imgUrl(slug),
});

const expandPanels = (raw, group) => Object.fromEntries(
  Object.entries(raw).map(([cat, p]) => [cat, { subs: p.subs, cards: p.cards.map(expandCard(group)) }])
);

export const COURSE_TABS = [
  { cat: 'academics-primary-middle-classes-1-8', label: 'Academics — Primary & Middle (Classes 1-8)' },
  { cat: 'academics-secondary-senior-secondary-classes-9-12', label: 'Academics — Secondary & Senior Secondary (Classes 9-12)' },
  { cat: 'competitive-exams', label: 'Competitive Exams' },
  { cat: 'mind-sports', label: 'Mind Sports' },
  { cat: 'it-technologies', label: 'IT Technologies' },
  { cat: 'musical-instruments', label: 'Musical Instruments' },
  { cat: 'vocal-music', label: 'Vocal Music' },
  { cat: 'languages', label: 'Languages' },
  { cat: 'dance', label: 'Dance' },
  { cat: 'creative-skills', label: 'Creative Skills' },
];
export const GROUP_TABS = [
  { cat: 'mind-sports', label: 'Mind Sports' },
  { cat: 'it-technologies', label: 'IT Technologies' },
  { cat: 'languages', label: 'Languages' },
  { cat: 'dance', label: 'Dance' },
  { cat: 'creative-skills', label: 'Creative Skills' },
];
export const COURSE_PANELS = expandPanels(COURSE_PANELS_RAW, false);
export const GROUP_PANELS = expandPanels(GROUP_PANELS_RAW, true);

// Trending / Popular Video rows (compact demo-cards, copy verbatim from live)
export const TRENDING = [
  ['Art and Craft','art-and-craft','Live one-to-one and group Art and Craft classes with expert…','₹200','₹350'],
  ['NEET (UG)','neet-ug','Live 1:1 and group NEET coaching across Physics, Chemistry…','₹1,500','₹2,500'],
  ['JEE Main','jee-main','Live 1:1 and group JEE Main coaching with expert mentors.…','₹1,500','₹2,500'],
  ['Accountancy Grade 11-12','accountancy-grade-11-12','Live 1:1 and group Accountancy classes for CBSE and ISC.…','₹1,200','₹2,000'],
  ['Computer Science Grade 11-12','computer-science-grade-11-12','Live 1:1 and group Computer Science classes with expert…','₹1,200','₹2,000'],
  ['Olympiad Preparation (Maths, Science & English)','olympiad-preparation','Live IMO, NSO and IEO olympiad training for Classes 1-10.…','₹900','₹1,500'],
  ['Mathematics Grade 9-10','mathematics-grade-9-10','Live 1:1 and group Mathematics classes with expert mentors.…','₹1,000','₹1,700'],
  ['CUET (UG)','cuet-ug','Live 1:1 and group CUET coaching with expert mentors.…','₹1,200','₹2,000'],
].map(([t, slug, d, now, was]) => ({ title: t, slug, desc: d, now, was, img: imgUrl(slug) }));

export const VIDEO_COURSES = [
  ['Arts & Painting','arts-painting','Live 1:1 and group Arts & Painting classes with expert…','₹200','₹350'],
  ['Art and Craft','art-and-craft','Live one-to-one and group Art and Craft classes with expert…','₹200','₹350'],
  ['Vedic Maths (Grade 3-6)','vedic-maths-grade-3-6','Self-paced Vedic Maths — mental calculation shortcuts for kids.…','₹600','₹1,000'],
].map(([t, slug, d, now, was], i) => ({ title: t, slug, desc: d, now, was, img: imgUrl(slug), badge: i === 0 ? 'Most Popular' : null }));

// Most Popular Subjects grid (tag colors sampled from live CSS)
export const SUBJECT_TAGS = {
  'Trending': '#E0654A', 'Popular': '#7C4DBC', 'Kids Favourite': '#0E9F8E',
  'Top Rated': '#C99A2E', 'Exam Prep': '#2563EB',
};
// No prices here, deliberately.
//
// Every tile used to carry a hardcoded "/hr" figure, and every one of them
// disagreed with something: JEE Main and NEET were advertised at ₹750 while the
// course cards further up the SAME page said ₹1,500 and the server bills ₹1,500;
// Chess and Bharatnatyam showed ₹750 against a real 1-on-1 rate of ₹600; Physics
// and Biology showed ₹750 against ₹1,200. A family captured on ₹750 and quoted
// ₹1,500 on the follow-up call is a lost lead and a fair accusation of bait
// pricing — under a homepage heading that reads "Transparent · No hidden fees".
//
// The cure is structural, not a corrected number: a rate typed in a fourth
// place will drift again the first time rates.json changes. These tiles are
// navigation, so they now navigate, and the price is stated where it is derived
// from the rate sheet — the catalogue card, the course page and Plans & Pricing.
export const POPULAR_SUBJECTS = [
  { tag: 'Trending', name: 'AI & Machine Learning', icon: 'brain', q: 'ai-ml' },
  { tag: 'Popular', name: 'Python Programming', icon: 'code', q: 'python' },
  { tag: 'Kids Favourite', name: 'Robotics', icon: 'bot', q: 'robotics' },
  { tag: 'Top Rated', name: 'Mathematics', icon: 'calculator', q: 'Mathematics' },
  { tag: null, name: 'Physics', icon: 'atom', q: 'Physics' },
  { tag: null, name: 'Biology', icon: 'dna', q: 'Biology' },
  { tag: 'Popular', name: 'Violin', icon: 'music', q: 'violin' },
  { tag: null, name: 'Piano', icon: 'music', q: 'piano' },
  { tag: 'Exam Prep', name: 'JEE Main', icon: 'radical', q: 'JEE' },
  { tag: 'Exam Prep', name: 'NEET', icon: 'pen', q: 'NEET' },
  { tag: null, name: 'Chess', icon: 'castle', q: 'chess' },
  { tag: null, name: 'Bharatnatyam', icon: 'person', q: 'bharatnatyam' },
];

export const TEACHERS = [
  { name: 'Vijayalakshmi', subj: 'Vocal Music · Carnatic Vocals · Hindustani Vocals', exp: 'Online', slug: 'vijayalakshmi', img: teacherImg('vijayalakshmi') },
  { name: 'Vipul', subj: 'Computer Science · Python Programming · Java', exp: 'Online', slug: 'vipul', img: teacherImg('vipul') },
  { name: 'Shamim', subj: 'Violin · Music Theory · Piano', exp: 'Online', slug: 'shamim', img: teacherImg('shamim') },
  { name: 'Surajit', subj: 'Drums · Percussion', exp: '9+ yrs · Online', slug: 'surajit', img: teacherImg('surajit') },
  { name: 'Prashasti', subj: 'Piano', exp: 'Online', slug: 'prashasti', img: teacherImg('prashasti') },
  { name: 'Rahul', subj: 'Python Programming · AI & Machine Learning · Web Development', exp: '5+ yrs · Online', slug: 'rahul', img: teacherImg('rahul') },
  { name: 'Nisitha', subj: 'Spanish Language', exp: '7+ yrs · Online', slug: 'nisitha', img: teacherImg('nisitha') },
  { name: 'Pinki', subj: 'Yoga · Naturopathy · Wellness', exp: '20+ yrs · Online', slug: 'pinki', img: teacherImg('pinki') },
];

// Placeholder testimonials, kept by the owner's decision until real approved
// reviews replace them (they retire one by one — see TestimonialSlider).
//
// SIX were removed on 14 Aug 2026: New Jersey USA, Singapore, Dubai UAE,
// London UK, Sydney Australia and Lisbon Portugal. The owner confirmed the
// business serves India only, and the overseas service claims were stripped
// from the policy pages on 10 Aug — but these cards were still telling every
// visitor that the customers are abroad, which is the same claim in a more
// persuasive form.
//
// Deleted rather than relocated: inventing "Parent, Pune" in place of "Parent,
// Singapore" would just be a different fiction, and real reviews are one click
// from displacing these anyway.
export const TESTIMONIALS = [
  { init: 'I', color: '#0E7490', name: 'Ishaan Mehta', role: 'Student, Pune · JEE Main prep, Class 11',
    text: 'I was drowning in JEE coaching-class material and getting nowhere. My tutor rebuilt my Physics and Maths fundamentals from the NCERT up, then drilled me on previous-year papers. My mock percentile went from the 60s to the low 90s over two terms.' },
  { init: 'R', color: '#B45309', name: 'Rohan Malhotra', role: 'Student, Delhi · Class 12 Physics (CBSE boards)',
    text: 'Class 12 Physics was wrecking my board average. My tutor broke every chapter down with real-world examples and worked through years of CBSE sample papers with me. I finished the boards on 92 in Physics — my weakest subject became my best one.' },
];

export const WHY_ITEMS = [
  { icon: 'video', t: 'Live Interactive Sessions', d: 'Real-time classes with expert tutors — not pre-recorded videos. Ask questions and get answers instantly.' },
  { icon: 'comments', t: 'Post-Class Mentoring', d: 'Tutors remain accessible after every session. Doubts, homework, or revision — support continues beyond the class.' },
  { icon: 'refund', t: 'Flexible Refund Policy', d: 'Not satisfied? We offer a hassle-free refund. No fine print, no pressure — your trust comes first.' },
  { icon: 'nolock', t: 'No Fixed Commitment', d: 'Join month-to-month with no lock-in. Pause, switch subjects, or stop anytime — completely your choice.' },
  { icon: 'cert', t: 'Certification', d: 'Earn a recognised certificate on course completion. Showcase achievements and motivate continued learning.' },
  { icon: 'rupee', t: 'Value for Money', d: 'Top-quality tutoring at transparent, affordable rates. 1-on-1 and group options to suit every budget.' },
];

// Ranges, not single figures, and taken from the canonical rate sheet
// (database/data/rates.json) rather than invented here.
//
// A flat "₹750" for Academics was wrong in both directions: primary-class
// tuition starts at ₹600, while Classes 9-12 start at ₹1,000 and JEE/NEET bill
// ₹1,500 — so the section promising "Simple, Honest Pricing" under-quoted the
// exact courses a parent is most likely to be shopping for. Music showed ₹600
// while Violin has never been below ₹1,000. A range is honest about a catalogue
// that genuinely varies by subject and class, and the per-class unit is stated
// because that is what an order is actually billed in.
export const PRICING = [
  { icon: 'calculator', cat: 'Academics & Exams', subjects: 'Maths, Science, Social Science, Commerce, JEE / NEET / CUET, Olympiads', rate: '₹600 – ₹1,500', featured: false },
  { icon: 'code', cat: 'Coding & IT', subjects: 'Python, Java, AI & ML, Robotics, Blockly, Scratch, Web Dev', rate: '₹600 – ₹1,200', featured: true },
  { icon: 'music', cat: 'Music, Dance & Arts', subjects: 'Piano, Violin, Guitar, Vocals, Bharatnatyam, Kathak, Painting', rate: '₹600 – ₹2,000', featured: false },
];

export const ABOUT_LEAD = 'Indiatutors Online is a trusted learning platform connecting students with expert tutors for Academics, Competitive Exams, Coding, Music, Dance and Languages. From early learners to exam aspirants, we make high-quality, personalised teaching accessible — anywhere, at any pace.';
export const ABOUT_LIST = [
  { icon: 'laptop', t: 'Online Live Classes', d: 'Interactive 1-on-1 & small-group sessions with vetted tutors, on a flexible schedule.' },
  { icon: 'home', t: 'Home Tuitions', d: 'Verified in-person tutors in your locality for focused, face-to-face learning.' },
  { icon: 'play', t: 'Self-Paced Video Courses', d: 'Structured recorded courses to learn anytime, revisit lessons and practise at your own speed.' },
];
// Two removals, 2026-08-10:
//   '15+ Countries reached' — the owner confirmed the business is India-only.
//   '4.9★ Avg. rating'      — a fabricated rating. The 7 August sweep deleted
//                             every other invented score but missed this one,
//                             because it renders on the HOME page from this
//                             file while the similarly-named ABOUT_STATS in
//                             courseDetail.js (already cleaned) sits on course
//                             pages. Two exports, one name, one survivor.
export const ABOUT_STATS = [['8,000+','Students trained'],['75+','Expert tutors'],['100+','Subjects & skills'],['Free','First demo class']];
export const HOW_STEPS = [
  { n: 1, icon: 'search', t: 'Find Your Course', d: 'Browse 100+ courses across Academics, Coding, Music, Dance & more. Filter by subject, age, or learning format.' },
  { n: 2, icon: 'calendar', t: 'Book a Free Trial', d: 'Try a class for free — no payment, no commitment. Meet your tutor and see if the fit is right.' },
  { n: 3, icon: 'rocket', t: 'Start Learning', d: 'Enrol, attend live classes or watch videos, earn a certificate, and get post-class mentoring support.' },
];

export const DEMO_VIDEOS = [
  { id: 'FtVS2DYSByE', title: 'Indiatutors Online — Who We Are', caption: 'About Indiatutors Online — Our Story' },
  { id: 'BxzPmkGhhLU', title: 'Creative Skills Demo Class — Art for Kids', caption: 'Creative Skills — Sample Class for Kids' },
];
