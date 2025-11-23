# Chatbot Test Cases

## Expected Behavior

The chatbot now extracts **1-3 relevant sentences** from documents and returns friendly, enthusiastic responses with appropriate emojis.

## Test Questions

### 1. "When is the reunion?"
**Expected**: Should return specific date sentences like:
- 🗓️ "Our annual family reunion will be held from May 21-24, 2026 at Lakeside Resort."

### 2. "Who's performing?" or "Tell me about entertainment"
**Expected**: Should mention entertainment details with 🎵 emoji

### 3. "Hotel info?" or "Where do I stay?"
**Expected**: Should return accommodation details with 🏨 emoji like:
- "Rooms are reserved under 'Family Reunion 2026'. Cost: $150 per night (includes breakfast)"

### 4. "What's the schedule?"
**Expected**: Should return schedule highlights with 🗓️ emoji:
- "May 21: Arrival and welcome dinner at 6 PM. May 22: Lake activities and barbecue lunch..."

### 5. "Where is it?" or "Location?"
**Expected**: Should return location info with 📍 emoji:
- "Location: Lakeside Resort, 123 Lake Drive, Watertown. Phone: (555) 123-4567..."

### 6. "How do I register?"
**Expected**: Should return registration info with 📝 emoji:
- "RSVP by April 1, 2026 to contact@reunion.com"

### 7. "Contact information?"
**Expected**: Should return contact details with 📧 emoji

### 8. "Something completely unrelated"
**Expected**: Falls back gracefully:
- "Hmm, I don't have that specific detail in my knowledge base yet. 🤔 But don't worry! Reach out to Jose Figueroa..."

## Special Enhancements

### Cost Concerns
If user mentions "cost", "price", "expensive", or "afford":
- Adds Tigers Helping Tigers Fund message

### Solo Attendees
If user mentions "alone", "solo", or "don't know anyone":
- Adds roommate pairing and WhatsApp group info

## Key Improvements

✅ **Sentence-level extraction** instead of dumping full chunks
✅ **Smart keyword matching** with scoring based on query type
✅ **Natural, enthusiastic tone** with emojis
✅ **Context-aware responses** (dates get 🗓️, hotels get 🏨, etc.)
✅ **Concise answers** (1-3 sentences max)
✅ **Graceful fallback** for unknown queries
