/**
 * ════════════════════════════════════════════════════════════════════
 *  TGA-COMPLIANT COPY LIBRARY — Golden Ratio Clinics
 * ════════════════════════════════════════════════════════════════════
 *
 *  ⚠️  CRITICAL — DO NOT EDIT WITHOUT LEGAL REVIEW
 *
 *  This file contains all user-facing copy for the Golden Ratio Clinics
 *  website. Every word has been reviewed against TGA Therapeutic Goods
 *  Act 1989 sections 42DL(10) and 42DLB(7), the Therapeutic Goods
 *  Advertising Code (TGAC), and Ahpra's Medicinal Cannabis Prescribing
 *  Guidance.
 *
 *  PROHIBITED — never reference in copy:
 *    • The words: cannabis, marijuana, CBD, THC, cannabinoid,
 *      hemp, plant medicine, plant-based medicine
 *    • Any specific health condition (chronic pain, anxiety, PTSD,
 *      sleep, epilepsy, cancer, palliative, neurological)
 *    • Therapeutic claims (treats, cures, helps with, relief from)
 *    • The phrase "TGA approved" or "TGA endorsed"
 *    • Patient names, testimonials, before/after stories
 *    • Star ratings of medicines or treatments
 *    • Cannabis/hemp leaf imagery in any form
 *
 *  PERMITTED — what we CAN say:
 *    • We offer telehealth consultations
 *    • Our practitioners are Australian-registered medical doctors
 *    • Our doctors hold Ahpra registration
 *    • A consultation may or may not result in a prescription
 *    • We operate under Australian therapeutic goods law
 *    • Generic descriptions of the consultation process
 *    • Practitioner credentials (factual, not promotional)
 *
 *  This is a HEALTH SERVICE advertisement, not a medicines
 *  advertisement. Our entire copy strategy is to promote the
 *  consultation service without referencing any specific therapeutic
 *  good or condition that the service might address.
 *
 *  Sources:
 *    https://www.tga.gov.au/resources/guidance/advertising-medicinal-cannabis-products-prohibited
 *    https://www.tga.gov.au/resources/guidance/advertising-health-service
 *    https://www.ahpra.gov.au/Resources/Medicinal-cannabis-prescribing.aspx
 * ════════════════════════════════════════════════════════════════════
 */

/* ─── Brand ─── */
export const BRAND = {
  name: "Golden Ratio Clinics",
  tagline: "Doctor-led telehealth consultations",
  legalEntity: "Greenleaf Global",
  phone: "1800 GR CLINIC",
  email: "hello@goldenratioclinics.com.au",
  practitionerCredential: "Australian-Registered Medical Practitioners",
} as const;

/* ─── Hero copy variants (one per design variation, all compliant) ─── */
export const HERO = {
  headlinePrimary: "A more considered approach",
  headlineAccent: "to your wellbeing",
  subheading:
    "Telehealth consultations with Australian-registered medical practitioners. Confidential, professional, and designed around your time.",
  ctaPrimary: "Book a Free Pre-Screening Call",
  ctaSecondary: "See If We Can Help",
  badge: "Australian-Registered Practitioners",
  trustItems: [
    { label: "15-minute consultations" },
    { label: "Nurse-led intake" },
    { label: "Strictly confidential" },
  ],
} as const;

/* ─── How It Works (process steps) ─── */
export const PROCESS = {
  eyebrow: "How It Works",
  heading: "Five steps, designed around you",
  subheading:
    "From your first call to your follow-up appointments, every step is guided by our experienced clinical team.",
  steps: [
    {
      num: "01",
      title: "Free Pre-Screening Call",
      desc: "A short, confidential conversation with one of our registered nurses about your general health and what you're looking for from a consultation.",
      time: "5–10 min",
    },
    {
      num: "02",
      title: "Intake Form",
      desc: "We'll guide you through a simple online form covering your medical history. This is reviewed by our clinical team before your appointment.",
      time: "10–15 min",
    },
    {
      num: "03",
      title: "Doctor Consultation",
      desc: "Meet via secure video or phone with an Australian-registered medical practitioner. Your doctor will discuss your health and the options available to you.",
      time: "15–20 min",
    },
    {
      num: "04",
      title: "Clinical Decision",
      desc: "Following your consultation, your doctor will determine the most appropriate next step. A consultation may or may not result in a prescription.",
      time: "Same day",
    },
    {
      num: "05",
      title: "Ongoing Support",
      desc: "If you become a patient of our clinic, we offer regular follow-up appointments to monitor your progress and adjust your care plan.",
      time: "As required",
    },
  ],
} as const;

/* ─── Who We Help — generic, no condition list ─── */
export const SERVICES = {
  eyebrow: "Our Practice",
  heading: "Patient-centred telehealth",
  subheading:
    "Our clinic offers consultations across a range of general health concerns. Each appointment is conducted with the same care and clinical rigour you'd expect from any medical practice — with the convenience of telehealth.",
  pillars: [
    {
      title: "Doctor-Led Care",
      desc: "Every consultation is conducted by an Australian-registered medical practitioner with current Ahpra registration.",
    },
    {
      title: "Nurse-Led Intake",
      desc: "Our registered nurses guide you through every step before your consultation, so you arrive prepared and at ease.",
    },
    {
      title: "Strictly Confidential",
      desc: "Your consultation, your records, and your information are protected under the Australian Privacy Principles.",
    },
    {
      title: "Telehealth Convenience",
      desc: "All consultations are delivered via secure video or phone — from the comfort of your home, anywhere in Australia.",
    },
    {
      title: "Considered & Unrushed",
      desc: "We don't pack our schedules. Every patient gets the time they need to have a meaningful conversation with their doctor.",
    },
    {
      title: "Australia-Wide",
      desc: "Our telehealth model means we can support patients across every state and territory.",
    },
  ],
  regulatoryNotice:
    "Golden Ratio Clinics operates as a regulated telehealth medical service in Australia. All consultations are conducted by Australian-registered medical practitioners. The outcome of any consultation is determined by your doctor following clinical assessment, in accordance with Australian therapeutic goods law and Ahpra prescribing guidance. A consultation does not guarantee any specific clinical outcome.",
} as const;

/* ─── Eligibility (service-eligibility, NOT product-eligibility) ─── */
export const ELIGIBILITY = {
  eyebrow: "Is Our Service Right For You?",
  heading: "Two minutes to find out",
  subheading:
    "Our telehealth service is designed for adults living in Australia who would like to speak with a registered medical practitioner. This short guide helps you understand whether a consultation with our clinic might be a good fit.",
  intro: {
    title: "Service Eligibility Guide",
    body: "Five quick questions to help us understand if you're ready for a consultation. This is not a medical assessment — it's simply a way to make sure our service can support you.",
    note: "All information you share is confidential and is not retained unless you choose to book a consultation.",
    cta: "Begin",
  },
  questions: [
    {
      id: "age",
      question: "Are you 18 years of age or older?",
      subtext:
        "Our telehealth consultations are available to adults only, in line with Australian medical practice standards.",
      options: [
        { label: "Yes, I'm 18 or over", value: "yes", score: 1 },
        { label: "No, I'm under 18", value: "no", score: 0 },
      ],
    },
    {
      id: "location",
      question: "Are you currently located in Australia?",
      subtext:
        "Our practitioners are registered to practise in Australia and we can only provide consultations to patients located here.",
      options: [
        { label: "Yes, I'm in Australia", value: "yes", score: 1 },
        { label: "No, I'm overseas", value: "no", score: 0 },
      ],
    },
    {
      id: "history",
      question:
        "Have you previously consulted a doctor about your general health?",
      subtext:
        "It's helpful for our clinical team to know if you've had relevant medical appointments in the past.",
      options: [
        { label: "Yes, regularly", value: "regular", score: 2 },
        { label: "Yes, occasionally", value: "occasional", score: 1 },
        { label: "Not in recent years", value: "none", score: 1 },
      ],
    },
    {
      id: "ready",
      question:
        "Are you comfortable having a consultation by video or phone?",
      subtext:
        "Telehealth consultations are equivalent to in-person appointments under Australian law, and many patients find them more convenient.",
      options: [
        { label: "Yes, I'm comfortable with telehealth", value: "yes", score: 2 },
        { label: "I'd prefer phone over video", value: "phone", score: 2 },
        { label: "I'm not sure", value: "unsure", score: 1 },
      ],
    },
    {
      id: "expectation",
      question: "What would you like to discuss with our doctor?",
      subtext:
        "Your answer helps our intake team prepare for your consultation. Your doctor will discuss your health in detail during the appointment.",
      options: [
        { label: "General wellbeing", value: "general", score: 1 },
        { label: "A long-standing health concern", value: "ongoing", score: 1 },
        { label: "A second opinion", value: "second", score: 1 },
        { label: "I'd rather discuss it with the doctor", value: "private", score: 1 },
      ],
    },
  ],
  results: {
    eligible: {
      title: "Our service may be a good fit",
      body: "Based on your answers, you appear to meet the eligibility criteria for a consultation with our clinic. The next step is a free pre-screening call with one of our registered nurses.",
    },
    callUs: {
      title: "Let's have a chat",
      body: "Your situation may still suit our service. A free pre-screening call with our nursing team is the best way to clarify whether we can support you.",
    },
    notEligible: {
      title: "Our service may not be the right fit right now",
      body: "Based on your answers, our telehealth service may not be the most appropriate option for you at this time. We recommend speaking with your regular GP about your health concerns.",
    },
    disclaimer:
      "This guide is not a medical assessment and the outcome does not guarantee acceptance into our clinic. All clinical decisions are made by your doctor during your consultation.",
  },
} as const;

/* ─── About ─── */
export const ABOUT = {
  eyebrow: "About Us",
  heading: "Healthcare in balance",
  body1:
    "Golden Ratio Clinics was founded on a simple belief: that everyone deserves access to compassionate, evidence-based healthcare. Our name reflects our approach — finding the balance between clinical rigour and human warmth, between tradition and modern delivery.",
  body2:
    "We are a telehealth medical practice. Our clinical team is made up of Australian-registered medical practitioners and registered nurses, all of whom hold current Ahpra registration. Every consultation we conduct is held to the same standards as any other Australian medical appointment.",
  stats: [
    { number: "100%", label: "Australian-registered practitioners" },
    { number: "100%", label: "Ahpra-compliant" },
    { number: "Australia", label: "Wide telehealth coverage" },
  ],
} as const;

/* ─── FAQ — TGA-safe ─── */
export const FAQ = {
  eyebrow: "FAQ",
  heading: "Common questions",
  items: [
    {
      q: "Who runs the consultations?",
      a: "Our consultations are conducted by Australian-registered medical practitioners holding current Ahpra registration. Your initial pre-screening call is conducted by a registered nurse on our clinical team.",
    },
    {
      q: "How much does a consultation cost?",
      a: "The initial pre-screening call with one of our nurses is free of charge. Doctor consultation fees are disclosed in full before any appointment is booked. We do not charge any consultation fees without your prior consent.",
    },
    {
      q: "Will I receive a prescription?",
      a: "We can't tell you that. The outcome of any consultation is determined by your doctor following clinical assessment. A consultation may or may not result in a prescription, and our clinic cannot guarantee any specific outcome before a doctor has met with you.",
    },
    {
      q: "Is this covered by Medicare or private health insurance?",
      a: "Currently our consultations are not covered by Medicare or most private health insurers. We will let you know the full out-of-pocket cost before any appointment is booked.",
    },
    {
      q: "How long does the process take?",
      a: "From your initial pre-screening call to your doctor consultation, most patients are seen within one week. Pre-screening calls are usually scheduled within one business day of your booking request.",
    },
    {
      q: "Is the consultation really 100% telehealth?",
      a: "Yes. Under Australian law, telehealth consultations are equivalent to in-person consultations. Our clinic conducts all appointments via secure video or phone call, and you can book from anywhere in Australia.",
    },
    {
      q: "How is my information protected?",
      a: "Your personal and clinical information is protected under the Australian Privacy Principles and the My Health Records Act. We never share your information with third parties without your explicit consent.",
    },
    {
      q: "What regulatory framework do you operate under?",
      a: "Golden Ratio Clinics operates as a regulated telehealth medical service in Australia. Our practitioners hold Ahpra registration and our clinical practices are conducted in accordance with Australian therapeutic goods law and Ahpra prescribing guidance.",
    },
  ],
} as const;

/* ─── Booking Form ─── */
export const BOOKING = {
  eyebrow: "Book Your Call",
  heading: "Start with a free pre-screening call",
  subheading:
    "One of our registered nurses will call you at a time that suits. The call is confidential, free of charge, and there is no obligation to book a consultation afterwards.",
  expectations: [
    "A 5–10 minute call with one of our registered nurses",
    "A confidential conversation about your general health",
    "An honest answer about whether our service can support you",
    "No cost, no pressure, and no obligation to proceed",
  ],
  consentText:
    "I consent to Golden Ratio Clinics contacting me regarding my enquiry. I understand that this is a pre-screening call and not a medical consultation. My information will be handled in accordance with the Australian Privacy Principles.",
  successTitle: "Thank you",
  successBody:
    "Our nursing team will be in touch within one business day to arrange your free pre-screening call. You'll receive a confirmation email shortly.",
  submitLabel: "Request My Free Call",
} as const;

/* ─── Final CTA ─── */
export const FINAL_CTA = {
  heading: "Ready to take the first step?",
  body: "A free, no-obligation pre-screening call with our registered nurses is the best way to find out if our service can support you.",
} as const;

/* ─── Mandatory regulatory disclaimer ─── */
export const REGULATORY_DISCLAIMER = {
  short:
    "Golden Ratio Clinics is a regulated telehealth medical service operating in Australia. All practitioners are Australian-registered and hold current Ahpra registration. A consultation does not guarantee any specific clinical outcome.",
  long:
    "Golden Ratio Clinics is a regulated telehealth medical service operating in Australia. All consultations are conducted by Australian-registered medical practitioners holding current Ahpra registration, in accordance with Australian therapeutic goods law and Ahpra prescribing guidance. A consultation does not guarantee any specific clinical outcome, including but not limited to a prescription, diagnosis, or referral. The information on this website is general in nature and does not constitute medical advice. If you are experiencing a medical emergency, please call 000.",
  footer:
    "Medical Disclaimer: The information on this website is for general informational purposes only and does not constitute medical advice, diagnosis, or treatment. All clinical decisions are made by your doctor during your consultation. Golden Ratio Clinics operates as a regulated telehealth medical practice in Australia, in accordance with Australian therapeutic goods law and Ahpra prescribing guidance.",
} as const;

/* ─── Navigation ─── */
export const NAV_LINKS = [
  { label: "How It Works", href: "#process" },
  { label: "Our Practice", href: "#services" },
  { label: "Eligibility", href: "#quiz" },
  { label: "About", href: "#about" },
  { label: "FAQ", href: "#faq" },
  { label: "Read This First", href: "/news" },
] as const;

/* ─── Footer Links ─── */
export const FOOTER = {
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Complaints Process", href: "/complaints" },
    { label: "Medical Disclaimer", href: "/disclaimer" },
  ],
  contact: {
    phone: BRAND.phone,
    email: BRAND.email,
    location: "Australia-wide telehealth",
  },
} as const;
