// Legal / policy content for Indiatutors Online — the four documents linked from
// the footer: Terms & Conditions, Payment & Refund Terms, Refer & Earn Policy and
// Privacy Policy. Structure and depth follow the sister site's policy pages; every
// fact (rates, GST, refund windows, contact details) comes from this repo instead.
//
// Rendered by pages/LegalPage.jsx. Sections and subsections are numbered by the
// renderer, so headings here carry no numbers — reorder the array to renumber.
// Inside any string only two markups are parsed: **bold** and [label](/path).
//
// (Have your legal counsel review these before relying on them for compliance.)

// The registered operating entity, shown in the address and definition blocks.
// Confirmed by the owner on 11 August 2026. The Consumer Protection (E-Commerce)
// Rules 2020 require the legal name to be displayed, so this must stay the
// registered name — not the brand, which is "Indiatutors Online".
export const ENTITY = 'Indiatutors Online LLP';

// Applied once at module load so the entity name lives in exactly one place.
const withEntity = (v) =>
  typeof v === 'string' ? v.replaceAll('__ENTITY__', ENTITY)
    : Array.isArray(v) ? v.map(withEntity)
      : v && typeof v === 'object'
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, withEntity(x)]))
        : v;

export const LEGAL = withEntity({
  terms: {
    slug: 'terms-conditions',
    eyebrow: 'Legal',
    title: 'Terms & Conditions',
    updated: '3 August 2026',
    effective: '3 August 2026',
    intro: 'These Terms & Conditions govern your access to Indiatutors Online — the website at indiatutorsonline.com and every class, course and service booked through it. Please read them before you book a demo, create an account or pay for any programme; by doing any of those things you confirm that you have read, understood and agreed to be bound by them.',

    sections: [
      {
        id: 'interpretation-definitions',
        h: 'Interpretation & Definitions',
        blocks: [
          { type: 'p', text: 'These Terms form a binding agreement between you and **__ENTITY__**, which operates Indiatutors Online from New Town, Kolkata — 700161, West Bengal, India, and serves students across India.' },
        ],
        subs: [
          {
            h: 'Interpretation',
            blocks: [
              { type: 'p', text: 'Words with an initial capital letter have the meanings given to them in this section. Those meanings apply whether the word is used in the singular or the plural. Headings are included for convenience only and do not affect the interpretation of any clause. A reference to a statute includes that statute as amended, re-enacted or replaced from time to time, together with the rules and regulations made under it.' },
            ],
          },
          {
            h: 'Definitions',
            blocks: [
              {
                type: 'defs',
                items: [
                  ['“Company”, “We”, “Us”, “Our”', 'Indiatutors Online, operated by __ENTITY__, with its place of business at New Town, Kolkata — 700161, West Bengal, India.'],
                  ['“Platform”, “Website”', 'The website available at indiatutorsonline.com, together with any sub-domain, mobile application, learning portal or booking system that we operate.'],
                  ['“Services”', 'All educational and related services offered through the Platform, including live one-to-one classes, small-group classes, self-paced video courses, free demo classes and any associated study material or support.'],
                  ['“User”, “You”, “Your”', 'Any person who accesses or uses the Platform, including students, parents, guardians and visitors who have not enrolled.'],
                  ['“Student”', 'A User who books a demo class, enrols in a programme or purchases any Service on the Platform.'],
                  ['“Parent”, “Guardian”', 'The parent or lawful guardian of a Student who is below 18 years of age, who holds the account, accepts these Terms on the Student’s behalf and is responsible for payment.'],
                  ['“Tutor”, “Instructor”', 'An educator or subject-matter expert engaged to deliver Services through the Platform.'],
                  ['“Class”', 'A scheduled live teaching session between a Tutor and one Student (one-to-one) or a small group of Students.'],
                  ['“Demo Class”', 'The complimentary 30-minute introductory class offered once to each new Student.'],
                  ['“Video Course”', 'A self-paced, pre-recorded course purchased on the Platform and streamed from our hosting provider.'],
                  ['“Content”', 'All text, images, video, audio, lesson plans, worksheets, assessments, notes and other material created, uploaded or shared through the Platform.'],
                  ['“Plan”', 'A monthly, quarterly or annual package of Classes purchased in advance, as described on the [Plans & pricing](/plans) page.'],
                  ['“Registration Fee”', 'The one-time onboarding fee of ₹750 payable by each new Student.'],
                  ['“DPDP Act”', 'The Digital Personal Data Protection Act, 2023 (India).'],
                  ['“Consumer Protection Act”', 'The Consumer Protection Act, 2019 (India), together with the rules made under it.'],
                  ['“GDPR”', 'Regulation (EU) 2016/679, the General Data Protection Regulation, and its United Kingdom equivalent (UK GDPR), which apply only to Users resident in those territories.'],
                ],
              },
            ],
          },
        ],
      },

      {
        id: 'acknowledgment',
        h: 'Acknowledgment',
        blocks: [
          { type: 'p', text: 'By accessing the Platform, booking a Demo Class, creating an account or purchasing any Service, you confirm that:' },
          {
            type: 'list',
            items: [
              'You have read, understood and agree to these Terms, our [Privacy Policy](/privacy-policy) and our [Payment & Refund Terms](/payment-refund-policy), each of which forms part of this agreement.',
              'You are at least 18 years old, or you are a Parent or Guardian acting on behalf of a Student below that age and you accept these Terms on their behalf.',
              'You have the legal capacity to enter into a binding contract under the law that applies to you.',
              'The information you give us at registration and at checkout is accurate, complete and current.',
              'Your use of the Platform does not breach any law or regulation that applies to you.',
            ],
          },
          { type: 'p', text: 'If you do not agree with any part of these Terms, you must not use the Platform or purchase any Service.' },
        ],
      },

      {
        id: 'eligibility-accounts',
        h: 'Eligibility & User Accounts',
        subs: [
          {
            h: 'Age Requirements & Parental Consent',
            blocks: [
              { type: 'p', text: 'We teach learners of every age, including young children. Under the DPDP Act, a person below **18 years** of age is a child, and we may process a child’s personal data only with the verifiable consent of a Parent or Guardian. Accordingly, where the Student is below 18, the account must be opened and held by the Parent or Guardian, who is the contracting party for all purposes under these Terms.' },
              { type: 'p', text: 'We may ask for reasonable evidence of the relationship or of the age of the account holder before activating an account or releasing information about a Student. We do not knowingly permit a child to contract with us directly.' },
            ],
          },
          {
            h: 'Account Registration',
            blocks: [
              { type: 'p', text: 'You must create an account to purchase Services or to use member-only features. When you register, you agree to:' },
              {
                type: 'list',
                items: [
                  'Provide accurate, complete and current registration details, and keep them up to date.',
                  'Keep your login credentials confidential and not share them with any other person.',
                  'Tell us immediately at [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) if you suspect that your account has been accessed without authorisation.',
                  'Accept responsibility for all activity carried out under your account, including bookings and payments made by anyone you allow to use it.',
                ],
              },
            ],
          },
          {
            h: 'One Account per Student',
            blocks: [
              { type: 'p', text: 'Each Student may hold only one account. Opening additional accounts in order to claim more than one Demo Class, to obtain a referral reward that would otherwise be disqualified, or to circumvent any other provision of these Terms is prohibited and may result in suspension or termination of every account concerned.' },
            ],
          },
          {
            h: 'Service Communications',
            blocks: [
              { type: 'p', text: 'We will send class links, timetables, reminders, invoices, receipts and other service messages to the contact details registered on the account, including by email, telephone and WhatsApp. These are transactional messages that form part of the Services and are not marketing communications; you may not opt out of them while your enrolment is active.' },
            ],
          },
        ],
      },

      {
        id: 'scope-of-services',
        h: 'Scope of Services',
        subs: [
          {
            h: 'What We Offer',
            blocks: [
              { type: 'p', text: 'Indiatutors Online is an online tutoring marketplace. Through the Platform we offer:' },
              {
                type: 'list',
                items: [
                  '**Live one-to-one classes** — personalised sessions with a dedicated Tutor, scheduled at a time agreed with you.',
                  '**Small-group classes** — live sessions taught to a small group of Students at a reduced per-Student rate, offered for selected subjects only.',
                  '**Self-paced video courses** — pre-recorded lessons streamed on demand, with lifetime access to each course you have purchased.',
                  '**A free 30-minute Demo Class** — one complimentary introductory class for each new Student, bookable at [Book a free demo](/book-demo) without any payment details.',
                ],
              },
            ],
          },
          {
            h: 'Subjects & Categories',
            blocks: [
              { type: 'p', text: 'Our Tutors teach Academics for Classes 1 to 8 and Classes 9 to 12, IT Technologies (including Python, Java, AWS, Artificial Intelligence & Machine Learning and Robotics), Musical Instruments, Vocal Music, Languages, Dance, Creative Skills and Mind Sports such as Chess and the Rubik’s Cube.' },
              { type: 'p', text: 'The subjects, levels and group formats listed on the Platform are those we offer at the time of publication. Availability of any particular subject, level or Tutor is subject to demand and to Tutor availability, and we may add or withdraw a subject or a group format at any time. Withdrawal never affects Classes you have already paid for and not yet taken; those are dealt with under the [Payment & Refund Terms](/payment-refund-policy).' },
            ],
          },
          {
            h: 'Curriculum Alignment',
            blocks: [
              { type: 'p', text: 'Teaching can be aligned to **CBSE, ICSE and ISC, IGCSE, the International Baccalaureate and Indian state boards**. Alignment means that the Tutor plans lessons against the published syllabus of the board you name. It does not mean that we are affiliated with, endorsed by, accredited by or acting on behalf of any board or examining body, and we make no representation to that effect.' },
            ],
          },
          {
            h: 'Class Length & Delivery',
            blocks: [
              { type: 'p', text: 'A standard Class runs for **one hour**, usually once a week. **Music Classes run for 45 minutes.** Live Classes are delivered over video-conferencing software, currently Zoom or Google Meet, and Video Courses are streamed from our cloud hosting provider.' },
              { type: 'p', text: 'You are responsible for arranging a device, a stable internet connection and a quiet space suitable for learning. A Class that is interrupted or lost because of a fault in your equipment, connection or surroundings is treated as delivered and is not refundable, because the Tutor attended and the slot was held; where the fault is brief and the Tutor is able to complete the Class within the scheduled time, no charge or adjustment arises. A Class that fails because of a fault at our end — the Platform, our scheduling systems, or the Tutor’s equipment or connection — is never charged to you: it is rescheduled free of charge or credited to your account, at your choice. These outcomes are set out in full in the [Payment & Refund Terms](/payment-refund-policy).' },
            ],
          },
          {
            h: 'Scheduling, Rescheduling & Attendance',
            blocks: [
              { type: 'p', text: 'A timetable is agreed with you at enrolment and Classes are booked through the Platform or with our support team. We ask for at least **24 hours’ notice** of a cancellation or a rescheduling request so that the slot can be released and the Tutor’s time reallocated. A request made with that much notice is accommodated without any charge: the Class is either rescheduled to a mutually convenient slot or returned to your account as an untaken Class.' },
              { type: 'p', text: 'A Class cancelled, or a reschedule requested, with **less than 24 hours’ notice** may be treated as delivered, because the Tutor has already reserved and prepared for that slot, and a Class treated as delivered is not refundable. Where the reason is genuinely unavoidable — illness, a bereavement, a clash with a school examination or an unexpected power failure — tell us and we will do our best to reschedule the Class instead of counting it. A Class for which the Student does not appear, and of which no notice was given, is treated in the same way as a late cancellation: it counts as delivered and is not refundable, and Tutors are asked to remain in the meeting for a reasonable period before recording a no-show. Repeated late cancellations or non-attendance may lead us to review the enrolment and to release the reserved slot.' },
              { type: 'p', text: 'Where a Class is cancelled by the Tutor or by us, it never counts against your paid Classes, and you choose what happens to it: either the Class is returned to your account as untaken, to be rescheduled or held as an account credit, or the fee for that Class is refunded in full to your original payment method within **7–10 business days**.' },
            ],
          },
          {
            h: 'Class Recordings',
            blocks: [
              { type: 'p', text: 'We may record a live Class for quality review, to resolve a dispute, or because you have asked for a copy. **Recordings are not made by default.** We tell the participants before a recording begins and make it only on the basis of consent, which we ask for separately and never bundle with any other permission. Recordings are stored securely, are kept for up to 90 days unless you ask us to delete one sooner, and are made available only to the enrolled Student and their Parent or Guardian, and to our own staff for the purposes just described.' },
              { type: 'note', tone: 'info', text: 'You may refuse a recording, or withdraw your consent to one, at any time — including at the start of a Class. Refusing never affects your ability to book or attend Classes, although it may limit the revision material and post-Class support available to you. How recordings are handled as personal data is described in our [Privacy Policy](/privacy-policy).' },
            ],
          },
          {
            h: 'Tutor Allocation & Substitution',
            blocks: [
              { type: 'p', text: 'We select and allocate a Tutor on the basis of the subject, level, board and schedule you request. If your allocated Tutor becomes unavailable, we may substitute a Tutor of comparable qualification and experience so that your timetable is not disrupted. You may ask us to change your Tutor at any time by writing to [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com), and we will do so wherever a suitable alternative is available.' },
            ],
          },
        ],
      },

      {
        id: 'payment-refunds',
        h: 'Payment & Refund',
        blocks: [
          { type: 'p', text: 'This section summarises how we charge for the Services. The complete rules on cancellations, refunds, credits and processing timelines are set out in our [Payment & Refund Terms](/payment-refund-policy), which are incorporated into these Terms by reference. Where the two documents differ on a question of refunds, the Payment & Refund Terms prevail.' },
        ],
        subs: [
          {
            h: 'Pricing & Taxes',
            blocks: [
              { type: 'p', text: 'Prices are displayed on the [Plans & pricing](/plans) page and again at checkout before you pay. Fees are charged in Indian Rupees. **Goods and Services Tax at 18%** is added at checkout, and the tax charged is shown on your invoice.' },
              { type: 'p', text: 'Per-Class rates depend on the category, the level (Beginner, Intermediate, Advanced or Professional) and, for Academics, the class band. The ranges currently offered are:' },
              {
                type: 'table',
                head: ['Category', '1-on-1 per class', 'Group per class'],
                rows: [
                  ['Academics — Primary & Middle (Classes 1–8)', '₹600 – ₹1,000', '₹600 (listed subjects)'],
                  ['Academics — Secondary & Senior Secondary (Classes 9–12)', '₹1,000 – ₹1,200', '₹600 (listed subjects)'],
                  ['IT Technologies (Python, Java, AWS, AI & ML, Robotics)', '₹600 – ₹1,500', '₹300 – ₹750'],
                  ['Musical Instruments', '₹600 – ₹2,500', '—'],
                  ['Vocal Music', '₹600 – ₹1,200', '—'],
                  ['Languages', '₹600 – ₹1,200', '₹300 – ₹600'],
                  ['Dance', '₹600 – ₹1,200', '₹300 – ₹600'],
                  ['Creative Skills', '₹300 – ₹1,200', '₹150 – ₹600'],
                  ['Mind Sports (Chess, Rubik’s Cube)', '₹600 – ₹1,200', '₹300 – ₹600'],
                ],
              },
              { type: 'p', text: 'The rate applicable to your enrolment is confirmed in writing before you pay. We may revise our published rates at any time; a revision does not change the rate for a Plan you have already paid for, and we will give existing Students reasonable advance notice before a revised rate applies to their next billing cycle.' },
            ],
          },
          {
            h: 'Registration Fee',
            blocks: [
              { type: 'p', text: 'A one-time Registration Fee of **₹750** is payable by each new Student at enrolment. It covers onboarding, Tutor matching and the setting up of the Student account, and is charged once per Student rather than once per subject; it is not levied again when a Plan is renewed. Being separate from Class fees, it does not form part of the automatic refund of untaken Classes, and a request for it to be refunded is considered separately under the [Payment & Refund Terms](/payment-refund-policy).' },
            ],
          },
          {
            h: 'Plans & Billing Cycles',
            blocks: [
              { type: 'p', text: 'Classes are purchased in advance under one of three Plans:' },
              {
                type: 'list',
                items: [
                  '**Monthly** — 4 to 5 live Classes a month, charged at the standard rate with no discount.',
                  '**Quarterly** — 12 Classes, with a 10% discount on the standard rate.',
                  '**Annual** — 48 Classes, with a 20% discount on the standard rate.',
                ],
              },
              { type: 'p', text: 'Fees are payable in advance for the cycle you choose. There is no minimum term and no lock-in: you may pause or stop at any time, and fees for Classes you have paid for but not taken are dealt with under the [Payment & Refund Terms](/payment-refund-policy).' },
            ],
          },
          {
            h: 'Payment Methods',
            blocks: [
              { type: 'p', text: 'Payments are processed by **Razorpay**, which accepts credit and debit cards, UPI and net banking. By submitting a payment you authorise us and our payment processor to charge the amount shown at checkout. Card details are captured and held by the payment gateway under its own security standards; **we never store your full card number**.' },
            ],
          },
          {
            h: 'Free Demo Class',
            blocks: [
              { type: 'p', text: 'Every new Student is entitled to one free **30-minute** Demo Class. No payment details are required to book it. The Demo Class is non-transferable, may be claimed only once per Student, and is intended to let you assess the Tutor and the teaching approach before you enrol. Book it at [Book a free demo](/book-demo).' },
            ],
          },
          {
            h: 'Refunds',
            blocks: [
              { type: 'p', text: 'You may exit a programme at any time — there is no notice period, no exit fee and no minimum term. **Fees for Classes that you have paid for and not yet taken are always refundable, with no time limit.** Where a Class is cancelled by the Tutor or by us, you choose between a full account credit and a full refund of that Class to your original payment method. Where a Class is lost because of a technical fault on our side, it is rescheduled at no cost or credited to your account, at your choice. Approved refunds are returned to the original payment method within **7–10 business days** of approval.' },
              { type: 'note', tone: 'info', text: 'How to request a refund, what happens to the Registration Fee and to the tax charged, the rule for Video Courses — refundable within **7 days** of purchase provided **less than 20%** of the course has been watched — and the processing timelines are all set out in the [Payment & Refund Terms](/payment-refund-policy). Please read that document before you raise a request.' },
            ],
          },
          {
            // Renamed from "Overseas & NRI Families": the heading implied a
            // service we do not offer, while the clause under it is a statutory
            // right that exists on its own terms. Quoted by name in the Data
            // Protection section below — keep the two in step.
            h: 'Users Resident in the EU or the UK',
            blocks: [
              { type: 'p', text: 'If you are resident in the European Union or the United Kingdom, you have a statutory right to withdraw from your purchase within **14 days** of placing your order, without giving a reason. If you asked us to begin Classes inside that 14-day window, a proportionate amount is retained for the Classes actually delivered up to the point of withdrawal, and the balance — the fees for Classes not taken — is refunded to you in full. The right arises under the EU Consumer Rights Directive (2011/83/EU) and the UK Consumer Contracts Regulations 2013; it sits alongside, and does not reduce, our standing promise that unused pre-paid Classes are always refundable, which is set out in the [Payment & Refund Terms](/payment-refund-policy). Users resident in those territories also have the rights granted by the GDPR and UK GDPR in respect of their personal data; how to exercise them is explained in our [Privacy Policy](/privacy-policy).' },
            ],
          },
          {
            h: 'Failed & Reversed Payments',
            blocks: [
              { type: 'p', text: 'If a payment fails, is reversed or is charged back, we may pause access to the Services and to purchased Video Courses until the amount due is settled. Where you believe a charge is incorrect, please contact us first at [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) so that we can investigate and, where appropriate, refund it directly.' },
            ],
          },
          {
            h: 'Referral Rewards',
            blocks: [
              { type: 'p', text: 'Our referral programme rewards you with **2 free one-to-one Classes and 2 free group Classes for each successful referral** — four free Classes in all. Rewards are credited within 7 days of the referred Student’s first payment, are non-transferable and must be used within 30 days of being credited. Self-referrals and duplicate enrolments do not qualify. Full conditions are set out in the [Refer & Earn Policy](/refer-earn-policy), and the programme itself is described at [Refer & Earn](/refer-earn).' },
            ],
          },
        ],
      },

      {
        id: 'acceptable-use',
        h: 'Acceptable Use',
        subs: [
          {
            h: 'Permitted Use',
            blocks: [
              { type: 'p', text: 'You may use the Platform and the Content only for lawful, personal, non-commercial educational purposes, and only in a manner consistent with these Terms.' },
            ],
          },
          {
            h: 'Prohibited Conduct',
            blocks: [
              { type: 'p', text: 'You must not:' },
              {
                type: 'list',
                items: [
                  'Record, screen-capture, download, republish, share, resell or otherwise redistribute any live Class, Video Course or other Content without our prior written consent.',
                  'Share your account credentials, class links or course access with any other person, or allow more than one Student to learn from a single enrolment.',
                  'Harass, bully, defame, threaten or discriminate against a Tutor, a member of our staff or another Student.',
                  'Upload, transmit or distribute anything that is unlawful, obscene, hateful, discriminatory or that infringes the intellectual property or privacy rights of another person.',
                  'Attempt to reverse-engineer, decompile, scrape, probe or otherwise interfere with the Platform, its hosting infrastructure or its security measures.',
                  'Use bots, scripts or other automated means to interact with the Platform without our written authorisation.',
                  'Impersonate any person, including a Tutor, a member of our staff or another Student.',
                  'Use the Services for academic dishonesty, including having a Tutor sit or complete an examination, assignment or assessment that is required to be your own work.',
                  'Approach a Tutor to arrange tuition outside the Platform, or accept such an arrangement, in order to avoid our fees.',
                ],
              },
            ],
          },
          {
            h: 'Conduct During Live Classes',
            blocks: [
              { type: 'p', text: 'Live Classes are a shared learning environment. Students are expected to join on time, to behave courteously and to follow the Tutor’s reasonable instructions. A Tutor may end a Class where a Student’s conduct makes teaching unsafe or impossible, and may report the incident to us. Parents and Guardians remain responsible for the conduct of a Student below 18 during Classes.' },
            ],
          },
          {
            h: 'Consequences of Misuse',
            blocks: [
              { type: 'p', text: 'A breach of this section may lead to a warning, the withdrawal of a particular feature, suspension of your account, permanent termination of your account, or legal action, according to the seriousness of the breach. Even where we terminate an account for breach, fees for Classes that have been paid for and not yet taken remain refundable and are settled in accordance with the [Payment & Refund Terms](/payment-refund-policy).' },
            ],
          },
        ],
      },

      {
        id: 'intellectual-property',
        h: 'Intellectual Property',
        subs: [
          {
            h: 'Our Content',
            blocks: [
              { type: 'p', text: 'All Content on the Platform — lesson material, worksheets, assessments, recorded video, software, the Indiatutors Online name and logo, and the overall look and feel of the Platform — is owned by or licensed to **__ENTITY__** and is protected by copyright, trade mark and other intellectual property laws in India and abroad.' },
            ],
          },
          {
            h: 'Limited Licence to Users',
            blocks: [
              { type: 'p', text: 'We grant you a limited, non-exclusive, non-transferable, non-sublicensable and revocable licence to access and use the Content solely for the personal educational purposes of the enrolled Student. This licence does not permit you to copy, reproduce, distribute, publicly display, adapt, create derivative works from, or commercially exploit any Content. All rights not expressly granted are reserved.' },
            ],
          },
          {
            h: 'Video Course Access',
            blocks: [
              { type: 'p', text: 'Where a Video Course is sold with lifetime access, that access is personal to the purchasing account and continues for as long as we make the course available on the Platform. It is a licence to view the course, not a sale of the underlying material, and it may be withdrawn if the account is terminated for a breach of these Terms.' },
            ],
          },
          {
            h: 'User-Submitted Content',
            blocks: [
              { type: 'p', text: 'If you submit material to the Platform — a review, a testimonial, homework, a recording or any other upload — you retain ownership of it and you grant us a worldwide, royalty-free, non-exclusive licence to host, reproduce, adapt and display it for the purpose of providing and improving the Services. You confirm that you own the material or are otherwise entitled to grant that licence, and that it does not infringe the rights of any other person.' },
            ],
          },
          {
            h: 'Feedback',
            blocks: [
              { type: 'p', text: 'Any feedback, suggestion or idea you send us about the Platform or the Services may be used by us without restriction, acknowledgment or compensation.' },
            ],
          },
          {
            h: 'Copyright Complaints',
            blocks: [
              { type: 'p', text: 'If you believe that material on the Platform infringes your copyright, write to [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) marked for the attention of the Legal team, including:' },
              {
                type: 'olist',
                items: [
                  'Identification of the work you say has been infringed.',
                  'The exact location on the Platform of the material you say is infringing.',
                  'Evidence of your ownership of, or authority over, the original work.',
                  'Your name, postal address, email address and telephone number.',
                  'A statement that the complaint is made in good faith and that the information in it is accurate.',
                ],
              },
              { type: 'p', text: 'We will acknowledge a complete notice and, where the complaint appears well founded, remove or disable access to the material while we investigate.' },
            ],
          },
        ],
      },

      {
        id: 'data-protection',
        h: 'Data Protection & Privacy',
        blocks: [
          { type: 'p', text: 'How we collect, use, store, share and delete personal data is set out in our [Privacy Policy](/privacy-policy), which is incorporated into these Terms by reference. By using the Platform you agree to the practices described there.' },
          { type: 'p', text: 'We process personal data in accordance with the **DPDP Act** and other applicable Indian law. For Users who are resident in the European Union or the United Kingdom, we also give effect to the rights available under the GDPR and UK GDPR, as described in the Users Resident in the EU or the UK clause above and in the Privacy Policy.' },
          { type: 'p', text: 'Many of our Students are children, so we take particular care with their data. We collect a child’s personal data only with the verifiable consent of a Parent or Guardian, we limit that data to what is needed to teach and to keep the child safe, and we do not use it for behavioural advertising or tracking. A Parent or Guardian may ask us at any time to give access to, correct or erase the data we hold about their child.' },
          { type: 'note', tone: 'warn', text: 'Recordings of live Classes contain personal data of the Student and the Tutor. They are shared only with the enrolled Student and their Parent or Guardian, and you must not publish or circulate them.' },
        ],
      },

      {
        id: 'third-party',
        h: 'Third-Party Tools & Links',
        subs: [
          {
            h: 'Third-Party Services',
            blocks: [
              { type: 'p', text: 'The Platform relies on third-party providers to deliver parts of the Services, including:' },
              {
                type: 'list',
                items: [
                  '**Zoom and Google Meet** — delivery of live Classes.',
                  '**Razorpay** — payment processing for cards, UPI and net banking.',
                  '**Cloudflare R2** — hosting and streaming of Video Course material.',
                  '**WhatsApp** — scheduling messages, class links and support conversations.',
                  '**YouTube** — video embedded on the Platform.',
                  'Email, messaging and analytics providers engaged from time to time to operate the Platform.',
                ],
              },
              { type: 'p', text: 'Your use of these services is also governed by their own terms and privacy policies. We choose our providers with care, but we are not responsible for their acts, omissions or availability.' },
            ],
          },
          {
            h: 'External Links',
            blocks: [
              { type: 'p', text: 'The Platform may link to websites we do not control, including reference material recommended by a Tutor. Those links are offered for convenience only. We do not endorse, monitor or accept responsibility for the content of any linked site, and you follow such links at your own risk.' },
            ],
          },
          {
            h: 'Social Channels',
            blocks: [
              { type: 'p', text: 'We maintain presences on WhatsApp, Facebook, Instagram, YouTube, LinkedIn and X. Content posted there is subject to these Terms so far as it concerns our Services, and to the rules of the platform on which it appears. Please do not send account, payment or personal information to us through a public social channel; use [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) instead.' },
            ],
          },
        ],
      },

      {
        id: 'disclaimers',
        h: 'Disclaimers',
        subs: [
          {
            h: 'Educational Outcomes',
            blocks: [
              { type: 'p', text: 'We do not guarantee any particular academic result, grade improvement, examination outcome, rank, admission or selection. Learning depends on the Student’s effort, attendance, prior knowledge and circumstances that are outside our control. Nothing on the Platform should be read as a promise of a specific outcome.' },
            ],
          },
          {
            h: 'Platform Availability',
            blocks: [
              { type: 'p', text: 'We work to keep the Platform available and secure, but we do not warrant that it will be uninterrupted, timely, error-free or free of harmful components. Planned maintenance will be notified in advance wherever it is practicable to do so.' },
            ],
          },
          {
            h: 'Tutors',
            blocks: [
              { type: 'p', text: 'Tutors bring their own teaching style, methods and materials and exercise their own professional judgment in planning lessons. We do not warrant that any Tutor’s qualifications, style or approach will match your personal expectations, and we encourage you to use the free Demo Class to assess the fit before enrolling. Where a Tutor is engaged as an independent contractor rather than as our employee, we remain responsible for arranging the Services you have purchased and for handling any complaint about them.' },
            ],
          },
          {
            h: 'Examinations & Third-Party Marks',
            blocks: [
              { type: 'p', text: 'The names of school boards, examinations and certifications referred to on the Platform belong to their respective owners. Their use is descriptive only, to indicate the syllabus a Class is aligned to, and does not imply affiliation, sponsorship or endorsement in either direction.' },
            ],
          },
          {
            h: '“As Is” Basis',
            blocks: [
              { type: 'p', text: 'To the maximum extent permitted by applicable law, the Platform and the Services are provided on an “as is” and “as available” basis, without warranty of any kind, whether express or implied, including any implied warranty of merchantability, fitness for a particular purpose or non-infringement. Nothing in this clause affects the rights given to you as a consumer by the Consumer Protection Act or by the mandatory law of your country of residence.' },
            ],
          },
        ],
      },

      {
        id: 'limitation-liability',
        h: 'Limitation of Liability',
        subs: [
          {
            h: 'Exclusion of Indirect Losses',
            blocks: [
              { type: 'p', text: 'To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential or punitive loss arising out of or in connection with the Platform or the Services, including loss of profit, loss of opportunity, loss of data, loss of goodwill or any other intangible loss, whether or not we were advised that such loss might arise.' },
            ],
          },
          {
            h: 'Aggregate Cap',
            blocks: [
              { type: 'p', text: 'Our total aggregate liability for all claims arising out of or in connection with these Terms or the Services shall not exceed the total amount you paid to us in the six months immediately preceding the event that gave rise to the claim. Any refund due to you for Classes paid for and not taken is payable in addition to, and is not limited by, this cap.' },
            ],
          },
          {
            h: 'Liability That Cannot Be Excluded',
            blocks: [
              { type: 'p', text: 'Nothing in these Terms excludes or limits any liability that cannot lawfully be excluded or limited, including liability for death or personal injury caused by our negligence, for fraud or for fraudulent misrepresentation.' },
            ],
          },
          {
            h: 'Consumer Rights',
            blocks: [
              { type: 'p', text: 'If you are a consumer, you have rights under the Consumer Protection Act and, if you are resident outside India, under the mandatory consumer law of your country of residence. These Terms operate in addition to those rights and do not restrict them.' },
            ],
          },
        ],
      },

      {
        id: 'termination',
        h: 'Termination',
        subs: [
          {
            h: 'Termination by You',
            blocks: [
              { type: 'p', text: 'You may stop your Classes or close your account at any time by writing to [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) or by contacting us through the [Contact](/contact) page. There is no notice period and no cancellation charge. Fees for Classes you have paid for and not taken are refunded in accordance with the [Payment & Refund Terms](/payment-refund-policy).' },
            ],
          },
          {
            h: 'Termination by Us',
            blocks: [
              { type: 'p', text: 'We may suspend or terminate your account, in some cases with immediate effect, if you:' },
              {
                type: 'list',
                items: [
                  'Breach any provision of these Terms, including the acceptable-use rules.',
                  'Behave abusively, threateningly or discriminatorily towards a Tutor, a member of our staff or another Student.',
                  'Give false registration information or impersonate another person.',
                  'Fail to pay for Services that have been delivered.',
                  'Act in any other way that endangers the safety of a Student, a Tutor or the integrity of the Platform.',
                ],
              },
              { type: 'p', text: 'Except where immediate action is required to protect a person or the Platform, we will tell you what the problem is and give you a reasonable opportunity to put it right before we terminate.' },
            ],
          },
          {
            h: 'Effect of Termination',
            blocks: [
              { type: 'p', text: 'On termination your right to access the Platform, your scheduled Classes and any Video Course licence ends. Amounts already due remain payable, and amounts we owe you for Classes not taken remain refundable. The clauses on intellectual property, data protection, disclaimers, limitation of liability, governing law and this clause survive termination.' },
            ],
          },
        ],
      },

      {
        id: 'force-majeure',
        h: 'Force Majeure',
        blocks: [
          { type: 'p', text: 'We are not liable for any failure or delay in performing our obligations where the failure or delay results from a cause beyond our reasonable control, including natural disaster, epidemic or pandemic, act of government or regulator, civil unrest, strike, power failure, failure of internet infrastructure, or failure of a video-conferencing or payment provider on which the Services depend.' },
          { type: 'p', text: 'Where such an event affects your Classes, we will reschedule them at no additional cost or credit them to your account, and we will keep you informed while the event continues. If the event prevents us from delivering the Services for a prolonged period, either party may end the enrolment and fees for Classes not taken will be refunded.' },
        ],
      },

      {
        id: 'governing-law',
        h: 'Governing Law & Disputes',
        subs: [
          {
            h: 'Governing Law',
            blocks: [
              { type: 'p', text: 'These Terms, and any dispute or claim arising out of or in connection with them or with the Services, are governed by and construed in accordance with the laws of **India**. If you are a consumer resident outside India, the mandatory consumer-protection law of your country of residence continues to apply alongside Indian law.' },
            ],
          },
          {
            h: 'Raising a Dispute',
            blocks: [
              { type: 'p', text: 'We would far rather resolve a complaint than litigate it. Please follow these steps:' },
              {
                type: 'steps',
                items: [
                  { t: 'Talk to us', d: 'Write to [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) or call [+91 93308 11581](tel:+919330811581), setting out what has gone wrong and what you would like us to do.' },
                  { t: 'We investigate', d: 'We will acknowledge your complaint, look into it with the Tutor and the team concerned, and respond with our position and any remedy we propose.' },
                  { t: 'Escalate in writing', d: 'If our response does not resolve the matter, send a written escalation to the same address marked for the attention of the Legal team. We will treat that as a formal notice of dispute.' },
                  { t: 'Formal proceedings', d: 'If the dispute is still unresolved 30 days after the written escalation, either party may commence proceedings.' },
                ],
              },
            ],
          },
          {
            h: 'Jurisdiction',
            blocks: [
              { type: 'p', text: 'Subject to the informal process above, the courts at **Kolkata, West Bengal, India** have exclusive jurisdiction over any dispute arising out of or in connection with these Terms or the Services. Nothing in this clause deprives a consumer of the right to approach a consumer commission having jurisdiction under the Consumer Protection Act, or of any mandatory jurisdiction available in the consumer’s country of residence that cannot be waived by agreement.' },
            ],
          },
        ],
      },

      {
        id: 'updates',
        h: 'Updates to These Terms',
        blocks: [
          { type: 'p', text: 'We may revise these Terms to reflect a change in our Services, our providers or the law. When we do, we will:' },
          {
            type: 'list',
            items: [
              'Update the “Last updated” and “Effective” dates shown at the top of this page.',
              'Email registered account holders where the change is material.',
              'Obtain fresh consent before the change takes effect, where the law requires it.',
            ],
          },
          { type: 'p', text: 'A revision applies from its effective date and does not change the price or terms of a Plan you have already paid for. If you continue to use the Platform after a revision takes effect, you accept the revised Terms. If you do not accept them, you should stop using the Platform and may ask for a refund of fees for Classes you have paid for and not taken.' },
        ],
      },

      {
        id: 'miscellaneous',
        h: 'Miscellaneous',
        subs: [
          {
            h: 'Entire Agreement',
            blocks: [
              { type: 'p', text: 'These Terms, together with the [Privacy Policy](/privacy-policy), the [Payment & Refund Terms](/payment-refund-policy), the [Refer & Earn Policy](/refer-earn-policy) and any course-specific terms presented to you at checkout, constitute the entire agreement between you and us in relation to the Services and supersede any earlier understanding or representation on the same subject.' },
            ],
          },
          {
            h: 'Severability',
            blocks: [
              { type: 'p', text: 'If any provision of these Terms is held to be invalid or unenforceable, it shall be modified to the minimum extent necessary to make it enforceable, or severed if modification is not possible, and the remaining provisions shall continue in full force and effect.' },
            ],
          },
          {
            h: 'Waiver',
            blocks: [
              { type: 'p', text: 'A failure or delay by us in enforcing any right or provision of these Terms is not a waiver of that right or provision, and does not prevent us from enforcing it later.' },
            ],
          },
          {
            h: 'Assignment',
            blocks: [
              { type: 'p', text: 'You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may assign ours to an affiliate or to a successor in connection with a reorganisation, merger or transfer of the business, provided your rights under these Terms are not reduced.' },
            ],
          },
          {
            h: 'Notices',
            blocks: [
              { type: 'p', text: 'Notices to us should be sent to [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) or to our address at New Town, Kolkata — 700161, West Bengal, India. Notices to you will be sent to the email address registered on your account and are treated as received on the day they are sent, unless we receive a delivery failure.' },
            ],
          },
          {
            h: 'Language',
            blocks: [
              { type: 'p', text: 'These Terms are written in English. If we publish a translation and there is a conflict between the two, the English version prevails.' },
            ],
          },
        ],
      },

      {
        id: 'contact-us',
        h: 'Contact Us',
        blocks: [
          { type: 'p', text: 'If you have a question about these Terms, about your enrolment or about anything else on the Platform, we are glad to hear from you. You can also reach us through the [Contact](/contact) page, and prospective Students can start with a [free 30-minute demo](/book-demo).' },
          { type: 'p', text: 'For legal notices and copyright complaints, please write to the email address below and mark your message for the attention of the Legal team.' },
        ],
      },
    ],

    contact: [
      { icon: '✉️', label: 'General enquiries', value: 'connect@indiatutorsonline.com', href: 'mailto:connect@indiatutorsonline.com' },
      { icon: '📞', label: 'Phone (India)', value: '+91 93308 11581', href: 'tel:+919330811581' },
      { icon: '🏠', label: 'Registered address', value: '__ENTITY__, New Town, Kolkata — 700161, West Bengal, India' },
    ],
  },

  refund: {
    slug: 'payment-refund-policy',
    eyebrow: 'Legal',
    title: 'Payment & Refund Terms',
    updated: '3 August 2026',
    effective: '3 August 2026',
    intro: 'Indiatutors Online sells tuition one class at a time, and this document sets out exactly what you pay, when it is charged, and what happens to your money when a class does not go ahead. The guiding rule is simple: fees paid for classes you have not taken are refundable. Everything below explains how that works in practice, together with the timelines, the evidence we need, and the few situations in which a class is treated as delivered.',

    glance: [
      { icon: '✅', t: 'Free demo class', d: 'Every new student gets one free 30-minute class. No payment details are needed to book it.' },
      { icon: '✅', t: 'Unused classes', d: 'Fees for pre-paid classes you have not yet taken are refunded in full on written request, with no time limit.' },
      { icon: '✅', t: 'If the tutor cancels', d: 'You choose: a full account credit, or the money back to your original payment method within 7–10 business days.' },
      { icon: '⚠️', t: 'Late cancellation', d: 'A class cancelled by the student with less than 24 hours’ notice may be treated as delivered and is then not refundable.' },
      { icon: '✅', t: 'Technical failure at our end', d: 'If a class fails because of our platform or the tutor’s connection, it is rescheduled free of charge or credited to your account.' },
      { icon: '✅', t: 'Video courses', d: 'Lifetime access once purchased. Refundable within 7 days of purchase if less than 20% has been watched.' },
    ],

    sections: [
      {
        id: 'free-demo-class',
        h: 'Free Demo Class',
        blocks: [
          { type: 'p', text: 'Every new student at Indiatutors Online is entitled to one free **30-minute** demo class with a tutor of their choice. No payment information is required to book it and no charge of any kind is raised against you, before or after the class.' },
          { type: 'list', items: [
            'The free demo class is personal to the student and is non-transferable.',
            'It may be redeemed once per student. Opening additional accounts in order to claim further demo classes is prohibited and may lead to suspension of the accounts concerned.',
            'The demo exists so that you can judge the tutor’s teaching approach, the fit with your board or syllabus — CBSE, ICSE/ISC, IGCSE, IB or a state board — and the platform itself before you commit to a paid plan.',
            'Because nothing is charged for a demo class, no refund question arises in respect of it.',
          ] },
          { type: 'p', text: 'You can book your demo at [Book a free demo](/book-demo) or by writing to [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com).' },
        ],
      },

      {
        id: 'pricing-payment-terms',
        h: 'Pricing & Payment Terms',
        blocks: [
          { type: 'p', text: 'Every amount you will be charged is displayed on the Platform before you confirm a purchase. Nothing is debited from you without that amount being shown first.' },
        ],
        subs: [
          {
            h: 'What a class costs',
            blocks: [
              { type: 'p', text: 'Fees are charged **per class**, not per hour of tutor availability, and they vary by category and by the level at which the student is taught — Beginner, Intermediate, Advanced or Professional. The ranges below span all four levels; the figure that applies to you depends on the subject, the level and the tutor allotted.' },
              { type: 'table', head: ['Category', '1-on-1 per class', 'Group per class'], rows: [
                ['Academics — Primary & Middle (Classes 1–8)', '₹600 – ₹1,000', '₹600 (listed subjects)'],
                ['Academics — Secondary & Senior Secondary (Classes 9–12)', '₹1,000 – ₹1,200', '₹600 (listed subjects)'],
                ['IT Technologies (Python, Java, AWS, AI & ML, Robotics)', '₹600 – ₹1,500', '₹300 – ₹750'],
                ['Musical Instruments', '₹600 – ₹2,500', '—'],
                ['Vocal Music', '₹600 – ₹1,200', '—'],
                ['Languages', '₹600 – ₹1,200', '₹300 – ₹600'],
                ['Dance', '₹600 – ₹1,200', '₹300 – ₹600'],
                ['Creative Skills', '₹300 – ₹1,200', '₹150 – ₹600'],
                ['Mind Sports (Chess, Rubik’s Cube)', '₹600 – ₹1,200', '₹300 – ₹600'],
              ] },
              { type: 'list', items: [
                'A live class runs for **one hour** and is normally scheduled once a week. **Music classes run for 45 minutes.**',
                'Group class fees are broadly half of the equivalent 1-on-1 fee for the same subject and level.',
                'A dash in the group column means no group rate is published for that category. Write to us and we will confirm whether a group class can be arranged and at what fee.',
                'Fees are quoted and charged in Indian rupees.',
              ] },
              { type: 'p', text: 'The exact fee for your subject, level and plan is set out on [Plans & pricing](/plans) and repeated in your enrolment confirmation before any payment is taken.' },
            ],
          },
          {
            h: 'One-time registration fee',
            blocks: [
              { type: 'p', text: 'A one-time registration fee of **₹750** is payable when a student is first enrolled. It covers onboarding, tutor matching and the setting up of the student account. It is charged once and is not levied again on renewal of a plan.' },
              { type: 'p', text: 'The registration fee is separate from class fees and is therefore not part of the automatic refund of untaken classes described in this policy. If you would like a refund of the registration fee to be considered, say so in your written request; we will tell you in writing what will and will not be refunded before anything is processed.' },
            ],
          },
          {
            h: 'Plans and advance payment',
            blocks: [
              { type: 'p', text: 'Live tuition is sold on three plans. Fees are collected in advance for the period concerned.' },
              { type: 'list', items: [
                '**Monthly** — 4 to 5 live classes in the month, charged at the standard per-class fee with no discount.',
                '**Quarterly** — 12 classes, charged with a **10% discount** on the per-class fee.',
                '**Annual** — 48 classes, charged with a **20% discount** on the per-class fee.',
              ] },
              { type: 'p', text: 'There is no minimum commitment beyond the period you have already paid for. You may pause or stop at any time, and the fees for classes not taken are refunded to you. Where classes are refunded out of a discounted quarterly or annual plan, the refund is calculated on the amount you actually paid for those classes, so the discount you enjoyed is neither clawed back nor paid out twice.' },
            ],
          },
          {
            h: 'How you can pay',
            blocks: [
              { type: 'p', text: 'Payments are processed through **Razorpay**, our payment gateway. Through Razorpay you may pay by:' },
              { type: 'list', items: [
                'Credit and debit cards',
                'UPI',
                'Net banking',
              ] },
              { type: 'p', text: 'By submitting your payment details you authorise us, through the gateway, to charge the amount shown to you at checkout. Card details are captured and held by the gateway under its own security certifications and are transmitted over an encrypted connection. Indiatutors Online does not see or store your full card number. How we handle the limited payment information we do receive is described in our [Privacy Policy](/privacy-policy).' },
            ],
          },
          {
            h: 'Changes to our fees',
            blocks: [
              { type: 'p', text: 'We may revise our fees from time to time. A revision applies only to new purchases and to renewals falling after the date of the change; a plan you have already paid for is honoured in full at the fee you were charged. We will notify you by email before a revised fee is applied to your renewal, and you are free to decline it by stopping at the end of the period you have already paid for, in which case the ordinary refund rules in this policy apply to any classes still untaken.' },
            ],
          },
        ],
      },

      {
        id: 'cancellation-scheduling',
        h: 'Cancellation & Scheduling',
        blocks: [
          { type: 'p', text: 'Live classes are delivered over video conferencing, ordinarily Zoom or Google Meet, at times agreed between the student and the tutor. The rules in this section decide whether a class that did not take place counts as delivered.' },
        ],
        subs: [
          {
            h: 'Scheduling and rescheduling',
            blocks: [
              { type: 'p', text: 'Classes are scheduled in advance on the Platform with your allotted tutor, and a class should be booked at least **24 hours** before the slot you want, so that the tutor can hold the time and prepare for it. If you need to move or cancel a class, tell us or your tutor at least **24 hours** before the scheduled start time. A request made within that notice period is accommodated without any charge: the class is either rescheduled to a mutually convenient slot or returned to your account as an untaken class.' },
              { type: 'p', text: 'Requests can be raised through the Platform, by email to [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com), or by telephone on [+91 93308 11581](tel:+919330811581).' },
            ],
          },
          {
            h: 'Late cancellation',
            blocks: [
              { type: 'p', text: 'If a class is cancelled or a reschedule is requested with **less than 24 hours’ notice**, the tutor has already reserved and prepared for that slot, and the class may be treated as delivered. A class treated as delivered is not refundable.' },
              { type: 'p', text: 'Where the reason is genuinely unavoidable — illness, a bereavement, a clash with a school examination or an unexpected power failure — tell us and we will do our best to reschedule the class instead of counting it. Repeated late cancellations may lead us to review the scheduling arrangement with you and your tutor.' },
            ],
          },
          {
            h: 'Cancellation by the tutor',
            blocks: [
              { type: 'p', text: 'If your tutor cancels a scheduled class, for any reason, you are entitled to whichever of the following you prefer:' },
              { type: 'list', items: [
                'the class returned to your account as untaken, to be rescheduled at a time that suits you, or held as an account credit for any future booking; or',
                'a full refund of that class to your original payment method, processed within **7–10 business days**.',
              ] },
              { type: 'p', text: 'A cancellation by the tutor never counts against your paid classes. Where a tutor becomes unavailable for a longer period, we will offer a replacement tutor of comparable experience; if you do not wish to continue with the replacement, the remaining untaken classes are refunded in full.' },
            ],
          },
          {
            h: 'Student no-show',
            blocks: [
              { type: 'p', text: 'If the student does not join a scheduled class and no notice was given, the class is treated in the same way as a late cancellation: it counts as delivered and is not refundable. Tutors are asked to remain in the meeting for a reasonable period before recording a no-show.' },
            ],
          },
          {
            h: 'Technical failures',
            blocks: [
              { type: 'p', text: 'A class that fails because of a fault at our end — the Platform, our scheduling systems, or the tutor’s equipment or connection — is not charged to you. It is rescheduled free of charge, or credited to your account, at your choice.' },
              { type: 'p', text: 'A class that fails because of a fault at the student’s end, such as the student’s device, internet connection or power supply, is treated as delivered, because the tutor attended and the slot was held. Please join from a stable connection and, where possible, test your setup before the class begins. Where a fault at your end is brief and the tutor is able to complete the class within the scheduled time, no charge or adjustment arises.' },
            ],
          },
          {
            h: 'Pausing or leaving a course',
            blocks: [
              { type: 'p', text: 'You may pause your classes or leave a course at any time. There is no notice period, no exit fee and no minimum term. On leaving, the fees you have paid for classes that have not been taken are refunded to you in accordance with this policy. That commitment is not qualified anywhere in this document: unused pre-paid classes are always refundable.' },
            ],
          },
        ],
      },

      {
        id: 'refund-rules-live-classes',
        h: 'Refund Rules — Live Classes',
        blocks: [
          { type: 'p', text: 'The table below sets out, situation by situation, what happens to the fee for a live 1-on-1 or small-group class. It applies to all live tuition and should be read with the cancellation rules above. Self-paced video courses are dealt with separately further down this document.' },
          { type: 'table', head: ['Situation', 'Refund outcome'], rows: [
            ['Pre-paid classes not yet taken', '✅ Refunded in full to the original payment method on written request'],
            ['Class cancelled by the tutor or by us', '✅ Full account credit or full refund within 7–10 business days, whichever you prefer'],
            ['Class cancelled by the student with 24 hours’ notice or more', '✅ Rescheduled, or returned to your account as an untaken class — no charge'],
            ['Class cancelled by the student with less than 24 hours’ notice', '⚠️ May be treated as delivered and is then not refundable'],
            ['Student does not attend and gave no notice', '❌ Treated as delivered; not refundable'],
            ['Technical failure at our end or the tutor’s end', '✅ Rescheduled free of charge, or credited to your account'],
            ['Technical failure at the student’s end (device, power or internet)', '⚠️ Treated as delivered; not refundable'],
            ['Class taught as scheduled', '❌ Not refundable once the class has been delivered'],
            ['Dissatisfaction with the tutor after classes have begun', '✅ Tutor changed at no cost; any classes still untaken remain refundable'],
            ['Free classes earned under Refer & Earn', 'No cash value and not exchangeable for money; governed by the [Refer & Earn Policy](/refer-earn-policy)'],
            ['One-time registration fee', 'Considered separately on written request — see the registration fee clause above'],
          ] },
          { type: 'note', tone: 'info', text: 'Where you would rather keep the money with us than have it returned, we can hold the amount as an account credit against future classes. Account credits are applied immediately, can be used for any subject or tutor on your account, and can be converted back into a refund to your original payment method at any time on request.' },
          { type: 'note', tone: 'warn', text: 'A request about a class that has **already taken place** should reach us within **30 days** of that class, so that attendance and session records are still available to check. There is no time limit on refunding classes you have paid for but not yet taken.' },
        ],
      },

      {
        id: 'overseas-cooling-off',
        // Retitled, not removed. The right below is statutory and survives our
        // saying nothing about it — and failing to give notice of it extends the
        // withdrawal window rather than closing it, so silence would be worse
        // than the clause. Note the Consumer Protection Act saving clause at the
        // end of this section is India-only and must not be swept up with it.
        h: 'The EU / UK Cooling-Off Right',
        blocks: [
          { type: 'p', text: 'Indiatutors Online is based in Kolkata and serves students across India, and this policy is written to Indian law. Where a student or the paying parent is nonetheless resident in the **European Union** or the **United Kingdom**, the following statutory right applies in addition to everything else in this document.' },
          { type: 'list', items: [
            'You may withdraw from a purchase within **14 days** of placing your order, without giving any reason.',
            'If you asked us to begin classes inside that 14-day window, a proportionate amount is retained for the classes actually delivered up to the point of withdrawal, and the balance — the fees for classes not taken — is refunded to you in full.',
            'To exercise the right, email [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) with your order details and a clear statement that you wish to withdraw.',
          ] },
          { type: 'p', text: 'This right arises under the EU Consumer Rights Directive (2011/83/EU) and the UK Consumer Contracts Regulations 2013. It sits alongside, and does not reduce, the refund rights given by the rest of this policy — which in most cases are the more generous of the two, because untaken classes remain refundable long after any cooling-off period has expired.' },
          { type: 'note', tone: 'info', text: 'Nothing in this policy limits a student’s or parent’s rights under the **Consumer Protection Act, 2019** in India, or under any other law that cannot be excluded by agreement.' },
        ],
      },

      {
        id: 'video-courses',
        h: 'Self-Paced Video Courses',
        blocks: [
          { type: 'p', text: 'Self-paced video courses are sold separately from live tuition and are delivered as streamed lessons within your account. A purchased video course carries **lifetime access**: once you have bought it, the course remains available to you for as long as we offer it on the Platform, with no recurring fee and no renewal to remember. Because the whole course is handed over at the moment of purchase, its refund rules are necessarily different from those for live classes.' },
          { type: 'list', items: [
            'You may request a **full refund within 7 days of purchase**, provided you have watched **less than 20%** of the course.',
            'Once you have watched 20% or more of the course, or once 7 days have passed since purchase — whichever happens first — the course is **not refundable**. Your lifetime access continues either way.',
            'Where a course is bought as part of a bundle, the bundle is refundable only if every course within it independently satisfies both conditions above.',
            'Watch progress is measured from the lessons completed and the playback recorded against your account. We will tell you the figure we are relying on when we answer your request.',
            'Where a refund of a video course is approved, access to that course is withdrawn from your account at the point the refund is processed.',
          ] },
          { type: 'note', tone: 'info', text: '💡 The refund window on video courses is short by design, because lifetime access is granted immediately. Read the course outline and any preview material on the course page, and speak to us if you are unsure whether a course matches the student’s level, before you buy.' },
          { type: 'p', text: 'A refund of a video course has no effect on a live tuition plan held on the same account, and leaving a live course has no effect on video courses you have already purchased.' },
        ],
      },

      {
        id: 'refund-processing-time',
        h: 'Refund Processing Time',
        blocks: [
          { type: 'p', text: 'Once a refund has been approved by our team, the following timelines apply.' },
          { type: 'list', items: [
            'Refunds are returned to the **original payment method** used for the purchase and are processed within **7–10 business days** of approval.',
            'UPI and net banking refunds normally reach the account within **3–5 business days** once processed.',
            'Credit and debit card refunds may take up to **10 business days**, depending on the issuing bank’s own settlement cycle, which is outside our control and the gateway’s.',
            'Account credits, where you have chosen a credit instead of money back, are applied **immediately** and are visible in your student dashboard.',
          ] },
          { type: 'p', text: 'We send you an email confirmation, with a reference number, as soon as a refund has been initiated. If the money has not reached you within the period stated above, please check with your bank first, since funds are sometimes credited without a separate intimation. If it is still missing, write to us quoting that reference number and we will take the matter up with the payment gateway on your behalf.' },
          { type: 'note', tone: 'warn', text: 'We can refund only to the payment instrument the money came from. We are not able to refund to a different card, a different bank account or a third party, and we will not ask you for card numbers, UPI PINs, passwords or one-time passcodes in order to process a refund. Treat any such request as fraudulent and report it to us.' },
        ],
      },

      {
        id: 'taxes-and-charges',
        h: 'Taxes & Other Charges',
        blocks: [
          { type: 'p', text: 'Fees displayed on the Platform are exclusive of tax. **Goods and Services Tax at 18%** is added at checkout for Indian customers and is shown to you as a separate line before you confirm payment, so that the total you are agreeing to is never a surprise.' },
          { type: 'p', text: 'Where a refund is issued, the service fee is refunded in accordance with this policy and the tax collected on the refunded amount is dealt with as applicable tax law requires. A tax invoice reflecting the adjustment is issued to you where one is required.' },
          { type: 'p', text: 'Students paying from outside India are responsible for any bank charges, currency conversion costs, foreign transaction fees, withholding taxes, duties or levies imposed in their own jurisdiction. Those amounts are charged by third parties, never reach us, and cannot be refunded by us.' },
        ],
      },

      {
        id: 'how-to-request-a-refund',
        h: 'How to Request a Refund',
        blocks: [
          { type: 'p', text: 'Refunds are requested in writing so that there is a clear record for both sides. The process is deliberately short.' },
          { type: 'steps', items: [
            { t: 'Write to us', d: 'Email [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) using the subject line “Refund Request — student name — class or purchase date”. The request must come from the registered account holder. Where the student is under **18**, a parent or guardian holds the account — verifiable parental or guardian consent being required under the **Digital Personal Data Protection Act, 2023** — and the request must come from that parent or guardian.' },
            { t: 'Tell us what to look at', d: 'Include the registered email address or student ID, the subject and tutor concerned, the class dates or the course name, the reason for the request, and whether you would prefer the money returned to your original payment method or held as an account credit.' },
            { t: 'We review it', d: 'Our team reviews every request and confirms eligibility in writing within **2 business days**. If we need anything further from you, we will ask for it in that same reply rather than in a series of separate messages.' },
            { t: 'We confirm the amount before acting', d: 'Before anything is processed we tell you the exact amount being refunded, the classes or course it relates to, how any discount and the tax component have been treated, and the date by which you should expect the money.' },
            { t: 'The money is returned', d: 'On approval the refund is processed within **7–10 business days** to your original payment method, or applied immediately if you asked for an account credit. You receive an email confirmation with a reference number.' },
          ] },
          { type: 'note', tone: 'warn', text: 'A request relating to a class that has already taken place should reach us within **30 days** of that class. Fees for classes you have paid for but not yet taken remain refundable with no time limit, and nothing in this paragraph shortens a period fixed by law.' },
          { type: 'p', text: 'If you are not satisfied with the outcome, reply on the same email thread asking for the decision to be reviewed by our support lead, or call us on [+91 93308 11581](tel:+919330811581). We will look at it again and give you a reasoned answer. Nothing in this policy prevents you from approaching a consumer forum under the Consumer Protection Act, 2019. This policy is governed by the laws of India, and the courts at **Kolkata, West Bengal, India** have exclusive jurisdiction over any dispute arising out of it.' },
        ],
      },

      {
        id: 'contact-us',
        h: 'Contact Us',
        blocks: [
          { type: 'p', text: 'If you have a question about this policy, about a specific charge, or about a refund you are waiting for, reach us by any of the routes below and we will respond in writing.' },
          { type: 'list', items: [
            'Email — [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com)',
            'Telephone and WhatsApp — [+91 93308 11581](tel:+919330811581)',
            'Post — __ENTITY__, New Town, Kolkata — 700161, West Bengal, India',
            'Online — the form on our [Contact](/contact) page',
          ] },
          { type: 'p', text: 'These Payment & Refund Terms form part of, and should be read together with, our [Terms & Conditions](/terms-conditions), our [Privacy Policy](/privacy-policy) and our [Refer & Earn Policy](/refer-earn-policy). Current fees for every subject and level are published on [Plans & pricing](/plans), and a free demo class can be booked at [Book a free demo](/book-demo).' },
          { type: 'p', text: 'We may amend this policy as our services and the law change. The version in force is always the one published on this page, and the date at the top records when it was last revised. An amendment does not affect a refund already requested under the version that was in force at the time of your purchase.' },
        ],
      },
    ],

    contact: [
      { icon: '✉️', label: 'Billing & refunds', value: 'connect@indiatutorsonline.com', href: 'mailto:connect@indiatutorsonline.com' },
      { icon: '📞', label: 'Phone / WhatsApp', value: '+91 93308 11581', href: 'tel:+919330811581' },
      { icon: '🏠', label: 'Registered address', value: '__ENTITY__, New Town, Kolkata — 700161, West Bengal, India' },
      { icon: '🌐', label: 'Online', value: 'indiatutorsonline.com', href: '/contact' },
    ],
  },

  referEarn: {
    slug: 'refer-earn-policy',
    eyebrow: 'Legal',
    title: 'Refer & Earn Policy',
    updated: '3 August 2026',
    effective: '3 August 2026',
    intro: 'The rules of the Indiatutors Online referral reward programme — who may refer, what a successful referral earns, and how free classes are credited, used and forfeited. Read this together with the [Refer & Earn](/refer-earn) programme page.',

    glance: [
      { icon: '🎁', t: '2 free classes per referral', d: 'Every successful referral earns you **2 free 1-on-1 classes or 2 free group classes** — whichever you prefer.' },
      { icon: '♾️', t: 'Unlimited referrals', d: 'There is no cap on how many families you may refer, and credits from several referrals may be combined.' },
      { icon: '⏱️', t: 'Credited within 7 days', d: 'Rewards are added within 7 days of your referral’s successful enrolment and first payment.' },
      { icon: '📅', t: 'Valid for 30 days', d: 'Free classes must be used within 30 days from the date they are credited, and are non-transferable.' },
    ],

    sections: [
      {
        id: 'overview',
        h: 'Overview',
        blocks: [
          { type: 'p', text: 'This Refer & Earn Policy (the “Policy”) sets out the terms on which __ENTITY__, which operates Indiatutors Online at indiatutorsonline.com (“we”, “us”, “our”), runs its referral reward programme (the “Programme”). The Programme lets an existing student or parent introduce a friend, relative or acquaintance to our live online classes and earn free classes when that family enrols and pays.' },
          { type: 'p', text: 'The Policy applies to every referral made through the form on our [Refer & Earn](/refer-earn) page and to every referral made by asking the family to name you at the time of enrolment. By submitting a referral, or by accepting a reward under the Programme, you confirm that you have read and accept this Policy.' },
          { type: 'p', text: 'This Policy is to be read with our [Terms & Conditions](/terms-conditions), our [Payment & Refund Terms](/payment-refund-policy) and our [Privacy Policy](/privacy-policy). Where a term of this Policy differs from those documents on a matter that is specific to the Programme, this Policy prevails; on every other matter, the Terms & Conditions prevail.' },
          { type: 'defs', items: [
            ['Programme', 'The Refer & Earn referral reward programme described on our [Refer & Earn](/refer-earn) page and governed by this Policy.'],
            ['Referrer', 'An existing student, or the parent or guardian of an existing student, at Indiatutors Online who introduces a new family to us.'],
            ['Referred Family', 'The student, and the parent or guardian of that student, whose details you share with us or who names you at enrolment.'],
            ['Successful Referral', 'A referral where the Referred Family enrols in a programme with us and completes the first payment for it.'],
            ['Free Class', 'One live class credited to you under the Programme — either a 1-on-1 class or a group class, as the Credit specifies — of the standard length for the course to which it is applied, at no charge.'],
            ['Credit', 'The two Free Classes issued to your account for one Successful Referral, taken either as 1-on-1 classes or as group classes at your choice.'],
          ] },
          { type: 'note', tone: 'info', text: 'The Programme pays rewards in free classes only. It does not pay cash, commission, a share of fees or any other consideration, and taking part does not make you our agent, employee or franchisee.' },
        ],
      },

      {
        id: 'who-can-refer',
        h: 'Who Can Refer',
        blocks: [
          { type: 'p', text: 'Any existing student or parent at Indiatutors Online is eligible to refer and earn rewards. You are an existing student or parent if you hold an account with us that is registered against an email address we can verify, whether your classes are currently running or have concluded.' },
          { type: 'list', items: [
            'You must give the email address registered with us when you submit a referral. We use it only to confirm that you are an existing student or parent, and it must match an account on our records.',
            'You may refer any friend, relative or acquaintance who is not already enrolled with us and who has not already been referred by someone else.',
            'You must have the Referred Family’s permission before you share their contact details with us. The referral form asks you to confirm this, and the confirmation is a condition of the referral being accepted.',
            'Where the Referrer is under 18 years of age, the referral must be made by, and any Credit is held and used by, the parent or guardian in whose name the account is held. Under the Digital Personal Data Protection Act, 2023, a parent or guardian holds the account for every student under 18 in India.',
            'Rewards under the Programme are class credits; no cash equivalent is offered.',
          ] },
          { type: 'p', text: 'A referral is personal to you. You may not pool, sell or assign your right to refer, and you may not submit referrals on behalf of another person so that the reward is earned in your name.' },
          { type: 'note', tone: 'warn', text: 'We may ask you to confirm your registered email address, or to confirm the details of the introduction you made, before a reward is credited. If we cannot match a referral to an existing account, no reward is due.' },
        ],
      },

      {
        id: 'what-you-earn',
        h: 'What You Earn',
        blocks: [
          { type: 'p', text: 'For every Successful Referral you earn **2 free 1-on-1 classes or 2 free group classes** — the choice is yours. Tell us which you would like when you redeem the Credit; if you say nothing we will ask before scheduling. A single Credit is taken as one or the other, not split across both.' },
          { type: 'list', items: [
            '**Unlimited referrals.** There is no cap on how many friends or relatives you may refer. The more families you refer, the more free classes you earn.',
            '**Rewards may be combined.** If you refer several families you may accumulate the Credits and use them as you like, subject to the expiry rules in the section on Crediting & Expiry of Rewards.',
            '**A Free Class matches the class it replaces.** A Free Class is one live class of the standard length for the course to which it is applied — one hour for most courses, and 45 minutes for music classes.',
            '**Free Classes carry no cash value.** They cannot be exchanged for money, set off against an invoice as a cash discount, or paid out as a refund. Nothing was ever paid for them, so they are not pre-paid classes: the promise in our [Payment & Refund Terms](/payment-refund-policy) that unused pre-paid classes are always refundable is about classes you have paid for, and this Policy neither qualifies nor extends it.',
            '**Free Classes are non-transferable.** They can only be used by the Referrer, and cannot be gifted, sold or moved to another account.',
          ] },
          { type: 'p', text: 'Because our per-class rates differ by category and level, the monetary value of a Free Class depends on the course you apply it to. Our published rates are set out on [Plans & pricing](/plans). Nothing in this Policy changes those rates, the one-time registration fee of ₹750, or the 18% GST added at checkout on chargeable amounts.' },
        ],
      },

      {
        id: 'how-to-refer',
        h: 'How to Refer',
        blocks: [
          { type: 'p', text: 'There are two accepted ways to make a referral, and both earn the same reward.' },
          { type: 'steps', items: [
            { t: 'Refer a friend or relative', d: 'As an existing student or parent, introduce your friends, relatives or acquaintances to our live online classes. Submit their details on the [Refer & Earn](/refer-earn) form, or share our website link and course details and ask them to mention your name during enrolment.' },
            { t: 'They enrol successfully', d: 'Once your Referred Family joins a programme and completes the first payment, you become eligible for rewards. Registering, enquiring or taking the free demo alone is not enough.' },
            { t: 'Earn free classes', d: 'We credit 2 free 1-on-1 classes or 2 free group classes for every Successful Referral, within 7 days of the enrolment, and confirm it to you by email or message.' },
          ] },
          { type: 'p', text: 'On the referral form, the only entries we must have are your own registered email address and your confirmation that you have the family’s permission to share their details with us. Every other field about the family you are referring is optional — but the more you share, the sooner we can welcome them. The fields we ask for are:' },
          { type: 'list', items: [
            'The parent’s name, email address and WhatsApp number (with country code);',
            'The student’s name;',
            'The subject or subjects of interest;',
            'The family’s time zone, so that we can suggest workable class slots.',
          ] },
          { type: 'p', text: 'If you are already a parent with us, logging in before you submit the form makes future referrals faster, because we can match the referral to your account automatically. If you prefer, simply enter your registered email address instead.' },
          { type: 'note', tone: 'warn', text: 'Only share another family’s contact details when you actually have their permission to do so. We contact the family on the strength of your confirmation, and we handle their details in accordance with our [Privacy Policy](/privacy-policy) and the Digital Personal Data Protection Act, 2023.' },
        ],
      },

      {
        id: 'when-a-referral-qualifies',
        h: 'When a Referral Qualifies',
        blocks: [
          { type: 'p', text: 'The test for eligibility is a single one: the referred person must successfully enrol and complete the first payment. If they register but do not pay, no free classes are credited. Free demo classes, enquiries, incomplete bookings and cancelled orders do not qualify.' },
          { type: 'p', text: 'Every new student is entitled to one free 30-minute demo class without giving payment details, and we encourage your referrals to book one at [Book a free demo](/book-demo). Taking that demo does not by itself earn you a reward; the reward follows only if the family then enrols and pays.' },
          { type: 'table',
            head: ['Scenario', 'Qualifies?', 'What applies'],
            rows: [
              ['A family you referred enrols in a programme and completes the first payment.', '✅ Qualifies', 'Your reward is credited within 7 days of that enrolment.'],
              ['They take the free 30-minute demo class, then enrol and pay.', '✅ Qualifies', 'A demo taken before enrolment has no effect on your reward.'],
              ['The family names you at enrolment instead of using the referral form.', '✅ Qualifies', 'Both routes are accepted, provided your name is recorded on or before the date of enrolment.'],
              ['Your referral buys a self-paced video course rather than live classes.', '✅ Qualifies', 'Any first paid enrolment by a new student counts. Your reward is still 2 free 1-on-1 classes or 2 free group classes, taken as live classes.'],
              ['Your referral creates an account, enquires or is quoted a fee but never pays.', '❌ Does not qualify', 'The reward is tied to a completed first payment, not to registration.'],
              ['Your referral books the free 30-minute demo class and stops there.', '❌ Does not qualify', 'The demo is free for every new student and is not an enrolment.'],
              ['You refer yourself using a second email address, phone number or name.', '❌ Does not qualify', 'Self-referral is disqualified and may end your participation in the Programme.'],
              ['The person referred is already a student with us, or re-enrols on a second account.', '❌ Does not qualify', 'Duplicate enrolments of an existing student do not create a new referral.'],
              ['More than one Referrer claims the same family.', '⚠️ One reward only', 'The referral recorded first qualifies. Later claims for the same family are not rewarded.'],
              ['The first payment is refunded or reversed in full before you use your Credit.', '❌ Does not qualify', 'The enrolment is treated as not completed, and any Credit already issued may be withdrawn.'],
              ['The family you referred is refunded for classes they paid for but did not take, having taken at least one class.', '✅ Qualifies', 'Their untaken classes are always refundable under our [Payment & Refund Terms](/payment-refund-policy). A partial refund of that kind leaves your reward untouched.'],
              ['You are not an existing student or parent at Indiatutors Online.', '❌ Does not qualify', 'Only existing students and parents may earn rewards under the Programme.'],
            ],
          },
          { type: 'p', text: 'We record a referral against the registered email address you give on the form, or against the name the family gives us at enrolment. Where the record is unclear or two claims conflict, our records of the date on which each referral was received decide the matter, and we will explain our decision to you on request.' },
        ],
      },

      {
        id: 'crediting-and-expiry',
        h: 'Crediting & Expiry of Rewards',
        blocks: [
          { type: 'p', text: 'Your free classes are credited within 7 days of your referral’s successful enrolment — that is, within 7 days of the date on which we receive and clear their first payment. You will receive a confirmation email or message once your referred friend completes the enrolment, so that you know the referral was successful.' },
          { type: 'list', items: [
            'Credits are added to your account by our team; there is nothing you need to claim, once the referral has been recorded against your registered email address.',
            '**Free classes must be used within 30 days from the date they are credited.** The 30-day period runs separately for each Credit, so Credits earned from different referrals expire on different dates.',
            'Where several Credits are held together, we apply the Credit closest to expiry first, unless you ask us otherwise.',
            'If we are late in crediting a reward, the 30-day period runs from the date the Credit is actually applied to your account, not from the date of the enrolment.',
            'Unused Free Classes lapse automatically at the end of the 30-day period. They are not extended, reissued or converted into any other benefit.',
          ] },
          { type: 'note', tone: 'warn', text: 'Expired free classes cannot be reinstated. Because they were issued at no charge, they are not pre-paid classes and no refund is due on expiry — the refund rights in our [Payment & Refund Terms](/payment-refund-policy) apply to fees you have actually paid. The rule that unused pre-paid classes are always refundable is unaffected by this section: it governs classes you bought, never classes we gave you free.' },
        ],
      },

      {
        id: 'using-your-free-classes',
        h: 'Using Your Free Classes',
        blocks: [
          { type: 'p', text: 'To redeem a Credit, tell our team when you enrol in a new course or renew an existing one, and we will apply your free classes to that booking. You may also write to us at [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) at any time within the validity period and ask us to schedule them.' },
          { type: 'list', items: [
            'Free classes may be used for any subject or skill we teach — academics, IT technologies, music, languages, dance, creative skills or mind sports.',
            'Each Credit is taken either as two 1-on-1 classes or as two group classes. 1-on-1 classes are scheduled with a tutor for your student alone. Group classes are subject to a suitable batch being available at your level; where no batch is running — as is often the case for music — choose the 1-on-1 option instead.',
            'Each free class is one live class of the standard length for that course — one hour for most courses, 45 minutes for music classes.',
            'Credits from several Successful Referrals may be combined and used together, provided each is used before its own expiry date.',
            'Because free classes are non-transferable, they are used only on the Referrer’s own account. Where the Referrer is a parent or guardian, that means the student or students registered on that account; the classes may not be gifted, sold or moved to another family or another account.',
          ] },
          { type: 'p', text: 'Free classes are scheduled in the ordinary way and depend on tutor availability at the time you ask for them; we cannot guarantee a particular tutor, batch or slot. The rescheduling, cancellation and conduct rules in our [Terms & Conditions](/terms-conditions) apply to a free class exactly as they apply to a paid one, and a free class missed without notice is treated as used.' },
          { type: 'p', text: 'A free class is a credit for one class, not a discount on any other charge. It does not reduce the one-time registration fee, and it does not alter the plan, the class frequency or the term you have signed up for. Because a free class reduces the number of chargeable classes on a booking, GST applies only to the amount actually charged to you.' },
        ],
      },

      {
        id: 'restrictions-and-fair-use',
        h: 'Restrictions & Fair Use',
        blocks: [
          { type: 'p', text: 'The Programme exists to reward genuine personal recommendations made to people you actually know. The following are not permitted, and a referral made in any of these ways will not be rewarded.' },
          { type: 'list', items: [
            'Referring yourself, whether under your own name or through an alternate email address, phone number, or a second account held by you or by a member of your household.',
            'Referring a person who is already a student with us, who was already in discussion with us about enrolling, or who has already been recorded as another Referrer’s referral.',
            'Creating duplicate enrolments, duplicate accounts or cancelled-and-repeated bookings in order to manufacture referrals.',
            'Sending unsolicited bulk messages, emails or automated posts, or any communication that would breach the law applicable to you, in order to promote the Programme.',
            'Publishing the Programme as a public coupon, cashback or deal offer on aggregator sites, or advertising it in a way that suggests it is an official public promotion.',
            'Presenting yourself as an employee, agent, franchisee or authorised representative of Indiatutors Online, or using our name, logo or course material other than by sharing our public website links.',
            'Misrepresenting our fees, curricula, boards covered, tutors or likely outcomes when you recommend us.',
            'Sharing another family’s personal details with us without their permission.',
          ] },
          { type: 'p', text: 'You take part in the Programme in your personal capacity. No agency, partnership, employment or joint venture is created between you and us, and you may not incur any obligation or make any promise on our behalf.' },
          { type: 'note', tone: 'info', text: 'If you are unsure whether a particular way of sharing our details is acceptable, write to us first at [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com). We would rather answer a question than withdraw a reward.' },
        ],
      },

      {
        id: 'fraud-and-disqualification',
        h: 'Fraud & Disqualification',
        blocks: [
          { type: 'p', text: 'Any misuse of the Programme — such as self-referrals or duplicate enrolments — leads to disqualification. Indiatutors Online may modify or end this Programme at any time if fraudulent activity is detected.' },
          { type: 'p', text: 'Where we reasonably believe that a referral is not genuine, or that this Policy has been breached, we may take one or more of the following steps, in proportion to what has happened:' },
          { type: 'olist', items: [
            'Decline to credit the reward for the referral in question;',
            'Cancel any Credit that has been issued but not yet used;',
            'Recover the value of any classes already taken on a Credit that was obtained in breach of this Policy, at our published rates for that course;',
            'Suspend or end your participation in the Programme, either for a period or permanently;',
            'Where the conduct also breaches our [Terms & Conditions](/terms-conditions), suspend or close the account concerned.',
          ] },
          { type: 'p', text: 'We review the records of the referral before we withdraw a reward. If you believe a decision is mistaken, write to us at [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) with the details of the introduction you made, and we will look at it again and tell you the outcome.' },
          { type: 'p', text: 'Nothing in this section limits your rights as a consumer under the Consumer Protection Act, 2019, and nothing in this section affects your separate right to a refund of fees for classes you have paid for and not taken, as set out in our [Payment & Refund Terms](/payment-refund-policy).' },
        ],
      },

      {
        id: 'changes-to-the-programme',
        h: 'Changes to the Programme',
        blocks: [
          { type: 'p', text: 'We may amend this Policy, or change, suspend or withdraw the Programme, at any time — including where fraudulent activity is detected. Changes take effect when the revised Policy is published on this page, and the “Last updated” date at the top of the document tells you when that happened. Please check this page before you make a referral you are relying on.' },
          { type: 'p', text: 'A change to the Programme does not affect a reward you have already earned. Credits that were issued before the change takes effect remain usable for the balance of their 30-day validity period, on the terms that applied when they were credited. A referral that has been submitted but not yet enrolled is governed by the Policy in force on the date the Referred Family completes their first payment.' },
          { type: 'p', text: 'This Policy is governed by the laws of India, and the courts at **Kolkata, West Bengal, India** have exclusive jurisdiction over any dispute arising out of it. Where an overseas or NRI family takes part, participation is still on these terms; any data protection rights available to you under the GDPR or UK GDPR, and any statutory cooling-off right in your own country, are dealt with in our [Privacy Policy](/privacy-policy) and [Payment & Refund Terms](/payment-refund-policy) and are unaffected by this Policy.' },
        ],
      },

      {
        id: 'contact-us',
        h: 'Contact Us',
        blocks: [
          { type: 'p', text: 'If you have any question about this Policy, about a referral you have made, or about a reward you are expecting, please contact us. We are happy to confirm the status of a referral and the expiry date of any Credit you hold.' },
          { type: 'list', items: [
            'By email, at [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) — the fastest route for anything about a specific referral;',
            'By phone or WhatsApp, on [+91 93308 11581](tel:+919330811581), during our working hours;',
            'By post, to __ENTITY__, New Town, Kolkata — 700161, West Bengal, India;',
            'Through the form on our [Contact](/contact) page, or by submitting a new referral on the [Refer & Earn](/refer-earn) page.',
          ] },
          { type: 'p', text: 'Indiatutors Online is India’s premium online tutor marketplace, based in New Town, Kolkata and serving pan-India. When you write to us about a reward, please quote the email address registered with us and the name of the family you referred, so that we can find the record quickly.' },
        ],
      },
    ],

    contact: [
      { icon: '✉️', label: 'Referral & reward queries', value: 'connect@indiatutorsonline.com', href: 'mailto:connect@indiatutorsonline.com' },
      { icon: '📞', label: 'Phone & WhatsApp', value: '+91 93308 11581', href: 'tel:+919330811581' },
      { icon: '🏠', label: 'Registered address', value: '__ENTITY__, New Town, Kolkata — 700161, West Bengal, India' },
    ],
  },

  privacy: {
    slug: 'privacy-policy',
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    updated: '3 August 2026',
    effective: '3 August 2026',
    intro: 'Indiatutors Online is committed to handling your personal data lawfully, transparently and securely. This policy explains what we collect, why we collect it, who we share it with, how long we keep it, and the rights you hold under India’s Digital Personal Data Protection Act, 2023.',

    sections: [
      {
        id: 'introduction',
        h: 'Introduction',
        blocks: [
          { type: 'p', text: 'Indiatutors Online ("Indiatutors Online", "we", "us" or "our") is India’s premium online tutor marketplace, operated by __ENTITY__ from New Town, Kolkata and serving students across India. Protecting the privacy of the students, parents and guardians who use our platform is central to how we work.' },
          { type: 'p', text: 'This Privacy Policy explains how we collect, use, store, share, transfer and protect personal data when you visit **indiatutorsonline.com**, create an account, book a free demo class, enrol in live 1-on-1 or small-group classes, purchase a self-paced video course, take part in our referral programme, or contact us through any of our channels (together, the "Services").' },
          { type: 'p', text: 'We act as a **Data Fiduciary** under India’s **Digital Personal Data Protection Act, 2023** (the "DPDP Act") and the rules made under it. Indian law is the spine of this policy. Where a student or family outside India uses the Services, the additional protections set out in the section on **Data Protection Outside India** also apply.' },
          { type: 'p', text: 'This policy should be read together with our [Terms & Conditions](/terms-conditions), our [Payment & Refund Terms](/payment-refund-policy) and, where you take part in the referral programme, our [Refer & Earn Policy](/refer-earn-policy).' },
          { type: 'note', tone: 'info', text: 'By using the Services you confirm that you have read this policy. If you do not agree with it, please do not use the Services. If you have already registered, you may ask us to close your account and delete your data at any time by writing to [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com).' },
        ],
      },

      {
        id: 'definitions',
        h: 'Definitions & Interpretation',
        blocks: [
          { type: 'p', text: 'The following terms have the meanings given below wherever they appear in this policy with an initial capital letter. Words in the singular include the plural and vice versa.' },
          {
            type: 'defs',
            items: [
              ['Account', 'The unique account created for a student, or created and held by a parent or guardian on a student’s behalf, to access the Services.'],
              ['Company / We / Us / Our', 'Indiatutors Online, operated by __ENTITY__, New Town, Kolkata — 700161, West Bengal, India.'],
              ['Cookies', 'Small files placed on your Device that record information about your visit, your preferences and your use of the Website.'],
              ['Data Fiduciary', 'Under the DPDP Act, the person who alone or with others determines the purpose and means of processing personal data. In relation to the Services, that is us.'],
              ['Data Principal', 'Under the DPDP Act, the individual to whom the personal data relates. Where that individual is a Child, the term includes the Parent or lawful Guardian.'],
              ['Data Processor', 'A person who processes personal data on our behalf and on our instructions, such as a hosting, video-conferencing or payment provider.'],
              ['Device', 'Any device used to access the Services, including a computer, laptop, tablet, smartphone or smart television.'],
              ['Personal Data', 'Any data about an individual who is identifiable by or in relation to that data.'],
              ['Processing', 'Any operation performed on Personal Data — including collection, recording, organisation, storage, use, sharing, disclosure, restriction, erasure or destruction — whether or not by automated means.'],
              ['Services', 'The Website, the student and parent dashboards, live 1-on-1 and small-group classes, self-paced video courses, the free demo class, the referral programme, and all related content, tools, communications and support channels.'],
              ['Service Provider', 'A third party engaged by us to perform a function on our behalf, such as video conferencing, payment processing, hosting, media delivery or analytics.'],
              ['Tutor', 'An instructor listed on the marketplace who delivers live classes to students through the Services.'],
              ['Usage Data', 'Data generated automatically by your use of the Services, such as pages viewed, time spent on a page, referring links and video-lesson progress.'],
              ['Website', 'indiatutorsonline.com, together with its subdomains and any successor address.'],
              ['You / Your / User', 'The individual using the Services — a student, or the Parent or Guardian who holds the Account on a student’s behalf.'],
              ['Child', 'For the purposes of this policy and the DPDP Act, an individual who has not completed eighteen (18) years of age.'],
              ['Parent / Guardian', 'The parent or lawful guardian of a Child, and includes the lawful guardian of a person with a disability.'],
            ],
          },
        ],
      },

      {
        id: 'information-we-collect',
        h: 'Information We Collect',
        blocks: [
          { type: 'p', text: 'We collect only the Personal Data we actually need in order to teach, to take payment, to keep the platform safe and to meet our legal obligations. The categories below describe everything we collect across the Services.' },
          { type: 'p', text: 'You may browse the Website anonymously. Course pages, plans, articles and our contact details are open to everyone, and we do not ask who you are until you book a demo class, register an Account, make a payment or write to us. A link to this policy, marked "Privacy", appears in the footer of every page, and you can change or correct the details we hold by signing in to your Account or emailing us.' },
        ],
        subs: [
          {
            h: 'Data You Give Us Directly',
            blocks: [
              {
                type: 'list',
                items: [
                  '**Identity data** — the student’s name, the name of the Parent or Guardian holding the Account, date of birth or age, and gender where you choose to give it.',
                  '**Contact data** — email address, telephone and WhatsApp numbers, city, state and country, and a postal or billing address where one is needed for invoicing.',
                  '**Account data** — username, password (stored only as a one-way hash), time zone, language preference, and communication preferences.',
                  '**Learning data** — the student’s current class or grade, the board followed (CBSE, ICSE/ISC, IGCSE, IB or a state board), subjects chosen, the level selected (Beginner, Intermediate, Advanced or Professional), learning goals, homework and practice submissions, assessment results, and progress notes recorded by the Tutor.',
                  '**Booking data** — demo classes booked at [/book-demo](/book-demo), scheduled class dates and timings, rescheduling and cancellation requests, and attendance.',
                  '**Billing data** — billing name and address, the plan chosen at [/plans](/plans), a GST registration number where you specifically ask for a GST invoice in a business name, and the transaction references returned to us by our payment gateway.',
                  '**Communications** — the content of emails, WhatsApp messages, contact-form enquiries, support tickets, survey responses, and any review, testimonial or feedback you choose to submit.',
                  '**Referral data** — where you refer someone under our referral programme at [/refer-earn](/refer-earn), the name and contact details you give us for that person. You must have their permission before you share their details with us.',
                ],
              },
            ],
          },
          {
            h: 'Data We Collect Automatically',
            blocks: [
              {
                type: 'list',
                items: [
                  '**Usage Data** — pages and lessons viewed, time spent, features used, search terms entered on the Website, referring and exit links, and the dates and times of your visits.',
                  '**Device data** — device type, operating system, browser type and version, screen size, language setting, and the IP address from which you connect (used, among other things, to derive an approximate city-level location for fraud prevention and time-zone handling).',
                  '**Cookie data** — the identifiers described in the section on **Cookies & Tracking Technologies** below, together with data held in your browser’s local storage to keep you signed in.',
                  '**Class delivery data** — the times at which you join and leave a live class, the duration of the class, and basic connection-quality information reported by the video-conferencing service.',
                  '**Video-course data** — which lessons you have opened, your playback position and completion status, so that we can restore your place and honour lifetime access to a purchased course.',
                  '**Security and server logs** — records of sign-in attempts, password changes, payment attempts and administrative actions, kept to detect and investigate misuse.',
                ],
              },
              { type: 'p', text: 'Where a live class is recorded — for example for quality review, to resolve a dispute, or because you have asked for a copy — we will tell the participants before the recording begins and will make the recording only on the basis of consent. Recordings are not made by default.' },
            ],
          },
          {
            h: 'Data We Receive from Others',
            blocks: [
              {
                type: 'list',
                items: [
                  '**Payment confirmations from Razorpay** — the outcome of a payment, the amount, the payment method type, a masked reference and a transaction identifier. We never receive your full card number, CVV or UPI PIN.',
                  '**Messaging metadata** — delivery and read status and message content from WhatsApp Business, where you have chosen to communicate with us on that channel.',
                  '**Tutor submissions** — attendance marks, progress notes and feedback recorded by the Tutor who teaches you.',
                  '**Referrals** — your name and contact details where an existing student or parent names you as a referral under the referral programme.',
                ],
              },
            ],
          },
          {
            h: 'Data We Do Not Want',
            blocks: [
              { type: 'p', text: 'We do not ask for, and do not wish to receive, government identity numbers, bank account numbers, card numbers, passwords, health records, biometric data, or information about caste, religion, political opinion or sexual orientation. The only exception is a GST registration number, which we ask for solely where you request a GST invoice in a business name.' },
              { type: 'note', tone: 'warn', text: 'Please do not send scans of identity documents, card details, one-time passwords or account passwords to us by email, WhatsApp or chat. If you do, we will delete them and ask you to change any credential you disclosed.' },
            ],
          },
        ],
      },

      {
        id: 'how-we-collect',
        h: 'How We Collect Your Information',
        blocks: [
          { type: 'p', text: 'Personal Data reaches us through the following routes, and no others:' },
          {
            type: 'list',
            items: [
              '**Direct interaction** — when you register an Account, book a free demo class, enrol in a plan, buy a self-paced course, complete a form, write a review, or contact us by email, phone, WhatsApp or the [contact form](/contact).',
              '**Automated technologies** — Cookies, local storage and server logs that operate as you browse the Website and use the learning platform.',
              '**Submission by a Parent or Guardian** — where an adult registers, books or pays on behalf of a Child and supplies the Child’s learning details.',
              '**Submission by a Tutor** — attendance, progress notes and feedback recorded in the course of teaching.',
              '**Our Service Providers** — payment confirmations, hosting and delivery logs, and aggregate analytics reports, as described in the section on **Service Providers**.',
              '**Referrals** — where an existing user names you under the referral programme, in which case we will tell you how we obtained your details the first time we contact you.',
            ],
          },
        ],
      },

      {
        id: 'how-we-use',
        h: 'How We Use Your Data',
        blocks: [
          { type: 'p', text: 'We use Personal Data only for the purposes listed below. Where we wish to use it for a new purpose that is not compatible with these, we will tell you and, where the law requires it, ask for your consent first.' },
          {
            type: 'list',
            items: [
              'To create, verify and administer your Account and to authenticate you when you sign in.',
              'To match a student with a suitable Tutor and to share with that Tutor the minimum details needed to prepare and teach the class.',
              'To personalise the learning experience — to adapt lesson plans, pace and practice material to the student’s level, board and stated goals — and to track educational progress over time so that the Parent or Guardian can see how the student is doing.',
              'To schedule, deliver, reschedule and follow up on live 1-on-1 and small-group classes delivered over Zoom or Google Meet.',
              'To provide the free 30-minute demo class, one per new student, and to follow up on how it went.',
              'To host and stream self-paced video courses from Cloudflare R2, to record your progress, and to keep lifetime access to a purchased course working.',
              'To take payment through Razorpay for the one-time registration fee, plan fees and applicable GST, and to issue receipts and invoices.',
              'To calculate and pay refunds for pre-paid classes that have not been taken, in line with our [Payment & Refund Terms](/payment-refund-policy).',
              'To administer the referral programme, verify that a referral qualifies, and credit the reward.',
              'To send service messages such as booking confirmations, class reminders, timetable changes, invoices, security alerts and notices about changes to our policies. These are not marketing messages and are sent for as long as your Account is active.',
              'To answer enquiries, provide support and handle complaints, including over WhatsApp Business where you have chosen that channel.',
              'To monitor and improve teaching quality, to investigate a complaint about a class, and to review a recording where one was made with consent.',
              'To keep the platform safe — to detect, prevent and investigate fraud, abuse, harassment, unauthorised access and misuse of course material.',
              'To understand in aggregate how the Website and platform are used, so we can fix problems, improve content and design new features.',
              'To send marketing about our courses, offers and programmes, only where you have consented, and only until you withdraw that consent.',
              'To comply with legal obligations, including tax, GST and accounting requirements and lawful requests from a court, regulator or authority.',
              'To establish, exercise or defend legal claims, and to enforce our [Terms & Conditions](/terms-conditions).',
            ],
          },
          { type: 'p', text: 'We do not take decisions about you that produce legal or similarly significant effects using solely automated means, and we do not profile students for advertising purposes.' },
        ],
      },

      {
        id: 'legal-basis',
        h: 'Legal Basis & Consent Under the DPDP Act',
        blocks: [
          { type: 'p', text: 'Under the DPDP Act we may process your Personal Data only in one of two ways: with your consent, or for one of the limited "legitimate uses" that the Act permits without separate consent. We rely on consent for almost everything we do.' },
        ],
        subs: [
          {
            h: 'Consent',
            blocks: [
              { type: 'p', text: 'Where we rely on consent, we ask for it through a clear, specific and standalone request, accompanied by a notice in plain language which tells you what Personal Data we want, the purpose we want it for, how you may withdraw your consent, how you may exercise your rights, and how you may complain to the Data Protection Board of India. Your consent is limited to the Personal Data that is necessary for the stated purpose.' },
              {
                type: 'list',
                items: [
                  'Creating an Account, booking a demo class and enrolling in classes or a course.',
                  'Recording a live class, where a recording is made.',
                  'Sending you marketing communications about our courses, plans and offers.',
                  'Setting non-essential Cookies and running analytics, where consent is required for the place you are in.',
                  'Publishing a review, testimonial, photograph or class result that identifies you or your child.',
                ],
              },
              { type: 'p', text: 'We do not bundle consents. Refusing an optional consent — marketing, for example — never affects your ability to book or attend classes.' },
            ],
          },
          {
            h: 'Withdrawing Your Consent',
            blocks: [
              { type: 'p', text: 'You may withdraw your consent at any time, and it must be as easy to withdraw as it was to give. Write to [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com), or use the unsubscribe link in any marketing email, or change your preferences in your Account.' },
              { type: 'p', text: 'Withdrawal takes effect for the future only and does not make unlawful any processing we carried out while your consent was in force. Once you withdraw, we and our Data Processors will stop the relevant processing within a reasonable period and erase the Personal Data unless retention is required by law or is necessary to defend a legal claim.' },
              { type: 'note', tone: 'warn', text: 'Some consents are necessary for us to teach you. If you withdraw consent to the processing needed to run your Account, we may be unable to continue delivering classes, and your enrolment will be treated as ended. Fees for classes you have paid for but not taken remain refundable under our [Payment & Refund Terms](/payment-refund-policy).' },
            ],
          },
          {
            h: 'Legitimate Uses Permitted Without Separate Consent',
            blocks: [
              { type: 'p', text: 'In a small number of situations the DPDP Act allows us to process Personal Data without a separate consent. We rely on these only where they genuinely apply:' },
              {
                type: 'list',
                items: [
                  'Where you have voluntarily given us the Personal Data for a specified purpose and have not indicated that you object to its use for that purpose — for example, when you write to our support team about a booking.',
                  'To comply with any law in force in India, or with any judgment, decree or order of a court, tribunal or regulator.',
                  'To respond to a medical emergency involving a threat to the life or immediate health of any person.',
                  'To take measures to ensure safety during a disaster or a breakdown of public order.',
                ],
              },
            ],
          },
          {
            h: 'What We Never Do',
            blocks: [
              { type: 'p', text: 'We do not sell Personal Data. We do not rent, trade or otherwise disclose Personal Data to any third party for that third party’s own independent marketing. We do not permit any Service Provider to use the Personal Data we entrust to them for their own purposes.' },
            ],
          },
        ],
      },

      {
        id: 'sharing',
        h: 'Sharing Your Data',
        blocks: [
          { type: 'p', text: 'We share Personal Data only where it is necessary to deliver the Services, to meet a legal obligation, or with your consent — and then only the minimum required. The recipients are:' },
          {
            type: 'list',
            items: [
              '**Tutors** — the student’s first name, class or grade, board, subject, level, scheduled timings, and any learning goals or progress notes needed to teach the class. Tutors do not receive your billing details, payment references or full contact database, and are bound by confidentiality obligations.',
              '**Other students in a small-group class** — where you enrol in a group class, the other participants and their parents will see and hear the student in the class and may see the display name shown on the video call.',
              '**Payment gateway** — Razorpay, to take payment, issue receipts and process refunds.',
              '**Video-conferencing providers** — Zoom and Google Meet, to host live classes.',
              '**Messaging and email providers** — WhatsApp Business and Google Workspace, to send confirmations, reminders, invoices and support replies.',
              '**Infrastructure providers** — Hostinger, for website and application hosting, databases and backups; Cloudflare R2, for storage and delivery of self-paced course videos.',
              '**Analytics providers** — Google Analytics, in aggregate form, to measure how the Website is used.',
              '**Professional advisers** — auditors, accountants, insurers and lawyers, under a duty of confidentiality, where we need advice or must produce records.',
              '**Authorities** — a court, tribunal, regulator, tax authority or law-enforcement agency, where disclosure is required by a law in force in India or by a valid order, and to the extent that order requires.',
              '**A successor to our business** — in the event of a merger, acquisition, restructuring or sale of assets, in which case we will give you notice and the successor will be bound by this policy until it is lawfully replaced.',
            ],
          },
          { type: 'p', text: 'Every Service Provider is engaged under a written contract that restricts them to processing Personal Data on our instructions and only for the purpose we engage them for, requires them to apply reasonable security safeguards, prohibits onward disclosure without our authorisation, and requires the return or deletion of the data at the end of the engagement.' },
          { type: 'p', text: 'Content that you deliberately make public — a review, testimonial or public profile field — is visible to anyone who visits that page. Please do not include a Child’s full name, school, address or contact details in public content.' },
        ],
      },

      {
        id: 'overseas-nri',
        // Renamed from "Overseas & NRI Students". The section is about where
        // data is protected, not who we sell to; the old title claimed the
        // latter. The id stays `overseas-nri` so no anchor or bookmark breaks.
        // Quoted by name in three other places in this document — all updated.
        h: 'Data Protection Outside India',
        blocks: [
          { type: 'p', text: 'This policy and our Services are governed by Indian law, and the DPDP Act remains the primary framework. Where the EU General Data Protection Regulation or the UK GDPR applies to our processing of your Personal Data, we additionally honour the protections in this section. Nothing here reduces the rights you already hold under the DPDP Act.' },
        ],
        subs: [
          {
            h: 'Our Legal Bases Under the GDPR and UK GDPR',
            blocks: [
              {
                type: 'list',
                items: [
                  '**Performance of a contract** — to enrol you, schedule and deliver the classes or course you have bought, take payment and provide support.',
                  '**Legitimate interests** — to keep the platform secure, prevent fraud, measure and improve the Services, and recover sums lawfully due, in each case where those interests are not overridden by your rights and freedoms.',
                  '**Consent** — for marketing, non-essential Cookies, class recordings, and the publication of testimonials.',
                  '**Legal obligation** — to keep accounting and tax records and to answer lawful requests.',
                  '**Vital interests** — in the rare case where processing is needed to protect the life or physical safety of a student or another person.',
                ],
              },
            ],
          },
          {
            h: 'Your Rights in the EEA and the United Kingdom',
            blocks: [
              {
                type: 'list',
                items: [
                  '**Access** — to obtain a copy of the Personal Data we hold about you and information about how we process it.',
                  '**Rectification** — to have inaccurate Personal Data corrected and incomplete data completed.',
                  '**Erasure** — to have your Personal Data deleted where it is no longer needed, where you withdraw consent, or where you successfully object, subject to records we must keep by law.',
                  '**Restriction** — to require us to pause processing while a dispute about accuracy or lawfulness is resolved.',
                  '**Portability** — to receive the Personal Data you provided to us in a structured, commonly used, machine-readable format, and to have it transmitted to another provider where technically feasible.',
                  '**Objection** — to object to processing based on our legitimate interests, and an absolute right to object to direct marketing.',
                  '**Automated decision-making** — not to be subject to a decision based solely on automated processing that produces legal or similarly significant effects. We do not take such decisions.',
                  '**Withdrawal of consent** — at any time, without affecting processing already carried out.',
                ],
              },
              { type: 'p', text: 'To exercise any of these rights, write to [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com). We will respond within 30 days and will tell you if we need longer because a request is complex. You also have the right to complain to a supervisory authority — the Information Commissioner’s Office in the United Kingdom, or the data-protection authority of your EU or EEA member state.' },
            ],
          },
          {
            h: 'Children Outside India',
            blocks: [
              { type: 'p', text: 'For students in the EEA and the United Kingdom, we require the consent of a parent or holder of parental responsibility where the student is under 16, or under the lower age set by the member state concerned, which is never below 13. In every case, an adult must hold the Account. See the section on **Children’s Privacy & Parental Consent** for the safeguards that apply to all Children.' },
            ],
          },
          {
            h: 'Cooling-Off Period for EU and UK Consumers',
            blocks: [
              { type: 'p', text: 'If you are a consumer resident in the European Union or the United Kingdom, you may withdraw from your purchase within **14 days** of placing your order, without giving a reason. If you asked us to begin classes inside that 14-day window, a proportionate amount is retained for the classes actually delivered up to the point of withdrawal, and the balance — the fees for classes not taken — is refunded to you in full. This right sits alongside, and does not reduce, our standing promise that unused pre-paid classes are always refundable — see our [Payment & Refund Terms](/payment-refund-policy).' },
            ],
          },
        ],
      },

      {
        id: 'international-transfers',
        h: 'International Data Transfers',
        blocks: [
          { type: 'p', text: 'We are based in New Town, Kolkata, and our platform and databases are hosted by our hosting provider. Self-paced course videos are stored and delivered through Cloudflare R2. Several of the Service Providers we rely on — for video conferencing, email, messaging, media delivery and analytics — operate globally, so your Personal Data may be processed on servers located outside your country of residence, including outside India.' },
          { type: 'p', text: 'Under section 16 of the DPDP Act, we may transfer Personal Data outside India except to a country or territory that the Central Government restricts by notification. We monitor those notifications and will suspend transfers to any country that is restricted, and will tell affected users where that changes how the Services work.' },
          { type: 'p', text: 'Where Personal Data is transferred out of the European Economic Area or the United Kingdom, we rely on an appropriate safeguard — the Standard Contractual Clauses approved by the European Commission, the United Kingdom International Data Transfer Agreement or Addendum, or another mechanism recognised as lawful for that transfer. You may ask us for a copy of the safeguards that apply to a particular transfer by writing to [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com).' },
          { type: 'p', text: 'Where the law requires your consent for a particular transfer, we ask for it separately and in plain language before the transfer takes place. We do not treat your use of the Services as consent to a transfer.' },
          { type: 'p', text: 'Wherever your data travels, we require by contract that it is protected to a standard no less protective than the one described in this policy.' },
        ],
      },

      {
        id: 'data-security',
        h: 'Data Security',
        blocks: [
          { type: 'p', text: 'We apply reasonable technical and organisational security safeguards to prevent a personal data breach, as required of a Data Fiduciary under the DPDP Act. These include:' },
          {
            type: 'list',
            items: [
              'TLS encryption for all traffic between your Device and our servers, so that data in transit is protected.',
              'Storage of passwords only as salted, one-way hashes — we never hold your password in a readable form and cannot tell you what it is.',
              'Role-based access control, so that staff and Tutors can reach only the data they need to do their work, on a need-to-know basis.',
              'Payment card data never touching our servers: card and UPI credentials are entered on the payment gateway’s own secure interface.',
              'Delivery of self-paced course videos through time-limited links, so that course media cannot be freely redistributed.',
              'Encrypted, access-controlled backups, with periodic restoration checks.',
              'Logging and monitoring of sign-ins, payment attempts and administrative actions, and review of unusual activity.',
              'Periodic security assessments — review of access rights, review of our own configuration, testing of the platform after any significant change, and review of the security posture of the Service Providers we use.',
              'Written confidentiality and data-protection obligations on staff, contractors and Tutors.',
              'Documented procedures for detecting, escalating, containing and reporting a personal data breach.',
            ],
          },
          { type: 'p', text: 'No method of transmitting or storing data over the internet is completely secure. While we work hard to protect your Personal Data, we cannot guarantee absolute security, and you share information with us on that understanding.' },
          { type: 'p', text: 'If a personal data breach occurs, we will notify the Data Protection Board of India and each affected Data Principal without delay, in the form and manner required by the DPDP Act and the rules made under it, telling you what happened, what data was involved, what we are doing about it and what steps you should take. Where the EU or UK GDPR applies to the affected data, we will also notify the competent supervisory authority within 72 hours where the breach is notifiable.' },
          { type: 'note', tone: 'warn', text: 'Keep your Account password to yourself and change it if you think it has been exposed. We will never ask you for your password, your full card number, a one-time password or a UPI PIN — not by email, not on a call, and not on WhatsApp. If someone claiming to be from Indiatutors Online asks for any of these, do not respond and tell us at [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com).' },
        ],
      },

      {
        id: 'data-retention',
        h: 'Data Retention',
        blocks: [
          { type: 'p', text: 'We keep Personal Data only for as long as it is needed for the purpose it was collected for, or for as long as a law in force in India requires us to keep it. When the purpose is served and no legal requirement applies, we erase the data or irreversibly anonymise it. The periods below are the ones we work to.' },
          {
            type: 'table',
            head: ['Category of data', 'How long we keep it', 'Why'],
            rows: [
              ['Account and profile data', 'For as long as the Account is active, and 3 years after it is closed', 'To handle late queries, disputes and re-enrolment'],
              ['Learning records, attendance and progress notes', '3 years after the last class taken', 'To evidence what was delivered and to resolve complaints'],
              ['Recordings of live classes, where made', 'Up to 90 days, unless you ask us to delete a recording sooner', 'Quality review and dispute resolution'],
              ['Self-paced course access records', 'For as long as we offer access to the purchased course', 'To honour lifetime access to a course you have bought'],
              ['Payment, invoice, GST and refund records', 'Up to 8 years from the end of the relevant financial year', 'Mandatory under Indian tax, GST and company law'],
              ['Support correspondence, including WhatsApp threads', '3 years from the last message in the thread', 'Complaint handling and service quality'],
              ['Referral programme records', '3 years after the reward is credited or lapses', 'To administer the programme and answer disputes'],
              ['Consent and consent-withdrawal records', 'For the life of the Account, and 3 years afterwards', 'To evidence that processing was lawful under the DPDP Act'],
              ['Marketing preferences and unsubscribe records', 'Until consent is withdrawn, then retained as a suppression record for 3 years', 'To make sure we do not contact you again after you opt out'],
              ['Website analytics data', 'Up to 26 months', 'Year-on-year trend analysis in aggregate'],
              ['Security, sign-in and server logs', 'Up to 12 months', 'Fraud prevention, security investigation and platform stability'],
            ],
          },
          { type: 'p', text: 'We may keep data that has been irreversibly anonymised — data from which no individual can be identified — for statistical and research purposes without a time limit. Where the law obliges us to retain a record, we will retain only that record and restrict access to it.' },
          { type: 'p', text: 'You may ask us to erase your Personal Data earlier than the periods above; see **Your Rights Under the DPDP Act** below. We will erase everything that is not covered by a legal retention requirement and will tell you what we must keep and why.' },
        ],
      },

      {
        id: 'your-rights',
        h: 'Your Rights Under the DPDP Act',
        blocks: [
          { type: 'p', text: 'As a Data Principal you hold the following rights in respect of the Personal Data we process about you. Exercising them is free of charge. Where the Data Principal is a Child, these rights are exercised by the Parent or Guardian who holds the Account.' },
          {
            type: 'list',
            items: [
              '**Right to access information** — to obtain a summary of the Personal Data we process about you, the processing activities we carry out, and the identities of the other Data Fiduciaries and Data Processors with whom we have shared it, together with a description of what was shared.',
              '**Right to correction and completion** — to have inaccurate or misleading Personal Data corrected, incomplete data completed, and out-of-date data updated.',
              '**Right to erasure** — to have Personal Data erased where it is no longer necessary for the purpose it was collected for, unless retention is required for compliance with a law in force in India.',
              '**Right to withdraw consent** — to withdraw any consent you have given, at any time, and as easily as you gave it.',
              '**Right of grievance redressal** — to a readily available means of raising a grievance with us about how we process your Personal Data or about our response to a request, which we must answer before you approach the Data Protection Board of India.',
              '**Right to nominate** — to nominate another individual who may exercise these rights on your behalf in the event of your death or incapacity.',
            ],
          },
        ],
        subs: [
          {
            h: 'How to Exercise a Right',
            blocks: [
              {
                type: 'steps',
                items: [
                  { t: 'Write to us', d: 'Send your request to [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) from the email address registered on the Account, with "DPDP request" in the subject line. You may also call us on [+91 93308 11581](tel:+919330811581).' },
                  { t: 'Tell us what you need', d: 'Say which right you are exercising and give us enough detail — the student’s name, the Account email and, if it helps, the dates or classes concerned — for us to find the records.' },
                  { t: 'Verification', d: 'We may ask you a question to confirm that you are the Account holder or the Parent or Guardian who registered the student. We will not ask you to send identity documents.' },
                  { t: 'Our response', d: 'We acknowledge every request within 7 days and complete it within 30 days. If a request is complex or covers a large volume of records, we will tell you why and how much longer we need.' },
                  { t: 'If you are not satisfied', d: 'Ask for the matter to be escalated to our Grievance Officer, whose contact details are in **Contact Us** below. If our response still does not resolve the matter, you may complain to the Data Protection Board of India.' },
                ],
              },
            ],
          },
          {
            h: 'Your Duties as a Data Principal',
            blocks: [
              { type: 'p', text: 'The DPDP Act also places duties on Data Principals. When you use the Services you must comply with the law that applies to you, must not impersonate another person when providing Personal Data, must not suppress material information when providing Personal Data for any document or identifier issued by the State, must not register a false or frivolous grievance or complaint, and must give only information that is verifiably authentic when exercising your right to correction or erasure.' },
            ],
          },
        ],
      },

      {
        id: 'service-providers',
        h: 'Service Providers',
        blocks: [
          { type: 'p', text: 'We engage a small, deliberately limited set of third parties to perform functions on our behalf. Each has access only to the Personal Data needed for the task we engage them for, and each is obliged not to use or disclose it for any other purpose. Our current Service Providers are:' },
          {
            type: 'list',
            items: [
              '**Zoom and Google Meet** — delivery of live 1-on-1 and small-group classes, including the issue of joining links and, where a recording is made with consent, its temporary storage.',
              '**Razorpay** — payment processing for cards, UPI and net banking, invoicing, settlement and refunds for Indian and overseas customers.',
              '**WhatsApp Business** — booking confirmations, class reminders and support conversations, where you have chosen WhatsApp as a channel.',
              '**Google Workspace** — our email, calendar and internal document storage, including correspondence with you.',
              '**Hostinger** — website and application hosting, database storage and backups.',
              '**Cloudflare R2** — storage and delivery of self-paced course videos and other large media files.',
              '**Google Analytics** — measurement of Website traffic and content performance in aggregate.',
            ],
          },
          { type: 'p', text: 'Each of these providers also publishes its own privacy notice, which governs the processing it carries out as a controller in its own right. We review those notices and the security representations our providers make, and we assess any material change before it takes effect for your data.' },
          { type: 'p', text: 'If we engage a new Service Provider whose involvement materially changes how your Personal Data is handled, we will update this section before or at the time the change takes effect and, where consent is required, we will obtain it first.' },
        ],
      },

      {
        id: 'analytics-advertising',
        h: 'Analytics & Advertising',
        blocks: [
          { type: 'p', text: 'We use **Google Analytics** to understand how the Website is used in aggregate — which pages are visited, how long visitors stay, which devices they use and which sources bring them to us. We use that understanding to fix problems, improve our content and decide what to build next. We do not use analytics data to identify you personally or to make decisions about an individual student.' },
          { type: 'p', text: 'Google Analytics processes the data it collects under the Google Analytics terms of service and Google’s own privacy policy. You can prevent it from collecting data about your visits by declining analytics Cookies, by using your browser’s privacy controls, or by installing the Google Analytics opt-out browser add-on.' },
          { type: 'p', text: 'We do not currently operate behavioural remarketing, advertising pixels or cross-site tracking technologies on the Website, and we do not disclose Personal Data to any third party for cross-context behavioural advertising. If we introduce any advertising technology in future, we will update this policy and, where consent is required, obtain it before the technology is activated.' },
          { type: 'p', text: 'We do not profile Children, do not track their behaviour across services, and do not direct advertising at Children, in line with section 9 of the DPDP Act.' },
          { type: 'p', text: 'We maintain pages on WhatsApp, Facebook, Instagram, YouTube, LinkedIn and X. If you visit or message us on one of those platforms, the platform processes your data under its own privacy policy, over which we have no control. Content you post publicly on those pages is visible to other users of that platform.' },
        ],
      },

      {
        id: 'payments',
        h: 'Payments',
        blocks: [
          { type: 'p', text: 'All fees are collected through **Razorpay**, which supports cards, UPI and net banking. Razorpay is the only payment gateway integrated with the Services; we do not operate any other gateway.' },
          { type: 'p', text: 'Card and UPI credentials are entered on Razorpay’s own secure interface and are never transmitted to or stored on our servers. We do not hold your full card number, expiry date, CVV or UPI PIN, and we could not retrieve them if asked. What we receive and store is confirmation that a payment succeeded or failed, the amount, the payment method type, a masked reference, and a transaction identifier that lets us match the payment to your Account.' },
          { type: 'p', text: 'Razorpay processes payment data under its own privacy policy and operates to the standards set by the Payment Card Industry Data Security Standard. We recommend that you read its privacy policy before making a payment.' },
          { type: 'p', text: 'We record the details needed to issue a valid invoice — the one-time registration fee of **₹750**, the plan fee for the level and subject chosen, and **18% GST** added at checkout — and we retain those invoices for the period set out in the retention table above, because Indian tax law requires it.' },
          { type: 'p', text: 'Where you are entitled to a refund of fees for classes you have not taken, we return the money to the original payment method through Razorpay, which requires us to share the original transaction reference with the gateway. The circumstances in which refunds are due are set out in our [Payment & Refund Terms](/payment-refund-policy).' },
        ],
      },

      {
        id: 'children',
        h: 'Children’s Privacy & Parental Consent',
        blocks: [
          { type: 'p', text: 'A large part of our teaching is for school students, so much of the Personal Data we handle belongs to Children. We treat it with particular care and collect as little of it as we can.' },
          {
            type: 'list',
            items: [
              'In India, a Parent or lawful Guardian must create and hold the Account for any student under 18, and must give verifiable consent before we process that Child’s Personal Data. This is the standard set by the DPDP Act.',
              'We obtain and verify that consent from the details supplied by the adult Account holder and by such other means as the rules made under the DPDP Act require from time to time.',
              'We collect from a Child only what is needed to teach: first name, class or grade, board, subjects, level, class timings, homework and progress. Contact and billing details are held for the adult Account holder, not the Child.',
              'We do not track or behaviourally monitor Children and we do not direct advertising at Children.',
              'Tutors interact with a student only through the Services. Joining links are issued for each session and are not shared beyond the participants.',
              'A Parent or Guardian may sit in on any class, may ask for a copy of a recording where one exists, and may ask us to correct or erase their Child’s Personal Data at any time.',
              'When the Account holder asks us to close a Child’s Account, we erase the Child’s learning records except for anything we are legally required to retain, such as invoices.',
            ],
          },
          { type: 'p', text: 'For students in the European Economic Area and the United Kingdom, the additional age thresholds described under **Data Protection Outside India** apply.' },
          { type: 'p', text: 'If you are a Parent or Guardian and you believe that a Child has given us Personal Data without your consent, write to [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) with the Child’s name and the email address or phone number used. We will verify your relationship to the Child and delete the data promptly.' },
        ],
      },

      {
        id: 'cookies',
        h: 'Cookies & Tracking Technologies',
        blocks: [
          { type: 'p', text: 'Cookies are small text files placed on your Device when you visit the Website. We also use your browser’s local storage for the same kinds of purposes. Together they let the Website remember who you are between pages and visits.' },
          {
            type: 'list',
            items: [
              '**Strictly necessary** — these keep you signed in, protect forms against cross-site request forgery, route you to the right server and carry your selection through checkout. The Website cannot work without them, so they are always set.',
              '**Preference** — these remember your language, time zone and choices such as a notice you have dismissed, so you are not asked again.',
              '**Analytics** — these are set by Google Analytics to measure Website traffic in aggregate. Where consent is required for the place you are in, we set them only after you have consented.',
              '**Media and playback** — these remember your place in a video lesson and your preferred playback quality, so that a self-paced course resumes where you left it.',
            ],
          },
          { type: 'p', text: 'You can control Cookies through your browser settings: you can see what is stored, delete existing Cookies and block future ones. You can also withdraw a consent you have given for non-essential Cookies at any time by writing to us. Blocking strictly necessary Cookies will stop you from signing in, booking a class or completing a payment.' },
          { type: 'p', text: 'Browsers differ in how they express a "do not track" preference and there is no agreed standard for honouring it. Because we do not operate cross-site tracking or advertising technologies, such a signal makes no difference to what we do.' },
        ],
      },

      {
        id: 'links-to-other-sites',
        h: 'Links to Other Sites',
        blocks: [
          { type: 'p', text: 'The Services may contain links to websites, applications and resources that we do not operate — reference material recommended by a Tutor, a board or examination authority, a payment page, or one of our social media pages. If you follow such a link, you leave our Website and the destination site collects and uses your data under its own policies.' },
          { type: 'p', text: 'When you join a live class you also use Zoom or Google Meet, and the privacy notice of that provider applies to what happens inside the meeting in addition to this policy.' },
          { type: 'p', text: 'We have no control over, and accept no responsibility for, the content, privacy practices or security of any third-party site or service. We encourage you to read the privacy policy of every site you visit from a link on our Services.' },
        ],
      },

      {
        id: 'changes',
        h: 'Changes to This Policy',
        blocks: [
          { type: 'p', text: 'We may update this Privacy Policy from time to time — because our Services change, because we engage a new Service Provider, or because the law or the rules made under the DPDP Act change. When we do, we will:' },
          {
            type: 'list',
            items: [
              'Update the "Last updated" and "Effective" dates shown at the top of this page.',
              'Publish the revised policy on this page, so that the current version is always available at [/privacy-policy](/privacy-policy).',
              'Notify registered users by email or through the platform at least 7 days before a material change takes effect, describing what is changing and why.',
              'Obtain fresh consent before relying on it, wherever the change means we would process your Personal Data for a purpose your existing consent does not cover.',
            ],
          },
          { type: 'p', text: 'Continuing to use the Services after a change takes effect means you accept the updated policy, except where the law requires your specific consent, in which case we will not act on the change until you give it. We keep earlier versions of this policy and will send you a copy of the version that applied on a particular date if you ask.' },
        ],
      },

      {
        id: 'contact-us',
        h: 'Contact Us',
        blocks: [
          { type: 'p', text: 'If you have a question, a request or a complaint about this Privacy Policy or about how we handle Personal Data, please get in touch. We would rather hear from you and put something right than have you go elsewhere first.' },
          {
            type: 'list',
            items: [
              '**Email** — [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com), marking your message "Privacy" or "DPDP request".',
              '**Phone** — [+91 93308 11581](tel:+919330811581).',
              '**Post** — __ENTITY__, New Town, Kolkata — 700161, West Bengal, India.',
              '**Online** — through the form on our [contact page](/contact).',
            ],
          },
          { type: 'p', text: '**Grievance redressal.** Our Grievance Officer for the purposes of the DPDP Act can be reached at [connect@indiatutorsonline.com](mailto:connect@indiatutorsonline.com) or on [+91 93308 11581](tel:+919330811581). Please mark written grievances "Grievance — DPDP" and include the Account email address so that we can trace the records. We acknowledge every grievance within 7 days and aim to resolve it within 30 days.' },
          { type: 'p', text: 'If we do not resolve your grievance to your satisfaction, you may complain to the **Data Protection Board of India**. If you are in the European Economic Area or the United Kingdom, you may instead complain to your own supervisory authority, as described under **Data Protection Outside India**.' },
          { type: 'p', text: '**Governing law.** This Privacy Policy is governed by the laws of India, and the courts at **Kolkata, West Bengal, India** have exclusive jurisdiction over any dispute arising out of it. Nothing in this clause removes any mandatory right or remedy available to you under the law of the country in which you live.' },
          { type: 'note', tone: 'info', text: 'Related documents: [Terms & Conditions](/terms-conditions) · [Payment & Refund Terms](/payment-refund-policy) · [Refer & Earn Policy](/refer-earn-policy) · [Book a free demo](/book-demo) · [Plans & pricing](/plans)' },
        ],
      },
    ],

    contact: [
      { icon: '✉️', label: 'Privacy enquiries & DPDP requests', value: 'connect@indiatutorsonline.com', href: 'mailto:connect@indiatutorsonline.com' },
      { icon: '📞', label: 'Phone (India)', value: '+91 93308 11581', href: 'tel:+919330811581' },
      { icon: '🏠', label: 'Registered address', value: '__ENTITY__, New Town, Kolkata — 700161, West Bengal, India' },
      { icon: '💬', label: 'Contact form', value: 'indiatutorsonline.com/contact', href: '/contact' },
    ],
  },
});

// Footer / sidebar policy list, derived from LEGAL so labels and paths can never
// drift from the documents themselves. Order matches the sister site's footer.
export const LEGAL_NAV = Object.values(LEGAL).map(d => [d.title, '/' + d.slug]);
