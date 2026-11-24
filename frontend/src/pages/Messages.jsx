import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  MessageCircle,
  RefreshCw,
  LoaderCircle,
  Inbox,
  Clock3,
  Handshake,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import "./Messages.css";

function Messages() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchConversations = useCallback(async () => {
    try {
      setError("");
      const data = await apiRequest("/api/messages/conversations");
      setConversations(data);
    } catch (err) {
      setError(err.message || "Unable to load your conversations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchConversations]);

  const formatTime = (date) => {
    if (!date) return "";

    const messageDate = new Date(date);
    const today = new Date();

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    return messageDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="messages-page">
      <header className="messages-header">
        <Link to="/dashboard" className="messages-back">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="messages-heading">
          <div className="messages-heading-icon">
            <MessageCircle size={27} />
          </div>

          <div>
            <span>STAY CONNECTED</span>
            <h1>Your Messages</h1>
            <p>Good conversations make great roommate experiences.</p>
          </div>
        </div>
      </header>

      <main className="messages-content">
        <div className="messages-list-heading">
          <div>
            <h2>Conversations</h2>
            <p>Chat with roommates you've connected with.</p>
          </div>

          <button
            className="messages-refresh"
            onClick={fetchConversations}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && <div className="messages-alert">{error}</div>}

        {loading ? (
          <div className="messages-state">
            <LoaderCircle size={28} className="messages-spinner" />
            <p>Loading your conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="messages-empty">
            <div className="messages-empty-icon">
              <Inbox size={32} />
            </div>

            <h3>No conversations yet</h3>

            <p>
              Once you exchange your first message with an accepted
              connection, your conversation will appear here.
            </p>

            <Link to="/connections" className="messages-primary-button">
              <Handshake size={17} />
              View My Connections
            </Link>
          </div>
        ) : (
          <div className="messages-list">
            {conversations.map((conversation) => (
              <button
                className="conversation-card"
                key={conversation.user_id}
                onClick={() =>
                  navigate(`/messages/${conversation.user_id}`)
                }
              >
                <div className="conversation-avatar">
                  {conversation.profile_photo_url ? (
                    <img
                      src={conversation.profile_photo_url}
                      alt={conversation.full_name}
                    />
                  ) : (
                    conversation.full_name?.charAt(0)?.toUpperCase() || "?"
                  )}
                </div>

                <div className="conversation-details">
                  <div className="conversation-top">
                    <h3>{conversation.full_name}</h3>

                    <span className="conversation-time">
                      <Clock3 size={13} />
                      {formatTime(conversation.last_message_at)}
                    </span>
                  </div>

                  <div className="conversation-bottom">
                    <p>{conversation.last_message}</p>

                    {conversation.unread_count > 0 && (
                      <span className="conversation-unread">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Messages;