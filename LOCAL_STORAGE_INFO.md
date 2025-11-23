# Local Storage Implementation

This app now uses **browser localStorage** instead of Supabase for all data persistence.

## Features

- **Chat functionality**: All chat messages and sessions stored in localStorage
- **Knowledge base**: File uploads processed and stored locally
- **Admin panel**: File management with upload, edit, and delete
- **Keyword matching**: Simple text-based search through uploaded documents
- **Sample data**: Pre-loaded reunion information (May 21-24, 2026)

## Default Admin Login

- **Email**: `admin@reunion.com`
- **Password**: `admin123`

## How It Works

### Storage Layer (`src/lib/storage.ts`)
- Handles all localStorage operations
- Stores files, chat history, and app settings
- Auto-initializes with sample reunion data

### Chat Bot (`src/lib/chatbot.ts`)
- Keyword-based matching (no AI/LLM)
- Searches through uploaded document chunks
- Returns relevant text based on keyword scores

### File Processing (`src/lib/fileUtils.ts` & `src/lib/chunkProcessor.ts`)
- Supports: TXT, PDF, Excel, Word
- Breaks documents into searchable chunks
- Extracts keywords automatically

## Data Persistence

All data is stored in browser localStorage:
- `reunion_files`: Uploaded files
- `reunion_chunks`: Searchable text chunks
- `chat_sessions`: Chat session metadata
- `chat_messages`: All chat messages
- `app_customization`: App settings
- `admin_users`: Admin credentials

**Note**: Data persists per browser/device. Clearing browser data will reset everything.

## Testing the Chat

Ask questions like:
- "When is the reunion?"
- "Where is it located?"
- "What's the schedule?"
- "How much does it cost?"

The bot will search through the sample reunion document and return relevant information.
