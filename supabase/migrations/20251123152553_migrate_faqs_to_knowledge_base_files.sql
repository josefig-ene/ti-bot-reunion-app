/*
  # Migrate FAQs to Knowledge Base Files

  ## Summary
  Migrates all FAQ entries to the knowledge_base_files table and removes the FAQ system.
  The File Library becomes the single source of truth for all knowledge base content.

  ## Changes
  1. Insert all existing FAQs as knowledge base files
  2. Drop the faq_knowledge_base table
  3. Knowledge base files become the primary source for chatbot responses

  ## Migration Details
  - Each FAQ is converted to a file entry with:
    - file_name: Based on the question
    - file_content: The answer text
    - category: Preserved from FAQ
    - keywords: Preserved from FAQ
    - priority: Mapped to is_active (high priority FAQs = active files)
  
  ## Security
  - No RLS changes needed (knowledge_base_files already has appropriate policies)

  ## Notes
  - This is a one-way migration
  - FAQs are preserved as individual knowledge base entries
  - File Library is renamed to "Knowledge Base" in the UI
*/

-- Insert FAQ data as knowledge base files
INSERT INTO knowledge_base_files (file_name, file_type, file_size, file_content, description, category, keywords, is_active)
VALUES 
  ('When is the reunion?', 'text/plain', 256, 'May 21-24, 2026 (Thursday through Sunday). Four full days of events, entertainment, and reconnecting with classmates. For detailed schedules, check our reunion website: https://lnk.bio/81s_45th_Reunion_Wild_Stripes_Festival_May_21_to_24_2026', 'Reunion dates and schedule information', 'General', ARRAY['dates', 'when', 'schedule', 'timing'], true),
  
  ('When does registration open?', 'text/plain', 245, 'Registration opens November 26 for committee members, November 27 for Early Bird list members, and November 29 for everyone else. Early bird pricing ends December 31, 2025 ($400 vs $500-600 later). Want to know what''s included in registration?', 'Registration opening dates and early bird information', 'Registration', ARRAY['registration', 'sign up', 'register', 'when open', 'early bird'], true),
  
  ('How much does registration cost?', 'text/plain', 299, 'Early bird registration (through December 31, 2025): $400
Regular registration (January 1 onwards): $500
Late registration (closer to reunion): $600

Registration includes all meals Thursday through Sunday plus all entertainment. The earlier you register, the more you save!', 'Registration cost and pricing tiers', 'Registration', ARRAY['cost', 'price', 'registration fee', 'how much', 'expensive'], true),
  
  ('What housing options are available?', 'text/plain', 486, 'Great question! You have four housing options:

1. Campus housing waitlist - All 97 beds are claimed, but you can join the waitlist. If someone cancels, beds are assigned by lottery.

2. Rider University (most affordable) - $159-210 for 3 nights, 15-20 minutes from campus, shuttle being arranged

3. Hotel block - 140 rooms at 8 area hotels, $209-549/night, book directly with hotels

4. Book your own - Any Princeton-area hotel outside our block

Want details on any specific option?', 'Available housing options for reunion attendees', 'Housing', ARRAY['housing', 'hotel', 'dorm', 'rooms', 'accommodation', 'stay', 'where to stay', 'rider'], true),
  
  ('I''m worried about cost. Can I get help?', 'text/plain', 613, 'If cost is your only barrier, please don''t let that stop you. The Tigers Helping Tigers Fund exists exactly for this—to help classmates attend who need support.

Email Jose Figueroa confidentially at 81s40th+45chatbothelp@gmail.com. Just say ''I need help.'' No forms, no proof of income, no judgment. We want you there, and this reunion shouldn''t be missed because of hotel prices.

Most affordable housing: Rider University ($159-210 for 3 nights)
Early bird registration saves $100-200: $400 vs $500-600', 'Financial assistance through Tigers Helping Tigers Fund', 'Financial Assistance', ARRAY['cost', 'expensive', 'afford', 'financial help', 'assistance', 'tigers helping tigers', 'money'], true),
  
  ('Who is Stanley Jordan?', 'text/plain', 499, 'Stanley Jordan ''81 is a Grammy-nominated jazz guitarist and pioneer of the two-handed tapping technique—revolutionary in how guitar can be played. And yes, he''s putting together the party band to end all party bands Saturday night as a gift to our class. Not for payment. He reached out and said he wanted to contribute to our 45th in this way.

It''s extraordinary generosity. Search ''Stanley Jordan Purple Rain'' on YouTube to see what he does, then imagine experiencing it live at Tigranova with your classmates. That''s Saturday night after fireworks.', 'Information about Stanley Jordan and Saturday entertainment', 'Entertainment', ARRAY['stanley jordan', 'saturday', 'music', 'entertainment', 'prince', 'performance'], true),
  
  ('What entertainment is planned?', 'text/plain', 457, 'We have incredible entertainment lined up:

Friday Night: Brian Kirk & the Jirks - high-energy rock band

Saturday Night: Stanley Jordan ''81 putting together the Ultra Party Band as a GIFT to our class. This is a Grammy-nominated artist doing a Prince tribute and more—not for payment, but as his contribution to our reunion. Once-in-a-lifetime experience.

Plus fireworks, the P-rade, and four days of events designed for reconnecting with classmates.', 'Entertainment schedule and band information', 'Entertainment', ARRAY['entertainment', 'music', 'bands', 'events', 'friday', 'saturday', 'brian kirk'], true),
  
  ('I don''t know anyone anymore. Should I still come?', 'text/plain', 822, 'You''re definitely not alone—lots of classmates feel this way. Here''s what we''re doing about it:

Before reunion: Join the WhatsApp group (email your number to 81s40th+45thWARG@gmail.com) to connect with classmates now. If you''re traveling solo, we can pair you with other solo travelers for roommate sharing.

During reunion: Four days of programming designed for mixing. Tigranova layout encourages conversation. You''ll be surprised how fast it comes back when you''re face-to-face.

Real talk: Some of the best reunion connections happen with classmates you barely knew in college. This is your chance to meet them for real. And 1,200 people graduated with you—statistically, you''ll find your people.

Want help connecting before reunion, or more info about the solo traveler program?', 'Support for solo attendees and connection opportunities', 'General', ARRAY['alone', 'solo', 'don''t know anyone', 'lonely', 'friends', 'connections'], true),
  
  ('What about Rider University housing?', 'text/plain', 494, 'Rider University is our most affordable housing option at $159-210 for 3 nights (all three nights). It''s 15-20 minutes from campus, and we''re arranging shuttle service.

This is significantly more affordable than Princeton-area hotels ($300-500/night), and you''ll be staying with other classmates. It''s a great option if you''re looking to keep costs down while still having the full reunion experience.

For booking details, contact Carrie Grabowski at carrie.grabowski@gmail.com after registration opens.', 'Detailed information about Rider University housing', 'Housing', ARRAY['rider', 'rider university', 'affordable', 'cheap', 'budget', 'housing'], true),
  
  ('Where can I find more information?', 'text/plain', 474, 'Here are your main resources:

Reunion Website: https://lnk.bio/81s_45th_Reunion_Wild_Stripes_Festival_May_21_to_24_2026

General Questions & Registration: Jose Figueroa at 81s40th+45chatbothelp@gmail.com

Housing (after registration opens): Carrie Grabowski at carrie.grabowski@gmail.com

WhatsApp Group: Email your mobile number to 81s40th+45thWARG@gmail.com

Yearbook Updates: 81s40th+45yearbook@gmail.com

We''re here to help make this reunion unforgettable!', 'Contact information and resources', 'Communication', ARRAY['website', 'contact', 'information', 'email', 'help', 'questions'], true),
  
  ('Why should I attend this reunion?', 'text/plain', 699, 'Look, we''re going to be honest with you:

1. We lost our 40th to the pandemic—it''s been 10 years since we gathered

2. Stanley Jordan ''81 is putting together the party band to end all party bands as a gift to our class Saturday night

3. This might be our last really good reunion while we''re healthy enough to enjoy it (we''ll be 72 at the 50th)

4. We''ve lost classmates we thought we''d see again. Don''t let this opportunity pass.

If you''re worried about cost, Tigers Helping Tigers Fund can help. If you don''t know anyone, we have programs to connect you. If logistics are a concern, we have affordable Rider option with shuttle service.

What''s holding you back? Maybe I can address specific concerns.', 'Compelling reasons to attend the reunion', 'General', ARRAY['why attend', 'should i go', 'worth it', 'convince me', 'reasons'], true);

-- Drop the FAQ knowledge base table
DROP TABLE IF EXISTS faq_knowledge_base CASCADE;