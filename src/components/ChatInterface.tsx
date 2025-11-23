import React, { useState, useEffect, useRef } from 'react';
import { Send, Download, X, MessageSquare } from 'lucide-react';
import { storage, ChatMessage, AppCustomization } from '../lib/storage';
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

  const loadCustomization = () => {
    const data = storage.getCustomization();
    setCustomization(data);
  };

  const initializeChat = () => {
    const newSessionId = `session-${Date.now()}`;
    setSessionId(newSessionId);

    const session = {
      id: newSessionId,
      user_identifier: userId,
      started_at: new Date().toISOString(),
      ended_at: null,
      is_active: true
    };
    storage.saveSession(session);

    if (initialMessage) {
      handleSendMessage(initialMessage);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend || !sessionId) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      session_id: sessionId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
      metadata: {}
    };

    storage.saveMessage(userMessage);
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await generateChatResponse(textToSend, conversationHistory);

      let assistantContent = response.message;
      if (response.includeMap && response.mapLink) {
        assistantContent += `\n\n[View on Google Maps](${response.mapLink})`;
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        session_id: sessionId,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
        metadata: {
          includeMap: response.includeMap,
          mapLink: response.mapLink
        }
      };

      storage.saveMessage(assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        session_id: sessionId,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date().toISOString(),
        metadata: {}
      };
      storage.saveMessage(errorMessage);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndChat = () => {
    if (sessionId) {
      const sessions = storage.getSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        session.is_active = false;
        session.ended_at = new Date().toISOString();
        storage.saveSession(session);
      }
    }
    onEndChat();
  };

  const downloadChatHistory = () => {
    const chatText = messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          {customization?.app_icon_url && (
            <img
              src={customization.app_icon_url}
              alt="App Icon"
              className="w-10 h-10 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {customization?.app_name || 'Ti-Bot Reunion Assistant'}
            </h1>
            <p className="text-sm text-gray-500">Ask me anything about the reunion</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadChatHistory}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Download chat history"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleEndChat}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="End chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <MessageSquare className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Start a conversation</h2>
              <p className="text-gray-500">
                {customization?.welcome_message || 'Ask me anything about the reunion!'}
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-800 shadow-md border border-gray-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-white shadow-md border border-gray-100">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
