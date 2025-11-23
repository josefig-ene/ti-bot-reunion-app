import { storage } from './storage';

export interface ChatResponse {
  message: string;
  includeMap?: boolean;
  mapLink?: string;
}

interface KnowledgeChunk {
  id: string;
  file_id: string;
  chunk_index: number;
  chunk_text: string;
  keywords: string[];
}

const LOCATION_KEYWORDS = [
  'where', 'location', 'place', 'venue', 'building', 'address',
  'tigranova', 'poe field', 'map', 'directions', 'find', 'how do i get'
];

const DATE_KEYWORDS = ['when', 'date', 'dates', 'time', 'day', 'month', 'year', 'schedule'];
const HOTEL_KEYWORDS = ['hotel', 'accommodation', 'room', 'lodging', 'stay', 'code', 'rate', 'price'];
const ENTERTAINMENT_KEYWORDS = ['perform', 'entertainment', 'music', 'band', 'artist', 'show', 'stanley', 'jordan'];
const ACTIVITY_KEYWORDS = ['activity', 'activities', 'event', 'golf', 'dinner', 'lunch', 'photo', 'talent'];
const REGISTRATION_KEYWORDS = ['register', 'registration', 'sign up', 'rsvp', 'deadline'];
const CONTACT_KEYWORDS = ['contact', 'email', 'phone', 'call', 'reach'];

export async function generateChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<ChatResponse> {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage === 'hey') {
    return {
      message: "Hey there! 🎉 So excited you're interested in our Class of '81 45th Reunion! What would you like to know?"
    };
  }

  if (lowerMessage.includes('thank')) {
    return {
      message: "You're so welcome! Can't wait to see you at the reunion! Any other questions?"
    };
  }

  const isLocationQuery = LOCATION_KEYWORDS.some(keyword => lowerMessage.includes(keyword));

  const customization = storage.getCustomization();
  const contactEmail = customization?.primary_contact_email || '81s40th+45chatbothelp@gmail.com';

  const relevantSentences = await findRelevantSentences(userMessage);

  if (relevantSentences.length === 0) {
    return {
      message: `Hmm, I don't have that specific detail in my knowledge base yet. 🤔\n\nBut don't worry! Reach out to Jose Figueroa at ${contactEmail} — he's got all the answers and would love to help!\n\nAnything else I can help with?`
    };
  }

  let response = buildNaturalResponse(userMessage, relevantSentences);

  if (lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('expensive') || lowerMessage.includes('afford')) {
    if (!response.toLowerCase().includes('tigers helping tigers')) {
      response += `\n\n💙 If cost is a concern, the Tigers Helping Tigers Fund is here to help classmates attend. Just email Jose confidentially at ${contactEmail} and say "I need help." No forms, no judgment. We want YOU there!`;
    }
  }

  if (lowerMessage.includes('alone') || lowerMessage.includes('solo') || lowerMessage.includes("don't know anyone") || lowerMessage.includes('by myself')) {
    response += "\n\n👥 Coming solo? You're not alone! We have a roommate pairing program and a WhatsApp group to connect with classmates before the reunion. Email your mobile number to 81s40th+45thWARG@gmail.com to join!";
  }

  const result: ChatResponse = {
    message: response
  };

  if (isLocationQuery && customization?.google_maps_link) {
    result.includeMap = true;
    result.mapLink = customization.google_maps_link;
  }

  return result;
}

function buildNaturalResponse(userMessage: string, sentences: string[]): string {
  const lowerMessage = userMessage.toLowerCase();

  const isDateQuery = DATE_KEYWORDS.some(kw => lowerMessage.includes(kw));
  const isHotelQuery = HOTEL_KEYWORDS.some(kw => lowerMessage.includes(kw));
  const isEntertainmentQuery = ENTERTAINMENT_KEYWORDS.some(kw => lowerMessage.includes(kw));
  const isActivityQuery = ACTIVITY_KEYWORDS.some(kw => lowerMessage.includes(kw));
  const isRegistrationQuery = REGISTRATION_KEYWORDS.some(kw => lowerMessage.includes(kw));
  const isLocationQuery = LOCATION_KEYWORDS.some(kw => lowerMessage.includes(kw));
  const isContactQuery = CONTACT_KEYWORDS.some(kw => lowerMessage.includes(kw));

  const topSentences = sentences.slice(0, 3);
  const answer = topSentences.join(' ');

  if (isDateQuery) {
    return `🗓️ ${answer}`;
  }

  if (isHotelQuery) {
    return `🏨 ${answer}`;
  }

  if (isEntertainmentQuery) {
    return `🎵 ${answer}`;
  }

  if (isActivityQuery) {
    return `🎯 ${answer}`;
  }

  if (isRegistrationQuery) {
    return `📝 ${answer}`;
  }

  if (isLocationQuery) {
    return `📍 ${answer}`;
  }

  if (isContactQuery) {
    return `📧 ${answer}`;
  }

  return answer;
}

async function findRelevantSentences(userMessage: string): Promise<string[]> {
  const lowerMessage = userMessage.toLowerCase();
  const words = lowerMessage.split(/\s+/).filter(w => w.length > 2);

  const allChunks = storage.getChunks();
  if (!allChunks || allChunks.length === 0) return [];

  const allSentences: Array<{ sentence: string; score: number }> = [];

  allChunks.forEach((chunk: KnowledgeChunk) => {
    const sentences = chunk.chunk_text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    sentences.forEach(sentence => {
      let score = 0;
      const sentenceLower = sentence.toLowerCase();

      words.forEach(word => {
        if (sentenceLower.includes(word)) {
          score += 15;
        }
      });

      chunk.keywords.forEach(keyword => {
        if (sentenceLower.includes(keyword.toLowerCase())) {
          score += 25;
        }
      });

      const isDateQuery = DATE_KEYWORDS.some(kw => lowerMessage.includes(kw));
      const isHotelQuery = HOTEL_KEYWORDS.some(kw => lowerMessage.includes(kw));
      const isEntertainmentQuery = ENTERTAINMENT_KEYWORDS.some(kw => lowerMessage.includes(kw));

      if (isDateQuery && /\b(may|2026|21|22|23|24)\b/i.test(sentence)) {
        score += 50;
      }

      if (isHotelQuery && /\b(hotel|room|code|rate|\$|price)\b/i.test(sentence)) {
        score += 50;
      }

      if (isEntertainmentQuery && /\b(perform|stanley|jordan|music|band|show)\b/i.test(sentence)) {
        score += 50;
      }

      if (score > 0) {
        allSentences.push({ sentence, score });
      }
    });
  });

  return allSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.sentence);
}

export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
