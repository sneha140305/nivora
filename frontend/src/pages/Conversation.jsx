import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  LoaderCircle,
  CheckCheck,
} from "lucide-react";

import { useAuth } from "../context/useAuth";
import { apiRequest } from "../services/api";

import "./Conversation.css";

function Conversation() {
  const { userId } = useParams();
  const { user } = useAuth();

  const [roommateName, setRoommateName] = useState("Your Roommate");
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      await apiRequest(`/api/messages/chat/${userId}/read`, {
        method: "PATCH",
      });

      const data = await apiRequest(`/api/messages/chat/${userId}`);

      setMessages(data);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    const loadRoommate = async () => {
      try {
        const data = await apiRequest(`/api/matching/${userId}`);

        if (isMounted) {
          setRoommateName(data.full_name || "Your Roommate");
        }
      } catch {
        if (isMounted) {
          setRoommateName("Your Roommate");
        }
      }
    };

    loadRoommate();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(fetchMessages, 0);

    const interval = setInterval(fetchMessages, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleSend = async (event) => {
    event.preventDefault();

    const messageContent = content.trim();

    if (!messageContent || sending) return;

    try {
      setSending(true);
      setError("");

      await apiRequest(`/api/messages/chat/${userId}`, {
        method: "POST",
        body: JSON.stringify({
          content: messageContent,
        }),
      });

      setContent("");
      await fetchMessages();
    } catch (err) {
      setError(err.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend(event);
    }
  };

  return (
    <div className="conversation-page">
      <header className="conversation-header">
        <Link to="/messages" className="conversation-back">
          <ArrowLeft size={19} />
        </Link>

        <div className="conversation-user-avatar">
          {roommateName.charAt(0).toUpperCase()}
        </div>

        <div className="conversation-user-info">
          <h2>{roommateName}</h2>
          <span>
            <span className="conversation-online-dot" />
            NIVORA Connection
          </span>
        </div>

        <MessageCircle
          size={22}
          className="conversation-header-icon"
        />
      </header>

      <main className="conversation-main">
        <div className="conversation-intro">
          <div className="conversation-intro-icon">
            <MessageCircle size={25} />
          </div>

          <h3>Your space to connect.</h3>

          <p>
            Start a conversation and get to know your potential
            roommate better.
          </p>
        </div>

        {error && (
          <div className="conversation-error">
            {error}
          </div>
        )}

        <div className="conversation-messages">
          {loading ? (
            <div className="conversation-loading">
              <LoaderCircle size={25} className="conversation-spinner" />
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="conversation-empty">
              <p>No messages yet.</p>
              <span>Say hello and start your conversation!</span>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage =
                Number(message.sender_id) === Number(user?.id);

              return (
                <div
                  key={message.id}
                  className={`message-row ${
                    isOwnMessage ? "message-own" : "message-received"
                  }`}
                >
                  <div className="message-bubble">
                    <p>{message.content}</p>

                    <div className="message-meta">
                      <span>{formatTime(message.created_at)}</span>

                      {isOwnMessage && (
                        <span
                          className={`message-read-status ${
                            message.read_at ? "message-seen" : ""
                          }`}
                        >
                          <CheckCheck size={14} />
                          {message.read_at ? "Seen" : "Sent"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      <form className="conversation-composer" onSubmit={handleSend}>
        <div className="conversation-input-wrapper">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            maxLength={2000}
            rows={1}
            aria-label="Write a message"
          />

          <span>{content.length}/2000</span>
        </div>

        <button
          type="submit"
          className="conversation-send"
          disabled={!content.trim() || sending}
          aria-label="Send message"
        >
          {sending ? (
            <LoaderCircle size={20} className="conversation-spinner" />
          ) : (
            <Send size={19} />
          )}
        </button>
      </form>
    </div>
  );
}

export default Conversation;