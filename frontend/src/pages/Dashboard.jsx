import { useEffect, useState } from "react";
import {
  Home,
  Users,
  UserRound,
  Settings,
  LogOut,
  Moon,
  Sun,
  Heart,
  Sparkles,
  ArrowRight,
  ClipboardList,
  LoaderCircle,
  Handshake,
  MessageCircle,
  Bell,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { apiRequest } from "../services/api";

import "./Dashboard.css";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch lifestyle profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiRequest("/api/profile/");
        setProfile(data);
      } catch (error) {
        setProfileError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const data = await apiRequest(
          "/api/notifications/unread-count"
        );

        setUnreadCount(data.unread_count ?? 0);
      } catch {
        // Keep the dashboard usable if notifications cannot be loaded.
      }
    };

    const initialTimer = setTimeout(fetchUnreadCount, 0);
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const lifestyleItems = [
    {
      label: "Sleep schedule",
      value: profile?.sleep_time || "Not added",
      icon: Moon,
    },
    {
      label: "Wake-up time",
      value: profile?.wake_time || "Not added",
      icon: Sun,
    },
    {
      label: "Cleanliness",
      value: profile?.cleanliness_level || "Not added",
      icon: Sparkles,
    },
    {
      label: "Food preference",
      value: profile?.food_preference || "Not added",
      icon: Heart,
    },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <a href="/" className="dashboard-brand">
          nivora<span>.</span>
        </a>

        <p className="sidebar-label">MENU</p>

        <nav className="sidebar-nav">
          <a href="/dashboard" className="sidebar-link active">
            <Home size={19} />
            Overview
          </a>

          <a href="#profile" className="sidebar-link">
            <UserRound size={19} />
            My Profile
          </a>

          <a href="#discover" className="sidebar-link">
            <Users size={19} />
            Discover Roommates
          </a>

          <a href="/connections" className="sidebar-link">
            <Handshake size={19} />
            My Connections
          </a>

          <button
            type="button"
            className="sidebar-link"
            onClick={() => navigate("/messages")}
          >
            <MessageCircle size={19} />
            Messages
          </button>

          <button
            type="button"
            className="sidebar-link"
            onClick={() => navigate("/notifications")}
          >
            <Bell size={19} />
            Notifications

            {unreadCount > 0 && (
              <span className="sidebar-notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <a href="#settings" className="sidebar-link">
            <Settings size={19} />
            Settings
          </a>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">
              YOUR PERSONAL SPACE
            </span>

            <h1>
              Welcome back, {user?.full_name?.split(" ")[0]}!
            </h1>

            <p>Let's find a living space that feels like home.</p>
          </div>

          <div className="dashboard-header-actions">
            <button
              type="button"
              className="dashboard-notification-button"
              onClick={() => navigate("/notifications")}
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <Bell size={22} />

              {unreadCount > 0 && (
                <span className="dashboard-notification-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <div className="dashboard-avatar">
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>

        <section className="dashboard-banner">
          <div>
            <span>YOUR NEXT CHAPTER STARTS HERE</span>

            <h2>Find someone who matches your rhythm.</h2>

            <p>
              Great shared living starts with compatible lifestyles.
              Complete your profile to discover your matches.
            </p>

            <a href="#profile" className="dashboard-primary-button">
              Complete your profile <ArrowRight size={17} />
            </a>
          </div>

          <div className="banner-icon">
            <Heart size={65} />
          </div>
        </section>

        <section className="dashboard-section" id="profile">
          <div className="dashboard-section-heading">
            <div>
              <span>YOUR PROFILE</span>
              <h2>Lifestyle overview</h2>
            </div>

            <button
              className="dashboard-text-button"
              onClick={() => navigate("/profile")}
            >
              Edit profile <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="dashboard-message">
              <LoaderCircle
                className="dashboard-spinner"
                size={22}
              />
              Loading your lifestyle profile...
            </div>
          ) : profile ? (
            <div className="lifestyle-grid">
              {lifestyleItems.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    className="lifestyle-card"
                    key={item.label}
                  >
                    <div className="lifestyle-icon">
                      <Icon size={21} />
                    </div>

                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="profile-empty">
              <div className="lifestyle-icon">
                <ClipboardList size={24} />
              </div>

              <h3>Your lifestyle profile is waiting!</h3>

              <p>
                {profileError ||
                  "Tell us about your daily habits and preferences."}
              </p>

              <button
                className="dashboard-primary-button"
                onClick={() => navigate("/profile")}
              >
                Create your profile <ArrowRight size={17} />
              </button>
            </div>
          )}
        </section>

        <section className="dashboard-section" id="discover">
          <div className="dashboard-section-heading">
            <div>
              <span>FIND YOUR PEOPLE</span>
              <h2>Discover roommates</h2>
            </div>
          </div>

          <div className="discover-card">
            <div className="discover-icon">
              <Users size={30} />
            </div>

            <div>
              <h3>Your next compatible roommate is out there.</h3>

              <p>
                Explore people whose routines, habits and lifestyle
                preferences align with yours.
              </p>
            </div>

            <button
              className="dashboard-primary-button"
              onClick={() => navigate("/discover")}
            >
              Discover matches <ArrowRight size={17} />
            </button>
          </div>
        </section>

        <footer className="dashboard-footer">
          Find your rhythm. Find your people.
          <span>© 2026 NIVORA</span>
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;