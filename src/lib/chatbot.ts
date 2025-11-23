import { storage } from './storage';

export interface ChatResponse {
  message: string;
  includeMap?: boolean;
  mapLink?: string;
}

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

  const allChunks = storage.getChunks();
  const documents = allChunks.map(c => c.chunk_text);

  const answer = await generateSmartAnswer(lowerMessage, documents, contactEmail);

  let response = answer;

  if (lowerMessage.includes('alone') || lowerMessage.includes('solo') || lowerMessage.includes("don't know anyone")) {
    response += "\n\n👥 Coming solo? We have a roommate pairing program! Email your mobile to 81s40th+45thWARG@gmail.com to join the WhatsApp group.";
  }

  const result: ChatResponse = { message: response };

  if ((lowerMessage.includes('where') || lowerMessage.includes('location')) && customization?.google_maps_link) {
    result.includeMap = true;
    result.mapLink = customization.google_maps_link;
  }

  return result;
}

async function generateSmartAnswer(question: string, documents: string[], contactEmail: string): Promise<string> {
  const q = question.toLowerCase();
  const allText = documents.join("\n").toLowerCase();

  if (allText.length === 0) {
    return `Hmm, I don't have any documents loaded yet — can you upload the latest reunion flyer in /admin? 🤔\n\nOr reach out to Jose Figueroa at ${contactEmail} for details!`;
  }

  if (q.includes("hotel") || q.includes("housing") || q.includes("marriott") || q.includes("room") || q.includes("block") || q.includes("stay") || q.includes("accommodation") || q.includes("code")) {
    if (allText.includes("marriott")) {
      return "🏨 We've secured a block at the **Marriott Princeton** — rate is $500/night using reunion code **TI1981**. Book early — these rooms go fast!\n\n💙 Financial aid available via Tigers Helping Tigers if needed.";
    }
    if (allText.includes("hotel") || allText.includes("reserved")) {
      const hotelMatch = allText.match(/rooms? (?:are )?reserved under[^.!?]*[.!?]/i);
      if (hotelMatch) {
        return `🏨 ${hotelMatch[0].trim()} Book soon — rooms go fast at reunions!`;
      }
      return "🏨 Most classmates are staying at nearby hotels — we have a block with special reunion rates. Check the registration packet for the booking code!";
    }
    return "🏨 Hotel blocks available! Upload the latest reunion flyer in /admin for specific codes and rates, or contact Jose for booking details.";
  }

  if (q.includes("when") || q.includes("date") || q.includes("2026") || q.includes("time")) {
    if (allText.includes("may") && allText.includes("2026")) {
      const dateMatch = allText.match(/(?:may|from may)[^.!?]*?2026[^.!?]*[.!?]/i);
      if (dateMatch) {
        return `🗓️ The 45th Reunion is **May 21–24, 2026** — Thursday through Sunday! ${dateMatch[0].trim()}`;
      }
      return "🗓️ The 45th Reunion is **May 21–24, 2026** — Thursday through Sunday. Can't wait to see you there!";
    }
    return "🗓️ Check the uploaded reunion documents for exact dates, or reach out to Jose for the latest schedule!";
  }

  if (q.includes("perform") || q.includes("music") || q.includes("stanley") || q.includes("jordan") || q.includes("jazz") || q.includes("entertainment") || q.includes("band")) {
    if (allText.includes("stanley") || allText.includes("jordan")) {
      return "🎵 Yes! The one and only **Stanley Jordan** (legendary jazz guitarist) is performing Friday night — it's going to be incredible! 🎸";
    }
    const entertainMatch = allText.match(/(?:talent|show|entertainment|perform)[^.!?]*[.!?]/i);
    if (entertainMatch) {
      return `🎵 ${entertainMatch[0].trim()}`;
    }
    return "🎵 Entertainment lineup TBA — check back after uploading the latest reunion flyer, or ask Jose for performer details!";
  }

  if (q.includes("golf")) {
    const golfMatch = allText.match(/[^.!?]*golf[^.!?]*[.!?]/i);
    if (golfMatch) {
      return `⛳ ${golfMatch[0].trim()}`;
    }
    return "⛳ Golf outing details coming soon! Check the reunion schedule or contact the activities committee.";
  }

  if (q.includes("dinner") || q.includes("dance") || q.includes("schedule") || q.includes("events") || q.includes("activities")) {
    const scheduleMatches = allText.match(/(?:may 21|may 22|may 23|may 24)[^.!?]*[.!?]/gi);
    if (scheduleMatches && scheduleMatches.length > 0) {
      const topEvents = scheduleMatches.slice(0, 3).join(' ');
      return `🎯 Here's what's happening: ${topEvents}`;
    }
    const dinnerMatch = allText.match(/[^.!?]*(?:dinner|dance|barbecue)[^.!?]*[.!?]/i);
    if (dinnerMatch) {
      return `🎯 ${dinnerMatch[0].trim()}`;
    }
    return "🎯 Full schedule includes welcome events, dinners, activities, and the big P-rade! Upload the latest reunion packet for day-by-day details.";
  }

  if (q.includes("cost") || q.includes("price") || q.includes("fee") || q.includes("register") || q.includes("registration")) {
    const costMatch = allText.match(/[^.!?]*(?:cost|price|fee|\$|register|rsvp)[^.!?]*[.!?]/i);
    if (costMatch) {
      return `📝 ${costMatch[0].trim()}\n\n💙 Financial aid available via Tigers Helping Tigers if needed — just email Jose confidentially!`;
    }
    return "📝 Registration details coming soon! Upload the reunion packet for costs and deadlines, or contact Jose directly.";
  }

  if (q.includes("where") || q.includes("location") || q.includes("place") || q.includes("venue") || q.includes("address")) {
    const locationMatch = allText.match(/(?:location|venue|resort|hotel)[^.!?]*[.!?]/i);
    if (locationMatch) {
      return `📍 ${locationMatch[0].trim()}`;
    }
    return "📍 The reunion takes place at Princeton! Specific venue details in the reunion packet — upload it in /admin for more info.";
  }

  if (q.includes("contact") || q.includes("email") || q.includes("phone") || q.includes("call") || q.includes("reach")) {
    const contactMatch = allText.match(/[^.!?]*(?:email|phone|contact)[^.!?]*[.!?]/i);
    if (contactMatch) {
      return `📧 ${contactMatch[0].trim()}`;
    }
    return `📧 You can reach Jose Figueroa at ${contactEmail} for any questions about the reunion!`;
  }

  if (allText.length > 100) {
    const firstSentences = allText.match(/[^.!?]+[.!?]/g);
    if (firstSentences && firstSentences.length > 0) {
      return `Here's what I found: ${firstSentences[0].trim()} ${firstSentences[1]?.trim() || ''}`;
    }
  }

  return `Hmm, I don't have that specific detail yet — can you upload the latest reunion flyer in /admin? 🤔\n\nOr reach out to Jose Figueroa at ${contactEmail} — he's got all the answers!`;
}

export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
