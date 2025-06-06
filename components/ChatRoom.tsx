// components/ChatRoom.tsx
import { useEffect, useRef, useState } from 'react';
import styles from '../styles/ChatRoom.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
  id: string;
  text: string;
  username: string;
  userId: string;
  timestamp: string;
}

interface ChatRoomProps {
  token: string;
  currentUser: any;
  conversationId?: string | null;
  onBack?: () => void;
  onLogout: () => void;
}

export default function ChatRoom({
  token,
  currentUser,
  conversationId,
  onBack,
  onLogout,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(true);
  const [conversationInfo, setConversationInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      fetchConversationInfo();
      const interval = setInterval(fetchMessages, 3000);
      subscribeToNotifications();
      return () => clearInterval(interval);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/messages?conversationId=${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        setConnected(true);
      } else if (response.status === 401) {
        onLogout();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setConnected(false);
    }
  };

  const fetchConversationInfo = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/conversations/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConversationInfo(data);
      }
    } catch (error) {
      console.error('Error fetching conversation info:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !conversationId) return;

    setLoading(true);
    const messageText = input.trim();
    setInput('');

    try {
      const response = await fetch(`${API_BASE}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: messageText,
          conversationId,
        }),
      });

      if (response.ok) {
        await fetchMessages();
        inputRef.current?.focus();
      } else {
        setInput(messageText);
        if (response.status === 401) {
          onLogout();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setInput(messageText);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        await fetch(`${API_BASE}/api/notifications/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ subscription }),
        });
      } catch (error) {
        console.error('Error subscribing to notifications:', error);
      }
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOwnMessage = (message: Message) => {
    return message.userId === currentUser.id;
  };

  const getOtherParticipant = () => {
    if (!conversationInfo) return null;
    return conversationInfo.participants.find(
      (p: any) => p.id !== currentUser.id
    );
  };

  const otherParticipant = getOtherParticipant();

  if (!conversationId) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {onBack && (
            <button
              onClick={onBack}
              className={styles.backButton}>
              ← Back
            </button>
          )}
          <div className={styles.titleSection}>
            <h2>
              {otherParticipant
                ? `Chat with ${otherParticipant.username}`
                : 'Chat'}
            </h2>
            <span className={styles.userName}>
              You: @{currentUser.username}
            </span>
          </div>
          <div className={styles.headerActions}>
            <div
              className={`${styles.status} ${
                connected ? styles.online : styles.offline
              }`}>
              {connected ? 'Online' : 'Offline'}
            </div>
            <button
              onClick={onLogout}
              className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${
                isOwnMessage(message) ? styles.own : styles.other
              }`}>
              <div className={styles.messageContent}>
                <div className={styles.messageHeader}>
                  <span className={styles.username}>{message.username}</span>
                  <span className={styles.timestamp}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className={styles.messageText}>{message.text}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          maxLength={1000}
          disabled={loading}
          className={styles.input}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className={styles.sendButton}>
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
