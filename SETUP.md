# Princeton Class of '81 Reunion Chatbot Setup Guide

## Quick Start

### 1. Database Setup

The database schema has already been created automatically. You now need to:

1. **Create the first admin user** by running this SQL in the Supabase SQL Editor:

```sql
-- Create the first admin user
-- Replace 'admin@example.com' with your email
-- The password hash below is for 'admin123' - CHANGE THIS!

INSERT INTO admin_users (email, password_hash)
VALUES (
  'admin@example.com',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
);
```

To generate a new password hash, you can use this JavaScript code in your browser console:

```javascript
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Usage:
hashPassword('your-secure-password').then(hash => console.log(hash));
```

### 2. Seed FAQ Data (Optional)

To populate the knowledge base with initial Princeton reunion FAQs:

1. Open your browser console
2. Navigate to the app
3. Run:

```javascript
import { seedFAQs } from './src/lib/seedData';
seedFAQs();
```

Or manually add FAQs through the Admin Panel after logging in.

## Features

### User Features
- **AI-Powered Chatbot**: Answers questions about the Princeton Class of '81 45th Reunion
- **Knowledge Base Integration**: Automatically searches FAQs for relevant answers
- **Google Maps Integration**: Shows campus map for location-related queries
- **Chat History Download**: Export conversation as text file
- **End Chat**: Return to welcome screen anytime

### Admin Features
- **FAQ Management**: Add, edit, delete, and organize FAQs
- **Customization**:
  - Upload custom app icon
  - Change app name
  - Edit welcome message
  - Configure Google Maps link for campus
  - Set primary contact email
- **User Management**: Add additional admin users
- **Priority System**: Control which FAQs appear first in search results
- **Category Organization**: Group FAQs by topic
- **Keyword Tagging**: Improve search accuracy

## Usage

### For Users
1. Visit the app URL
2. Click "Start Chatting"
3. Ask any question about the reunion
4. Download chat history or end chat when done

### For Admins
1. From the welcome screen, click "Admin Settings"
2. Log in with your credentials
3. Manage FAQs, customize the app, or add admin users
4. Changes take effect immediately

## Technical Details

### Database Tables
- `admin_users`: Administrator accounts
- `faq_knowledge_base`: Question/answer knowledge base
- `app_customization`: App branding and settings
- `chat_sessions`: User chat sessions
- `chat_messages`: Individual messages with metadata

### Security
- Password hashing using SHA-256
- Row Level Security (RLS) enabled on all tables
- Admin-only access to management features
- Session-based authentication

## Common Tasks

### Adding a New Admin User
1. Log into Admin Panel
2. Go to "Admin Users" tab
3. Enter email and password (min 8 characters)
4. Click "Add Admin User"

### Creating FAQ Content
1. Log into Admin Panel
2. Go to "FAQ Knowledge Base" tab
3. Click "Add FAQ"
4. Fill in:
   - Question (required)
   - Answer (required)
   - Category (default: General)
   - Keywords (comma-separated for better search)
   - Priority (higher = appears first)
   - Status (Active/Inactive)
5. Click "Save FAQ"

### Updating App Branding
1. Log into Admin Panel
2. Go to "Customization" tab
3. Upload icon image (any format)
4. Update app name, welcome message, etc.
5. Click "Save Customization"

### Managing Google Maps Integration
1. Go to Admin Panel > Customization
2. Update "Google Maps Link (Campus Map)" field
3. This map will appear when users ask location questions
4. Default link points to Poe Field at Princeton

## Support

For technical issues or questions:
- Check the FAQ knowledge base
- Contact: Jose Figueroa at 81s40th+45chatbothelp@gmail.com

## Chatbot Personality

The bot is designed to be:
- Warm, conversational, and helpful
- Honest and direct without being cold
- Enthusiastic about reunion but not pushy
- Proactive about offering financial assistance when cost is mentioned
- Supportive of solo travelers who may not know many classmates
- Excited about Stanley Jordan's generous gift

The bot emphasizes:
- This reunion is special (10 years since last gathering)
- Financial help is available and confidential
- Multiple housing options at different price points
- Support systems for solo attendees
