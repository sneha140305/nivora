import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Handshake,
  MapPin,
  BriefcaseBusiness,
  Clock,
  Check,
  X,
  RefreshCw,
  LoaderCircle,
  Inbox,
  Send,
  MessageCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../services/api";
import "./Connections.css";

function Connections() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("received");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchConnections = useCallback(async () => {
    try {
      setError("");

      const [receivedData, sentData] = await Promise.all([
        apiRequest("/api/connections/received"),
        apiRequest("/api/connections/sent"),
      ]);

      setReceived(receivedData);
      setSent(sentData);
    } catch (err) {
      setError(err.message || "Unable to load connection requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadConnections = async () => {
      try {
        const [receivedData, sentData] = await Promise.all([
            apiRequest("/api/connections/received"),
            apiRequest("/api/connections/sent"),
        ]);
        if (isMounted) {
           setReceived(receivedData);
           setSent(sentData);
        }
    } catch (err) {
      if (isMounted) {
        setError(err.message || "Unable to load connection requests.");
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  loadConnections();

  return () => {
    isMounted = false;
  };
}, []);

  const handleResponse = async (requestId, status) => {
    try {
      setActionId(requestId);
      setError("");
      setSuccess("");

      await apiRequest(`/api/connections/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setSuccess(
        status === "accepted"
          ? "Connection request accepted!"
          : "Connection request rejected."
      );

      await fetchConnections();
    } catch (err) {
      setError(err.message || "Unable to update the request.");
    } finally {
      setActionId(null);
    }
  };

  const requests = activeTab === "received" ? received : sent;

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (status) => {
    if (status === "accepted") return "Accepted";
    if (status === "rejected") return "Rejected";
    return "Pending";
  };

  return (
    <div className="connections-page">
      <header className="connections-header">
        <Link to="/dashboard" className="connections-back">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="connections-heading">
          <div className="connections-heading-icon">
            <Handshake size={27} />
          </div>

          <div>
            <span>YOUR NIVORA NETWORK</span>
            <h1>My Connections</h1>
            <p>Manage your roommate connection requests.</p>
          </div>
        </div>
      </header>

      <main className="connections-content">
        <div className="connections-tabs">
          <button
            className={activeTab === "received" ? "active" : ""}
            onClick={() => {
              setActiveTab("received");
              setError("");
              setSuccess("");
            }}
          >
            <Inbox size={18} />
            Received
            <span>{received.length}</span>
          </button>

          <button
            className={activeTab === "sent" ? "active" : ""}
            onClick={() => {
              setActiveTab("sent");
              setError("");
              setSuccess("");
            }}
          >
            <Send size={18} />
            Sent
            <span>{sent.length}</span>
          </button>
        </div>

        <div className="connections-list-heading">
          <div>
            <h2>
              {activeTab === "received"
                ? "Received requests"
                : "Sent requests"}
            </h2>
            <p>
              {activeTab === "received"
                ? "People who would like to connect with you."
                : "Track the requests you have sent."}
            </p>
          </div>

          <button
            className="connections-refresh"
            onClick={fetchConnections}
            disabled={loading}
            title="Refresh requests"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {error && <div className="connections-alert error">{error}</div>}
        {success && (
          <div className="connections-alert success">{success}</div>
        )}

        {loading ? (
          <div className="connections-state">
            <LoaderCircle size={28} className="connections-spinner" />
            <p>Loading your connections...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="connections-empty">
            <div className="connections-empty-icon">
              {activeTab === "received" ? (
                <Inbox size={30} />
              ) : (
                <Send size={30} />
              )}
            </div>

            <h3>
              {activeTab === "received"
                ? "No requests yet"
                : "You haven't sent any requests"}
            </h3>

            <p>
              {activeTab === "received"
                ? "When someone wants to connect with you, their request will appear here."
                : "Explore compatible roommates and send a connection request to get started."}
            </p>

            <Link to="/discover" className="connections-discover-button">
              Discover Roommates
            </Link>
          </div>
        ) : (
          <div className="connections-grid">
            {requests.map((request) => (
              <article className="connection-card" key={request.id}>
                <div className="connection-card-top">
                  <div className="connection-avatar">
                    {request.user?.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  <span className={`connection-status ${request.status}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                <h3>{request.user?.full_name || "NIVORA Member"}</h3>

                {request.user?.occupation && (
                  <div className="connection-detail">
                    <BriefcaseBusiness size={15} />
                    {request.user.occupation}
                  </div>
                )}

                {request.user?.city && (
                  <div className="connection-detail">
                    <MapPin size={15} />
                    {request.user.city}
                  </div>
                )}

                {request.user?.bio && (
                  <p className="connection-bio">{request.user.bio}</p>
                )}

                <div className="connection-date">
                  <Clock size={14} />
                  Requested on {formatDate(request.created_at)}
                </div>

                {request.status === "accepted" && (
                    <button
                        className="connection-accept"
                        onClick={() => navigate(`/messages/${request.user.id}`)}
                    >
                        <MessageCircle size={16} />
                        Message
                    </button>
                )}

                {activeTab === "received" && request.status === "pending" && (
                  <div className="connection-actions">
                    <button
                      className="connection-reject"
                      onClick={() => handleResponse(request.id, "rejected")}
                      disabled={actionId !== null}
                    >
                      {actionId === request.id ? (
                        <LoaderCircle size={16} className="connections-spinner" />
                      ) : (
                        <X size={16} />
                      )}
                      Reject
                    </button>

                    <button
                      className="connection-accept"
                      onClick={() => handleResponse(request.id, "accepted")}
                      disabled={actionId !== null}
                    >
                      {actionId === request.id ? (
                        <LoaderCircle size={16} className="connections-spinner" />
                      ) : (
                        <Check size={16} />
                      )}
                      Accept
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Connections;