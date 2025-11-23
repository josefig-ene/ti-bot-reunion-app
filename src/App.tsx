import { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import ChatInterface from './components/ChatInterface';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import { isAdminLoggedIn } from './lib/auth';

type AppView = 'welcome' | 'chat' | 'admin-login' | 'admin-panel';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>(undefined);

  const handleStartChat = (initialMessage?: string) => {
    setInitialChatMessage(initialMessage);
    setCurrentView('chat');
  };

  const handleEndChat = () => {
    setCurrentView('welcome');
  };

  const handleAdminClick = () => {
    if (isAdminLoggedIn()) {
      setCurrentView('admin-panel');
    } else {
      setCurrentView('admin-login');
    }
  };

  const handleAdminLoginSuccess = () => {
    setCurrentView('admin-panel');
  };

  const handleAdminLogout = () => {
    setCurrentView('welcome');
  };

  const handleBackToWelcome = () => {
    setCurrentView('welcome');
  };

  return (
    <>
      {currentView === 'welcome' && (
        <WelcomeScreen
          onStartChat={handleStartChat}
          onAdminClick={handleAdminClick}
        />
      )}
      {currentView === 'chat' && (
        <ChatInterface
          onEndChat={handleEndChat}
          initialMessage={initialChatMessage}
        />
      )}
      {currentView === 'admin-login' && (
        <AdminLogin
          onLoginSuccess={handleAdminLoginSuccess}
          onBack={handleBackToWelcome}
        />
      )}
      {currentView === 'admin-panel' && (
        <AdminPanel
          onLogout={handleAdminLogout}
          onBackToApp={handleBackToWelcome}
        />
      )}
    </>
  );
}

export default App;
