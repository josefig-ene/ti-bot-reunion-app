import React, { useState, useEffect, useRef } from 'react';
import { Send, Download, X, MessageSquare } from 'lucide-react';
import { supabase, ChatMessage, AppCustomization } from '../lib/supabase';
import { generateChatResponse, generateUserId } from '../lib/chatbot';

interface ChatInterfaceProps {
  onEndChat: () => void;
  initialMessage?: string;
}

export default function ChatInterface({ onEndChat, initialMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [userId] = useState(() => generateUserId());
  const [customization, setCustomization] = useState<AppCustomization | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
    loadCustomization();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCustomization = async () => {
    const { data } = await supabase
      .from('app_customization')
      .select('*')
      .single();

    if (data) {
      setCustomization(data);
    }
  };

  const initializeChat = async () => {
    const { data: session } = await supabase
      .from('chat_sessions')
      .insert({
        user_identifier: userId,
        is_active: true
      })
      .select()
      .single();

    if (session) {
      setSessionId(session.id);

      const welcomeMessage = customization?.welcome_message ||
        "Hi! I'm here to help with questions about the Class of '81 45th Reunion (May 21-24, 2026). What would you like to know?";

      const { data: msg } = await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          role: 'assistant',
          content: welcomeMessage,
          metadata: {}
        })
        .select()
        .single();

      if (msg) {
        setMessages([msg]);
      }

      if (initialMessage) {
        setTimeout(() => {
          sendInitialMessage(session.id, initialMessage, [msg]);
        }, 100);
      }
    }
  };

  const sendInitialMessage = async (sessionId: string, message: string, currentMessages: ChatMessage[]) => {
    setIsLoading(true);

    const { data: userMsg } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message,
        metadata: {}
      })
      .select()
      .single();

    if (userMsg) {
      setMessages(prev => [...prev, userMsg]);

      try {
        const conversationHistory = currentMessages.map(m => ({
          role: m.role,
          content: m.content
        }));

        const response = await generateChatResponse(message, conversationHistory);

        let assistantContent = response.message;
        const metadata: Record<string, any> = {};

        if (response.includeMap && response.mapLink) {
          assistantContent += `\n\n📍 View campus map: ${response.mapLink}`;
          metadata.mapLink = response.mapLink;
        }

        const { data: assistantMsg } = await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: 'assistant',
            content: assistantContent,
            metadata
          })
          .select()
          .single();

        if (assistantMsg) {
          setMessages(prev => [...prev, assistantMsg]);
        }
      } catch (error) {
        console.error('Error generating response:', error);

        const errorMsg = await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: 'assistant',
            content: "I'm having trouble processing that right now. Please try again or contact Jose Figueroa at 81s40th+45chatbothelp@gmail.com for assistance.",
            metadata: {}
          })
          .select()
          .single();

        if (errorMsg.data) {
          setMessages(prev => [...prev, errorMsg.data]);
        }
      }
    }

    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !sessionId) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    const { data: userMsg } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: userMessage,
        metadata: {}
      })
      .select()
      .single();

    if (userMsg) {
      setMessages(prev => [...prev, userMsg]);
    }

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await generateChatResponse(userMessage, conversationHistory);

      let assistantContent = response.message;
      const metadata: Record<string, any> = {};

      if (response.includeMap && response.mapLink) {
        assistantContent += `\n\n📍 View campus map: ${response.mapLink}`;
        metadata.mapLink = response.mapLink;
      }

      const { data: assistantMsg } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: assistantContent,
          metadata
        })
        .select()
        .single();

      if (assistantMsg) {
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error('Error generating response:', error);

      const errorMsg = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: "I'm having trouble processing that right now. Please try again or contact Jose Figueroa at 81s40th+45chatbothelp@gmail.com for assistance.",
          metadata: {}
        })
        .select()
        .single();

      if (errorMsg.data) {
        setMessages(prev => [...prev, errorMsg.data]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadChat = () => {
    const chatText = messages.map(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleString();
      const role = msg.role === 'user' ? 'You' : 'Assistant';
      return `[${timestamp}] ${role}: ${msg.content}`;
    }).join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reunion-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEndChat = async () => {
    if (sessionId) {
      await supabase
        .from('chat_sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('id', sessionId);
    }
    onEndChat();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-50 to-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            {customization?.app_icon_url ? (
              <img
                src={customization.app_icon_url}
                alt="App Icon"
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <MessageSquare className="w-10 h-10 text-orange-600" />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {customization?.app_name || "Class of '81 Reunion Assistant"}
              </h1>
              <p className="text-sm text-gray-500">May 21-24, 2026</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadChat}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Download chat history"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={handleEndChat}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
              title="End chat"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">End Chat</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm border border-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content.replace(/\[CHUNK_IDS:[^\]]+\]/g, '')}
                </p>
                {message.metadata?.mapLink && (
                  <a
                    href={message.metadata.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block mt-2 text-sm underline ${
                      message.role === 'user' ? 'text-orange-100' : 'text-orange-600'
                    }`}
                  >
                    Open in Google Maps
                  </a>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about the reunion..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
