import { useEffect, useState } from 'react';
import styles from '../styles/Conversations.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  username: string;
  email: string;
  isOnline: boolean;
  lastSeen: string;
}

interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: {
    text: string;
    timestamp: string;
    username: string;
  };
  unreadCount: number;
  updatedAt: string;
}

interface ConversationsProps {
  token: string;
  currentUser: any;
  onSelectConversation: (conversationId: string) => void;
  onLogout: () => void;
}

export default function Conversations({
  token,
  currentUser,
  onSelectConversation,
  onLogout,
}: ConversationsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
    fetchUsers();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else if (response.status === 401) {
        onLogout();
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter((user: User) => user.id !== currentUser.id));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const createConversation = async (participantId: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId }),
      });

      if (response.ok) {
        const conversation = await response.json();
        setShowNewConversation(false);
        onSelectConversation(conversation.id);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create conversation');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.id !== currentUser.id);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div className={styles.userDetails}>
                <h2>Conversations</h2>
                <span className={styles.userName}>@{currentUser.username}</span>
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => setShowNewConversation(true)}
              className={styles.newConversationButton}>
              ➕ New
            </button>
            <button
              onClick={onLogout}
              className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.conversationsList}>
        {conversations.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <h3>No conversations yet</h3>
            <p>Start a conversation by clicking the "New" button above</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation);
            return (
              <div
                key={conversation.id}
                className={styles.conversationItem}
                onClick={() => onSelectConversation(conversation.id)}>
                <div className={styles.avatar}>
                  <div className={styles.avatarCircle}>
                    {otherUser?.username.charAt(0).toUpperCase()}
                  </div>
                  {otherUser?.isOnline && (
                    <div className={styles.onlineIndicator} />
                  )}
                </div>

                <div className={styles.conversationInfo}>
                  <div className={styles.conversationHeader}>
                    <h3 className={styles.participantName}>
                      {otherUser?.username || 'Unknown User'}
                    </h3>
                    <span className={styles.timestamp}>
                      {conversation.lastMessage
                        ? formatTime(conversation.lastMessage.timestamp)
                        : formatTime(conversation.updatedAt)}
                    </span>
                  </div>

                  <div className={styles.lastMessageContainer}>
                    <p className={styles.lastMessage}>
                      {conversation.lastMessage?.text || 'No messages yet'}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className={styles.unreadBadge}>
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Start New Conversation</h3>
              <button
                onClick={() => setShowNewConversation(false)}
                className={styles.closeButton}>
                ✕
              </button>
            </div>

            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.usersList}>
              {filteredUsers.length === 0 ? (
                <div className={styles.noUsers}>
                  {searchQuery ? 'No users found' : 'No other users available'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={styles.userItem}
                    onClick={() => createConversation(user.id)}>
                    <div className={styles.avatar}>
                      <div className={styles.avatarCircle}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      {user.isOnline && (
                        <div className={styles.onlineIndicator} />
                      )}
                    </div>

                    <div className={styles.userInfo}>
                      <h4>{user.username}</h4>
                      <p className={styles.userStatus}>
                        {user.isOnline
                          ? 'Online'
                          : `Last seen ${formatTime(user.lastSeen)}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {loading && (
              <div className={styles.loadingOverlay}>
                <div className={styles.spinner}>Creating conversation...</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
