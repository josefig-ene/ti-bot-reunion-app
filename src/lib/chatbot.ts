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

const LOCATION_KEYWORDS = ['where', 'location', 'place', 'venue', 'building', 'address', 'directions'];
const DATE_KEYWORDS = ['when', 'date', 'dates', 'time', 'schedule', 'day'];
const HOTEL_KEYWORDS = ['hotel', 'marriott', 'housing', 'room', 'accommodation', 'stay', 'code', 'rate', 'price', 'block'];
const ENTERTAINMENT_KEYWORDS = ['perform', 'entertainment', 'music', 'band', 'artist', 'show', 'stanley', 'jordan', 'concert'];
const ACTIVITY_KEYWORDS = ['golf', 'dinner', 'lunch', 'breakfast', 'activity', 'activities', 'event', 'photo', 'talent'];
const REGISTRATION_KEYWORDS = ['register', 'registration', 'sign up', 'rsvp', 'deadline', 'cost', 'fees'];

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

  const customization = storage.getCustomization();
  const contactEmail = customization?.primary_contact_email || 'contact@reunion.com';

  const queryType = detectQueryType(lowerMessage);
  const relevantInfo = await extractRelevantInfo(userMessage, queryType);

  if (!relevantInfo) {
    return {
      message: `Hmm, I don't have that detail yet — can you upload the latest flyer? 🤔\n\nOr reach out to Jose Figueroa at ${contactEmail} for the most up-to-date info!`
    };
  }

  let response = formatResponse(relevantInfo, queryType);

  if (lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('expensive') || lowerMessage.includes('afford')) {
    if (!response.toLowerCase().includes('tigers helping tigers')) {
      response += `\n\n💙 Financial aid available via Tigers Helping Tigers if needed — just email Jose confidentially at ${contactEmail}!`;
    }
  }

  if (lowerMessage.includes('alone') || lowerMessage.includes('solo') || lowerMessage.includes("don't know anyone")) {
    response += "\n\n👥 Coming solo? We have a roommate pairing program! Email your mobile to 81s40th+45thWARG@gmail.com to join the WhatsApp group.";
  }

  const result: ChatResponse = { message: response };

  if (queryType === 'location' && customization?.google_maps_link) {
    result.includeMap = true;
    result.mapLink = customization.google_maps_link;
  }

  return result;
}

function detectQueryType(message: string): string {
  if (DATE_KEYWORDS.some(kw => message.includes(kw))) return 'date';
  if (HOTEL_KEYWORDS.some(kw => message.includes(kw))) return 'hotel';
  if (ENTERTAINMENT_KEYWORDS.some(kw => message.includes(kw))) return 'entertainment';
  if (ACTIVITY_KEYWORDS.some(kw => message.includes(kw))) return 'activity';
  if (REGISTRATION_KEYWORDS.some(kw => message.includes(kw))) return 'registration';
  if (LOCATION_KEYWORDS.some(kw => message.includes(kw))) return 'location';
  return 'general';
}

async function extractRelevantInfo(userMessage: string, queryType: string): Promise<string | null> {
  const allChunks = storage.getChunks();
  if (!allChunks || allChunks.length === 0) return null;

  const allText = allChunks.map(c => c.chunk_text).join(' ');
  const sentences = allText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  let scoredSentences: Array<{ sentence: string; score: number }> = [];

  sentences.forEach(sentence => {
    let score = 0;
    const lower = sentence.toLowerCase();

    switch (queryType) {
      case 'date':
        if (/\b(may|2026|21|22|23|24|thursday|friday|saturday|sunday)\b/i.test(sentence)) score += 100;
        if (/\b(reunion|dates?|schedule)\b/i.test(lower)) score += 50;
        break;

      case 'hotel':
        if (/\b(marriott|hotel|room)\b/i.test(lower)) score += 100;
        if (/\b(code|ti1981|\$500|500|rate|block)\b/i.test(lower)) score += 80;
        if (/\b(reserved|housing|accommodation)\b/i.test(lower)) score += 40;
        break;

      case 'entertainment':
        if (/\b(stanley|jordan|perform|music|guitarist)\b/i.test(lower)) score += 100;
        if (/\b(friday|night|show|concert|talent)\b/i.test(lower)) score += 50;
        break;

      case 'activity':
        if (userMessage.toLowerCase().includes('golf') && /\b(golf)\b/i.test(lower)) score += 100;
        if (userMessage.toLowerCase().includes('dinner') && /\b(dinner)\b/i.test(lower)) score += 100;
        if (userMessage.toLowerCase().includes('lunch') && /\b(lunch)\b/i.test(lower)) score += 100;
        if (/\b(may 21|may 22|may 23|may 24)\b/i.test(lower)) score += 60;
        if (/\b(schedule|activity|activities|event)\b/i.test(lower)) score += 40;
        if (/\b(photo|barbecue|talent|checkout)\b/i.test(lower)) score += 30;
        break;

      case 'registration':
        if (/\b(rsvp|register|registration|deadline)\b/i.test(lower)) score += 100;
        if (/\b(april|2026|email)\b/i.test(lower)) score += 50;
        break;

      case 'location':
        if (/\b(lakeside|resort|watertown)\b/i.test(lower)) score += 100;
        if (/\b(address|drive|phone|location)\b/i.test(lower)) score += 50;
        break;
    }

    if (score > 0) {
      scoredSentences.push({ sentence, score });
    }
  });

  if (scoredSentences.length === 0) return null;

  scoredSentences.sort((a, b) => b.score - a.score);

  const topSentences = scoredSentences.slice(0, 2).map(s => s.sentence);

  return topSentences.join(' ');
}

function formatResponse(info: string, queryType: string): string {
  switch (queryType) {
    case 'date':
      return `🗓️ The 45th Reunion is May 21–24, 2026 — Thursday to Sunday! ${info}`;

    case 'hotel':
      if (info.toLowerCase().includes('marriott')) {
        return `🏨 Great news — we've got a room block at the Marriott! ${info} Book soon — rooms go fast at reunions!`;
      }
      return `🏨 ${info}`;

    case 'entertainment':
      if (info.toLowerCase().includes('stanley')) {
        return `🎵 Stanley Jordan (amazing jazz guitarist!) is performing Friday night! ${info}`;
      }
      return `🎵 ${info}`;

    case 'activity':
      return `🎯 Here's what's happening: ${info}`;

    case 'registration':
      return `📝 ${info}`;

    case 'location':
      return `📍 ${info}`;

    default:
      return info;
  }
}

export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
