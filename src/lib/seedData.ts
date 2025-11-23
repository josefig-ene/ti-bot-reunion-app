import { supabase } from './supabase';

export const seedFAQs = async () => {
  const faqs = [
    {
      question: "When is the reunion?",
      answer: "May 21-24, 2026 (Thursday through Sunday). Four full days of events, entertainment, and reconnecting with classmates. For detailed schedules, check our reunion website: https://lnk.bio/81s_45th_Reunion_Wild_Stripes_Festival_May_21_to_24_2026",
      category: "General",
      keywords: ["dates", "when", "schedule", "timing"],
      priority: 100,
      is_active: true
    },
    {
      question: "When does registration open?",
      answer: "Registration opens November 26 for committee members, November 27 for Early Bird list members, and November 29 for everyone else. Early bird pricing ends December 31, 2025 ($400 vs $500-600 later). Want to know what's included in registration?",
      category: "Registration",
      keywords: ["registration", "sign up", "register", "when open", "early bird"],
      priority: 95,
      is_active: true
    },
    {
      question: "How much does registration cost?",
      answer: "Early bird registration (through December 31, 2025): $400\nRegular registration (January 1 onwards): $500\nLate registration (closer to reunion): $600\n\nRegistration includes all meals Thursday through Sunday plus all entertainment. The earlier you register, the more you save!",
      category: "Registration",
      keywords: ["cost", "price", "registration fee", "how much", "expensive"],
      priority: 90,
      is_active: true
    },
    {
      question: "What housing options are available?",
      answer: "Great question! You have four housing options:\n\n1. Campus housing waitlist - All 97 beds are claimed, but you can join the waitlist. If someone cancels, beds are assigned by lottery.\n\n2. Rider University (most affordable) - $159-210 for 3 nights, 15-20 minutes from campus, shuttle being arranged\n\n3. Hotel block - 140 rooms at 8 area hotels, $209-549/night, book directly with hotels\n\n4. Book your own - Any Princeton-area hotel outside our block\n\nWant details on any specific option?",
      category: "Housing",
      keywords: ["housing", "hotel", "dorm", "rooms", "accommodation", "stay", "where to stay", "rider"],
      priority: 85,
      is_active: true
    },
    {
      question: "I'm worried about cost. Can I get help?",
      answer: "If cost is your only barrier, please don't let that stop you. The Tigers Helping Tigers Fund exists exactly for this—to help classmates attend who need support.\n\nEmail Jose Figueroa confidentially at 81s40th+45chatbothelp@gmail.com. Just say 'I need help.' No forms, no proof of income, no judgment. We want you there, and this reunion shouldn't be missed because of hotel prices.\n\nMost affordable housing: Rider University ($159-210 for 3 nights)\nEarly bird registration saves $100-200: $400 vs $500-600",
      category: "Financial Assistance",
      keywords: ["cost", "expensive", "afford", "financial help", "assistance", "tigers helping tigers", "money"],
      priority: 80,
      is_active: true
    },
    {
      question: "Who is Stanley Jordan?",
      answer: "Stanley Jordan '81 is a Grammy-nominated jazz guitarist and pioneer of the two-handed tapping technique—revolutionary in how guitar can be played. And yes, he's putting together the party band to end all party bands Saturday night as a gift to our class. Not for payment. He reached out and said he wanted to contribute to our 45th in this way.\n\nIt's extraordinary generosity. Search 'Stanley Jordan Purple Rain' on YouTube to see what he does, then imagine experiencing it live at Tigranova with your classmates. That's Saturday night after fireworks.",
      category: "Entertainment",
      keywords: ["stanley jordan", "saturday", "music", "entertainment", "prince", "performance"],
      priority: 75,
      is_active: true
    },
    {
      question: "What entertainment is planned?",
      answer: "We have incredible entertainment lined up:\n\nFriday Night: Brian Kirk & the Jirks - high-energy rock band\n\nSaturday Night: Stanley Jordan '81 putting together the Ultra Party Band as a GIFT to our class. This is a Grammy-nominated artist doing a Prince tribute and more—not for payment, but as his contribution to our reunion. Once-in-a-lifetime experience.\n\nPlus fireworks, the P-rade, and four days of events designed for reconnecting with classmates.",
      category: "Entertainment",
      keywords: ["entertainment", "music", "bands", "events", "friday", "saturday", "brian kirk"],
      priority: 70,
      is_active: true
    },
    {
      question: "I don't know anyone anymore. Should I still come?",
      answer: "You're definitely not alone—lots of classmates feel this way. Here's what we're doing about it:\n\nBefore reunion: Join the WhatsApp group (email your number to 81s40th+45thWARG@gmail.com) to connect with classmates now. If you're traveling solo, we can pair you with other solo travelers for roommate sharing.\n\nDuring reunion: Four days of programming designed for mixing. Tigranova layout encourages conversation. You'll be surprised how fast it comes back when you're face-to-face.\n\nReal talk: Some of the best reunion connections happen with classmates you barely knew in college. This is your chance to meet them for real. And 1,200 people graduated with you—statistically, you'll find your people.\n\nWant help connecting before reunion, or more info about the solo traveler program?",
      category: "General",
      keywords: ["alone", "solo", "don't know anyone", "lonely", "friends", "connections"],
      priority: 65,
      is_active: true
    },
    {
      question: "What about Rider University housing?",
      answer: "Rider University is our most affordable housing option at $159-210 for 3 nights (all three nights). It's 15-20 minutes from campus, and we're arranging shuttle service.\n\nThis is significantly more affordable than Princeton-area hotels ($300-500/night), and you'll be staying with other classmates. It's a great option if you're looking to keep costs down while still having the full reunion experience.\n\nFor booking details, contact Carrie Grabowski at carrie.grabowski@gmail.com after registration opens.",
      category: "Housing",
      keywords: ["rider", "rider university", "affordable", "cheap", "budget", "housing"],
      priority: 60,
      is_active: true
    },
    {
      question: "Where can I find more information?",
      answer: "Here are your main resources:\n\nReunion Website: https://lnk.bio/81s_45th_Reunion_Wild_Stripes_Festival_May_21_to_24_2026\n\nGeneral Questions & Registration: Jose Figueroa at 81s40th+45chatbothelp@gmail.com\n\nHousing (after registration opens): Carrie Grabowski at carrie.grabowski@gmail.com\n\nWhatsApp Group: Email your mobile number to 81s40th+45thWARG@gmail.com\n\nYearbook Updates: 81s40th+45yearbook@gmail.com\n\nWe're here to help make this reunion unforgettable!",
      category: "Communication",
      keywords: ["website", "contact", "information", "email", "help", "questions"],
      priority: 55,
      is_active: true
    },
    {
      question: "Why should I attend this reunion?",
      answer: "Look, we're going to be honest with you:\n\n1. We lost our 40th to the pandemic—it's been 10 years since we gathered\n\n2. Stanley Jordan '81 is putting together the party band to end all party bands as a gift to our class Saturday night\n\n3. This might be our last really good reunion while we're healthy enough to enjoy it (we'll be 72 at the 50th)\n\n4. We've lost classmates we thought we'd see again. Don't let this opportunity pass.\n\nIf you're worried about cost, Tigers Helping Tigers Fund can help. If you don't know anyone, we have programs to connect you. If logistics are a concern, we have affordable Rider option with shuttle service.\n\nWhat's holding you back? Maybe I can address specific concerns.",
      category: "General",
      keywords: ["why attend", "should i go", "worth it", "convince me", "reasons"],
      priority: 50,
      is_active: true
    }
  ];

  for (const faq of faqs) {
    await supabase
      .from('faq_knowledge_base')
      .insert(faq);
  }

  console.log('Seed data inserted successfully');
};
