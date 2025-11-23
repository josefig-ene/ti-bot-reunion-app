import { supabase } from './supabase';

export interface ChatResponse {
  message: string;
  includeMap?: boolean;
  mapLink?: string;
}

interface KnowledgeChunk {
  id: string;
  file_id: string;
  chunk_type: 'qa' | 'section' | 'table';
  question: string | null;
  answer: string;
  context: string | null;
  category: string;
  keywords: string[];
  source_location: string | null;
}

const LOCATION_KEYWORDS = [
  'where is', 'location', 'place', 'venue', 'building',
  'tigranova', 'poe field', 'map', 'directions', 'find', 'how do i get'
];

export async function generateChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<ChatResponse> {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage === 'hey') {
    return {
      message: "Hi! I'm here to help with questions about the Class of '81 45th Reunion (May 21-24, 2026). What would you like to know?"
    };
  }

  if (lowerMessage.includes('thank')) {
    return {
      message: "You're welcome! Feel free to ask if you have any other questions about the reunion."
    };
  }

  const isLocationQuery = LOCATION_KEYWORDS.some(keyword =>
    lowerMessage.includes(keyword)
  );

  const { data: customization } = await supabase
    .from('app_customization')
    .select('*')
    .single();

  const contactEmail = customization?.primary_contact_email || '81s40th+45chatbothelp@gmail.com';

  const relevantChunks = await findRelevantChunks(userMessage);

  if (relevantChunks.length === 0) {
    return {
      message: `That's a great question! I don't have specific information about that in my knowledge base right now. \n\nFor the most accurate and up-to-date information, please contact Jose Figueroa at ${contactEmail}. He's our Reunion Chair and will be happy to help you directly.\n\nYou can also check our reunion website at https://lnk.bio/81s_45th_Reunion_Wild_Stripes_Festival_May_21_to_24_2026 for more details.\n\nIs there anything else I can help you with?`
    };
  }

  let response = relevantChunks[0].chunk.answer;

  if (lowerMessage.includes('cost') || lowerMessage.includes('expensive') || lowerMessage.includes('afford')) {
    if (!response.includes('Tigers Helping Tigers')) {
      response += `\n\nIf cost is a concern, please know that the Tigers Helping Tigers Fund exists to help classmates attend. Email Jose Figueroa confidentially at ${contactEmail}. Just say "I need help." No forms, no judgment. We want you there.`;
    }
  }

  if (lowerMessage.includes('alone') || lowerMessage.includes('solo') || lowerMessage.includes("don't know anyone")) {
    if (!response.includes('solo')) {
      response += "\n\nYou're definitely not alone in feeling this way! We have a roommate pairing program for solo travelers, and you can join our WhatsApp group to connect with classmates before reunion. Email your mobile number to 81s40th+45thWARG@gmail.com.";
    }
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

async function findRelevantChunks(userMessage: string): Promise<Array<{ chunk: KnowledgeChunk; score: number }>> {
  const lowerMessage = userMessage.toLowerCase();
  const words = lowerMessage.split(/\s+/).filter(w => w.length > 2);

  const { data: allChunks } = await supabase
    .from('knowledge_chunks')
    .select('*')
    .eq('is_active', true);

  if (!allChunks || allChunks.length === 0) return [];

  const scored = allChunks.map((chunk: KnowledgeChunk) => {
    let score = 0;
    const questionLower = (chunk.question || '').toLowerCase();
    const answerLower = chunk.answer.toLowerCase();
    const categoryLower = chunk.category.toLowerCase();

    if (chunk.chunk_type === 'qa' && questionLower) {
      const questionWords = questionLower.split(/\s+/).filter((w: string) => w.length > 2);
      const matchingWords = words.filter(w => questionWords.includes(w));

      if (matchingWords.length === words.length && words.length > 0) {
        score += 100;
      } else if (matchingWords.length > 0) {
        score += matchingWords.length * 20;
      }
    }

    if (answerLower.length > 100 && answerLower.length < 500) {
      score += 5;
    }

    words.forEach(word => {
      if (questionLower.includes(word)) score += 8;
      if (answerLower.includes(word)) score += 3;
      if (categoryLower.includes(word)) score += 4;
      if (chunk.keywords.some(kw => kw.toLowerCase() === word)) score += 12;
    });

    return { chunk, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 1);
}

export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
