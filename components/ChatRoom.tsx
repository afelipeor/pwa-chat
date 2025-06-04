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
  onLogout: () => void;
}

export default function ChatRoom({
  token,
  currentUser,
  onLogout,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    subscribeToNotifications();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

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
        body: JSON.stringify({ text: messageText }),
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h2>Chat Room</h2>
          <div className={styles.userInfo}>
            <span className={styles.username}>{currentUser.username}</span>
            <div
              className={`${styles.status} ${
                connected ? styles.online : styles.offline
              }`}>
              {connected ? 'Online' : 'Offline'}
            </div>
          </div>
          <button
            onClick={onLogout}
            className={styles.logoutButton}>
            Logout
          </button>
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
