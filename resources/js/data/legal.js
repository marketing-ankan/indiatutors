// Legal / policy content for IndiaTutors Online.
// Plain, standard clauses tailored to an Indian online tutoring marketplace.
// (Have your legal counsel review before relying on these for compliance.)

const CONTACT = {
  brand: 'Indiatutors Online',
  email: 'connect@indiatutorsonline.com',
  phone: '+91 93308 11581',
  address: 'New Town, Kolkata, West Bengal, India',
};

export const LEGAL = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'July 2026',
    intro: `${CONTACT.brand} ("we", "us", "our") respects your privacy. This policy explains what information we collect when you use our website and services, how we use it, and the choices you have.`,
    sections: [
      { h: 'Information we collect', p: [
        'Details you give us directly — name, email, phone number, city, the student\'s grade/board and subject interests when you book a demo, contact us, or create an account.',
        'Usage information — pages visited, courses viewed, and device/browser details collected through cookies and similar technologies to improve the service.',
      ]},
      { h: 'How we use your information', p: [
        'To respond to demo and contact requests and to match you with a suitable tutor.',
        'To schedule classes, process enrolments and payments, and provide support.',
        'To send service updates and, where you have opted in, occasional offers. You can unsubscribe at any time.',
        'To improve our courses, tutors and website experience.',
      ]},
      { h: 'Sharing', p: [
        'We share the minimum necessary details with the assigned tutor to deliver your classes.',
        'We use trusted service providers (for payments, communication and hosting) who process data on our behalf under confidentiality obligations.',
        'We do not sell your personal information.',
      ]},
      { h: 'Data security & retention', p: [
        'We use reasonable technical and organisational measures to protect your data and retain it only as long as needed for the purposes above or as required by law.',
      ]},
      { h: 'Your rights', p: [
        'You may request access to, correction of, or deletion of your personal information by contacting us at the details below.',
      ]},
      { h: 'Children', p: [
        'Where a student is a minor, a parent or guardian provides and controls the account and consents to the processing of the student\'s information.',
      ]},
      { h: 'Contact', p: [
        `Questions about this policy? Email ${CONTACT.email} or call ${CONTACT.phone}. ${CONTACT.brand}, ${CONTACT.address}.`,
      ]},
    ],
  },

  terms: {
    title: 'Terms of Service',
    updated: 'July 2026',
    intro: `These terms govern your use of ${CONTACT.brand} and the classes booked through it. By using the site or booking a class, you agree to these terms.`,
    sections: [
      { h: 'The service', p: [
        'We connect students and parents with verified tutors for live 1-on-1 and group classes and self-paced video courses across a range of subjects.',
        'A free trial/demo class is offered so you can assess a tutor before enrolling.',
      ]},
      { h: 'Accounts', p: [
        'You are responsible for the accuracy of the information you provide and for activity under your account. Notify us of any unauthorised use.',
      ]},
      { h: 'Bookings, fees & payments', p: [
        'Course and class fees are shown on the site and confirmed at enrolment. Applicable taxes (including GST) are added where relevant.',
        'Enrolment is confirmed once payment is received. Schedules are agreed between you and your tutor.',
      ]},
      { h: 'Conduct', p: [
        'Classes are for the enrolled student\'s personal learning. Recording, redistributing or reselling class content or materials without permission is not allowed.',
        'We expect respectful conduct between students, parents and tutors.',
      ]},
      { h: 'Cancellations & refunds', p: [
        'Cancellations and refunds are governed by our Refund & Cancellation Policy.',
      ]},
      { h: 'Intellectual property', p: [
        'Curriculum, notes, and course materials remain the property of us or the respective tutor and are licensed to you for personal learning only.',
      ]},
      { h: 'Limitation of liability', p: [
        'The service is provided on a reasonable-effort basis. To the extent permitted by law, our liability for any claim is limited to the fees paid for the class or course concerned.',
      ]},
      { h: 'Governing law', p: [
        'These terms are governed by the laws of India, and courts at Kolkata have jurisdiction.',
      ]},
      { h: 'Contact', p: [
        `${CONTACT.brand}, ${CONTACT.address}. Email ${CONTACT.email}, phone ${CONTACT.phone}.`,
      ]},
    ],
  },

  refund: {
    title: 'Refund & Cancellation Policy',
    updated: 'July 2026',
    intro: `We want you to be confident before you commit. This policy explains trials, cancellations and refunds for classes booked through ${CONTACT.brand}.`,
    sections: [
      { h: 'Free trial', p: [
        'Your first demo/trial class is free. If it isn\'t the right fit, you are under no obligation to continue.',
      ]},
      { h: 'Satisfaction after the first paid class', p: [
        'If you are not satisfied after your first paid class, contact us within 7 days for a full refund of that class or plan.',
      ]},
      { h: 'Cancelling an enrolment', p: [
        'You may cancel an ongoing enrolment at any time. Fees for classes already delivered are non-refundable; unused, pre-paid classes are refunded on a pro-rata basis.',
      ]},
      { h: 'Rescheduling', p: [
        'Classes can be rescheduled by mutual agreement with your tutor, subject to reasonable notice. Missed classes without notice may be treated as delivered.',
      ]},
      { h: 'How refunds are processed', p: [
        'Approved refunds are made to the original payment method, typically within 7–10 business days. Payment-gateway or bank timelines may apply.',
      ]},
      { h: 'How to request', p: [
        `Email ${CONTACT.email} or call ${CONTACT.phone} with your enrolment details and reason. We aim to respond within 2 business days.`,
      ]},
    ],
  },
};
