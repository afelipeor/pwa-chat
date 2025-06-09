import { useCallback, useEffect, useState } from 'react';
import ChatRoom from '../components/ChatRoom';
import Conversations from '../components/Conversations';
import LoginForm from '../components/LoginForm';
import Head from 'next/head';

type View = 'conversations' | 'chat';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('conversations');
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Prevent unnecessary console logs during development
    if (process.env.NODE_ENV === 'development') {
      const originalWarn = console.warn;
      const originalError = console.error;

      console.warn = (...args) => {
        const message = args.join(' ');
        if (
          message.includes('Fast Refresh') ||
          message.includes('webpack-hmr') ||
          message.includes('devtools')
        ) {
          return;
        }
        originalWarn.apply(console, args);
      };

      console.error = (...args) => {
        const message = args.join(' ');
        if (
          message.includes('Failed to fetch') ||
          message.includes('net::ERR_CONNECTION_REFUSED')
        ) {
          return;
        }
        originalError.apply(console, args);
      };
    }

    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          // Silent success
        })
        .catch(() => {
          console.error('Service Worker registration failed');
        });
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallApp = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  }, [deferredPrompt]);

  const handleLogin = useCallback((newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const handleLogout = useCallback(() => {
    setToken(null);
    setUser(null);
    setCurrentView('conversations');
    setSelectedConversationId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setCurrentView('chat');
  }, []);

  const handleBackToConversations = useCallback(() => {
    setCurrentView('conversations');
    setSelectedConversationId(null);
  }, []);

  const getPageTitle = () => {
    if (!user) return 'Mobile Chat PWA';

    if (currentView === 'conversations') {
      return `Conversations - ${user.username} | Chat PWA`;
    } else if (currentView === 'chat') {
      return `Chat - ${user.username} | Chat PWA`;
    }

    return `${user.username} | Chat PWA`;
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{getPageTitle()}</title>
        <meta
          name="description"
          content="Real-time mobile chat application with offline support and push notifications"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />

        <link
          rel="manifest"
          href="/manifest.json"
        />
        <meta
          name="theme-color"
          content="#667eea"
        />
        <meta
          name="background-color"
          content="#667eea"
        />

        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta
          name="apple-mobile-web-app-title"
          content="ChatApp"
        />
        <link
          rel="apple-touch-icon"
          href="/icons/apple-touch-icon-180x180.png"
        />

        <meta
          name="msapplication-TileColor"
          content="#667eea"
        />
        <meta
          name="msapplication-config"
          content="/browserconfig.xml"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon.png"
        />
        <link
          rel="shortcut icon"
          href="/favicon.ico"
        />
      </Head>

      {showInstallButton && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            background: '#667eea',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            border: 'none',
            fontWeight: '600',
          }}
          onClick={handleInstallApp}>
          📱 Install App
        </div>
      )}

      {!token || !user ? (
        <LoginForm onLogin={handleLogin} />
      ) : currentView === 'conversations' ? (
        <Conversations
          token={token}
          currentUser={user}
          onSelectConversation={handleSelectConversation}
          onLogout={handleLogout}
        />
      ) : (
        <ChatRoom
          token={token}
          currentUser={user}
          conversationId={selectedConversationId}
          onBack={handleBackToConversations}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
