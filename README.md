# Princeton Class of '81 Reunion Chatbot

An AI-powered chatbot assistant for the Princeton University Class of 1981's 45th Reunion (May 21-24, 2026).

## Overview

This application provides an intelligent chatbot interface that answers questions about the reunion using a customizable knowledge base. It includes a comprehensive admin panel for managing FAQs, customizing branding, and controlling user access.

## Features

### User Experience
- 💬 **Smart Chatbot**: AI-powered responses based on FAQ knowledge base
- 🗺️ **Location Integration**: Automatic Google Maps links for location queries
- 📥 **Chat Export**: Download conversation history as text file
- 🎯 **Contextual Responses**: Proactive suggestions for financial help, solo travelers, etc.
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile

### Admin Panel
- 📚 **FAQ Management**: Create, edit, delete, and organize questions/answers
- 🎨 **Customization**: Upload app icon, edit branding, configure messages
- 👥 **User Management**: Add and manage additional admin users
- 🔍 **Search Optimization**: Priority system and keyword tagging
- 🗺️ **Maps Configuration**: Set default campus map link
- 🔒 **Secure Access**: Password-protected admin area

## Quick Start

### 1. First-Time Setup

Create your first admin user by running this SQL in Supabase SQL Editor:

```sql
INSERT INTO admin_users (email, password_hash)
VALUES (
  'admin@example.com',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
);
```

**Default Password**: `admin123` (Change this immediately!)

To create a custom password hash, use the browser console:

```javascript
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

hashPassword('your-password').then(console.log);
```

### 2. Access Admin Panel

1. Visit the app
2. Click "Admin Settings" on welcome screen
3. Login with your credentials
4. Start adding FAQs and customizing the app

### 3. Add FAQ Content

Navigate to the FAQ Knowledge Base tab and add questions/answers. Each FAQ includes:
- **Question**: The question users might ask
- **Answer**: Detailed response (supports multiple paragraphs)
- **Category**: Organize by topic (General, Housing, Registration, etc.)
- **Keywords**: Improve search matching (comma-separated)
- **Priority**: Higher numbers appear first (0-100)
- **Status**: Active or Inactive

## Database Schema

### Tables
- `admin_users`: Administrator accounts with hashed passwords
- `faq_knowledge_base`: Question/answer pairs with search metadata
- `app_customization`: Branding and configuration settings
- `chat_sessions`: User conversation sessions
- `chat_messages`: Individual messages with role and metadata

All tables have Row Level Security (RLS) enabled for data protection.

## Chatbot Behavior

The bot is programmed to:

### Personality
- Be warm, conversational, and helpful
- Stay honest and direct without being cold
- Show enthusiasm about the reunion without being pushy
- Use "we" when referring to the reunion committee
- Use "you" when addressing users

### Proactive Features
- Mentions **Tigers Helping Tigers Fund** when cost concerns are detected
- Offers **roommate pairing** and **WhatsApp group** for solo travelers
- Shows **Google Maps link** for location-related questions
- Suggests related FAQs after answering questions
- Builds excitement about **Stanley Jordan's gift performance**

### Response Flow
1. Searches FAQ knowledge base for relevant answers
2. Matches based on keywords, question text, and priority
3. Provides main answer plus related suggestions
4. Includes map links when location keywords detected
5. Falls back to contact information if no match found

## Customization

### App Icon
1. Admin Panel → Customization tab
2. Click "Upload Icon"
3. Select image (any format, auto-converts to base64)
4. Changes appear immediately

### Welcome Message
Edit the greeting users see on the welcome screen through the Customization tab.

### Google Maps Link
Set the default campus map URL that appears when users ask location questions. Default points to Poe Field at Princeton.

### Contact Email
Configure the primary contact email shown throughout the app.

## Managing FAQs

### Best Practices

**Priority System**:
- 100: Critical info (dates, registration opening)
- 90-80: Important topics (costs, housing options)
- 70-60: Common questions (entertainment, solo travel)
- 50-0: Less frequent topics

**Keywords**:
Add variations users might search:
- Cost: "price", "expensive", "afford", "how much"
- Housing: "hotel", "dorm", "stay", "accommodation", "rooms"
- Location: "where", "map", "directions", "find"

**Categories**:
- General
- Registration
- Housing
- Financial Assistance
- Entertainment
- Communication
- Accessibility

### Inactive FAQs
Mark FAQs as inactive instead of deleting to preserve historical information.

## Admin User Management

### Adding Admins
1. Admin Panel → Admin Users tab
2. Enter email and password (8+ characters)
3. Click "Add Admin User"
4. New admin can immediately log in

### Security
- Passwords hashed with SHA-256
- Admin sessions stored in browser localStorage
- RLS policies prevent unauthorized data access
- Only authenticated admins can modify FAQs and settings

## Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Authentication**: Custom implementation with hashed passwords

## Key Files

```
src/
├── components/
│   ├── WelcomeScreen.tsx      # Landing page with quick prompts
│   ├── ChatInterface.tsx      # Main chat UI with message history
│   ├── AdminLogin.tsx         # Admin authentication
│   └── AdminPanel.tsx         # FAQ & customization management
├── lib/
│   ├── supabase.ts           # Database client & types
│   ├── auth.ts               # Admin authentication logic
│   ├── chatbot.ts            # AI response generation
│   └── seedData.ts           # Initial FAQ data
└── App.tsx                    # Main app router
```

## Reunion Information

**Event**: Princeton Class of 1981 45th Reunion
**Dates**: May 21-24, 2026
**Location**: Princeton University Campus
**Contact**: Jose Figueroa (81s40th+45chatbothelp@gmail.com)

### Key Details
- Registration opens November 27, 2025 (Early Bird)
- Early bird pricing: $400 (ends Dec 31, 2025)
- Campus housing waitlist available
- Rider University affordable option: $159-210/3 nights
- Stanley Jordan '81 performing Saturday night (as a gift!)
- Financial assistance available through Tigers Helping Tigers Fund

## Support & Development

### Common Issues

**Admin can't log in**:
- Verify user exists in `admin_users` table
- Ensure password hash is correct
- Check browser console for errors

**FAQs not appearing**:
- Confirm `is_active` is true
- Check that keywords match user queries
- Increase priority for important FAQs

**Chat responses not working**:
- Verify Supabase connection
- Check FAQ knowledge base has content
- Review browser console for errors

### Extending the Chatbot

To add more sophisticated AI:
1. Integrate OpenAI API or Anthropic Claude in `src/lib/chatbot.ts`
2. Use FAQs as context/training data
3. Keep existing keyword matching as fallback
4. Maintain conversational tone and personality

### Adding Features

Some ideas for enhancement:
- Email notifications for new questions
- Analytics dashboard for common queries
- Multi-language support
- Voice input/output
- Integration with reunion registration system
- Mobile app version

## License

Built for Princeton University Class of 1981

---

**For detailed setup instructions, see [SETUP.md](./SETUP.md)**
