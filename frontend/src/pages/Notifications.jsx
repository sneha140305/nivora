import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  LoaderCircle,
  Inbox,
  MessageCircle,
  Handshake,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import "./Notifications.css";

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setError("");

      const [notificationData, countData] = await Promise.all([
        apiRequest("/api/notifications/"),
        apiRequest("/api/notifications/unread-count"),
      ]);

      setNotifications(notificationData);
      setUnreadCount(countData.unread_count);
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (err) {
      setError(err.message || "Unable to update notification.");
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest("/api/notifications/read-all", {
        method: "PATCH",
      });

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      setError(err.message || "Unable to update notifications.");
    }
  };

  const deleteNotification = async (notificationId) => {
    const notification = notifications.find(
      (item) => item.id === notificationId
    );

    try {
      await apiRequest(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      setNotifications((previous) =>
        previous.filter((item) => item.id !== notificationId)
      );

      if (notification && !notification.is_read) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }
    } catch (err) {
      setError(err.message || "Unable to delete notification.");
    }
  };

  const openNotification = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    navigate(notification.link || "/dashboard");
  };

  const formatTime = (date) => {
    if (!date) return "";

    const notificationDate = new Date(date);

    return notificationDate.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getNotificationIcon = (type) => {
    if (type === "new_message") return MessageCircle;
    if (type === "connection_request") return Handshake;
    if (type === "connection_accepted") return CheckCheck;

    return Bell;
  };

  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <Link to="/dashboard" className="notifications-back">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="notifications-heading">
          <div className="notifications-heading-icon">
            <Bell size={27} />
          </div>

          <div>
            <span>STAY IN THE LOOP</span>
            <h1>Your Notifications</h1>
            <p>All your NIVORA updates in one place.</p>
          </div>
        </div>
      </header>

      <main className="notifications-content">
        <div className="notifications-list-heading">
          <div>
            <h2>Recent Activity</h2>
            <p>
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
                : "You're all caught up!"}
            </p>
          </div>

          <div className="notifications-actions">
            <button
              className="notifications-refresh"
              onClick={fetchNotifications}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            {unreadCount > 0 && (
              <button
                className="notifications-mark-all"
                onClick={markAllAsRead}
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {error && <div className="notifications-alert">{error}</div>}

        {loading ? (
          <div className="notifications-state">
            <LoaderCircle
              size={28}
              className="notifications-spinner"
            />
            <p>Loading your notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">
              <Inbox size={32} />
            </div>

            <h3>No notifications yet</h3>
            <p>
              When someone connects with you or sends you a message,
              you'll see updates here.
            </p>

            <Link
              to="/discover"
              className="notifications-primary-button"
            >
              Discover Roommates
            </Link>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(
                notification.notification_type
              );

              return (
                <article
                  className={`notification-card ${
                    notification.is_read ? "read" : "unread"
                  }`}
                  key={notification.id}
                >
                  <button
                    className="notification-main"
                    onClick={() => openNotification(notification)}
                  >
                    <div className="notification-icon">
                      {notification.actor_profile_photo_url ? (
                        <img
                          src={notification.actor_profile_photo_url}
                          alt=""
                          className="notification-avatar-image"
                        />
                      ) : (
                        <Icon size={21} />
                      )}
                    </div>

                    <div className="notification-details">
                      <div className="notification-top">
                        <h3>{notification.title}</h3>
                        {!notification.is_read && (
                          <span className="notification-dot" />
                        )}
                      </div>

                      <p>{notification.message}</p>

                      <span className="notification-time">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                  </button>

                  <div className="notification-controls">
                    {!notification.is_read && (
                      <button
                        title="Mark as read"
                        aria-label="Mark notification as read"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check size={17} />
                      </button>
                    )}

                    <button
                      title="Delete notification"
                      aria-label="Delete notification"
                      onClick={() =>
                        deleteNotification(notification.id)
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Notifications;