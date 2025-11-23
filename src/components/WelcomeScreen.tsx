import { useEffect, useState } from 'react';
import { MessageSquare, Calendar, MapPin, Users, Settings } from 'lucide-react';
import { supabase, AppCustomization } from '../lib/supabase';
import { isAdminLoggedIn } from '../lib/auth';

interface WelcomeScreenProps {
  onStartChat: (initialMessage?: string) => void;
  onAdminClick: () => void;
}

export default function WelcomeScreen({ onStartChat, onAdminClick }: WelcomeScreenProps) {
  const [customization, setCustomization] = useState<AppCustomization | null>(null);
  const [isAdmin] = useState(() => isAdminLoggedIn());

  useEffect(() => {
    loadCustomization();
  }, []);

  const loadCustomization = async () => {
    const { data } = await supabase
      .from('app_customization')
      .select('*')
      .single();

    if (data) {
      setCustomization(data);
    }
  };

  const quickPrompts = [
    { icon: Calendar, text: "When does registration open?", color: "orange" },
    { icon: MapPin, text: "What housing options are available?", color: "blue" },
    { icon: Users, text: "Tell me about entertainment", color: "green" },
    { icon: MessageSquare, text: "How can I get financial help?", color: "purple" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="flex justify-end mb-4">
          <button
            onClick={onAdminClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" />
            {isAdmin ? 'Admin Settings' : 'Admin Login'}
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="text-center mb-8">
            {customization?.app_icon_url ? (
              <div className="flex justify-center mb-6">
                <img
                  src={customization.app_icon_url}
                  alt="App Icon"
                  className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                />
              </div>
            ) : (
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-12 h-12 text-white" />
                </div>
              </div>
            )}

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              {customization?.app_name || "Class of '81 Reunion Assistant"}
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Princeton University 45th Reunion
            </p>
            <p className="text-2xl font-semibold text-orange-600">
              May 21-24, 2026
            </p>
          </div>

          <div className="mb-8">
            <p className="text-gray-700 text-center leading-relaxed">
              {customization?.welcome_message ||
                "Hi! I'm here to help with questions about the Class of '81 45th Reunion. What would you like to know?"}
            </p>
          </div>

          <button
            onClick={() => onStartChat()}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-orange-700 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mb-8"
          >
            Start Chatting
          </button>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide text-center mb-4">
              Popular Questions
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => onStartChat(prompt.text)}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left group border border-gray-200"
                >
                  <div className={`w-10 h-10 rounded-lg bg-${prompt.color}-100 flex items-center justify-center flex-shrink-0`}>
                    <prompt.icon className={`w-5 h-5 text-${prompt.color}-600`} />
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">
                    {prompt.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Need immediate assistance? Contact Jose Figueroa at{' '}
              <a
                href={`mailto:${customization?.primary_contact_email || '81s40th+45chatbothelp@gmail.com'}`}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                {customization?.primary_contact_email || '81s40th+45chatbothelp@gmail.com'}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
