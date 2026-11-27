import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import "./RoommateDetails.css";

const factorLabels = {
  sleep: "Sleep Schedule",
  cleanliness: "Cleanliness",
  noise: "Noise Tolerance",
  budget: "Budget",
  work_schedule: "Work Schedule",
  social: "Social Lifestyle",
  guests: "Guest Frequency",
  food: "Food Preference",
  pets: "Pet Preference",
};

const valueLabels = {
  student: "Student",
  working_professional: "Working Professional",
  freelancer: "Freelancer",
  other: "Other",
  day_shift: "Day Shift",
  night_shift: "Night Shift",
  flexible: "Flexible",
  remote: "Remote",
  not_applicable: "Not Applicable",
  very_clean: "Very Clean",
  moderate: "Moderate",
  relaxed: "Relaxed",
  low: "Low",
  medium: "Medium",
  high: "High",
  vegetarian: "Vegetarian",
  non_vegetarian: "Non-Vegetarian",
  vegan: "Vegan",
  eggetarian: "Eggetarian",
  no_preference: "No Preference",
  introvert: "Introvert",
  balanced: "Balanced",
  extrovert: "Extrovert",
  rarely: "Rarely",
  sometimes: "Sometimes",
  frequently: "Frequently",
};

function formatValue(value) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return valueLabels[value] || value || "Not specified";
}

function RoommateDetails() {
  const { userId } = useParams();

  const [roommate, setRoommate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const navigate = useNavigate();
  const [blocking, setBlocking] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest(`/api/matching/${userId}`);
        setRoommate(data);
      } catch (err) {
        setError(err.message || "Unable to load roommate details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [userId]);

  const handleConnectionRequest = async () => {
    setSending(true);
    setRequestMessage("");

    try {
      await apiRequest("/api/connections/", {
        method: "POST",
        body: JSON.stringify({
          receiver_id: Number(userId),
        }),
      });

      setRequestMessage("Connection request sent successfully!");
    } catch (err) {
      setRequestMessage(err.message || "Unable to send request.");
    } finally {
      setSending(false);
    }
  };

  const handleBlockUser = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to block ${roommate.full_name}? They won't be able to find your profile, connect with you, or message you.`
    );

    if (!confirmed) return;

    setBlocking(true);
    setBlockMessage("");

    try {
      await apiRequest(`/api/safety/block/${userId}`, {
        method: "POST",
      });

      setBlockMessage("User blocked successfully.");

      setTimeout(() => {
        navigate("/discover");
      }, 1000);
    } catch (err) {
      setBlockMessage(err.message || "Unable to block this user.");
    } finally {
      setBlocking(false);
    }
  };
 
  if (loading) {
    return (
      <div className="roommate-details-page">
        <div className="details-state">
          <div className="loading-spinner" />
          <p>Loading roommate profile...</p>
        </div>
      </div>
    );
  }

  if (error || !roommate) {
    return (
      <div className="roommate-details-page">
        <div className="details-state">
          <h2>Profile unavailable</h2>
          <p>{error || "This roommate profile could not be found."}</p>
          <Link to="/discover" className="details-back-button">
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  const handleReportUser = async (event) => {
    event.preventDefault();

    if (!reportReason) {
      setReportMessage("Please select a reason for reporting.");
      return;
    }

    setReporting(true);
    setReportMessage("");

    try {
      await apiRequest(`/api/safety/report/${userId}`, {
        method: "POST",
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription.trim() || null,
        }),
      });

      setReportMessage("Report submitted successfully. Thank you for helping keep NIVORA safe.");
      setReportReason("");
      setReportDescription("");
      setShowReportForm(false);
    } catch (err) {
      setReportMessage(err.message || "Unable to submit your report.");
    } finally {
      setReporting(false);
    }
  };

  const lifestyleItems = [
    ["Sleep Time", roommate.sleep_time],
    ["Wake Time", roommate.wake_time],
    ["Work Schedule", roommate.work_schedule],
    ["Cleanliness", roommate.cleanliness_level],
    ["Noise Tolerance", roommate.noise_tolerance],
    ["Food Preference", roommate.food_preference],
    ["Social Lifestyle", roommate.social_level],
    ["Guest Frequency", roommate.guest_frequency],
    ["Pets Allowed", roommate.pets_allowed],
  ];

  return (
    <div className="roommate-details-page">
      <header className="details-header">
        <Link to="/dashboard" className="discover-logo">
          NIVORA<span>.</span>
        </Link>

        <Link to="/discover" className="back-dashboard">
          ← Back to Discover
        </Link>
      </header>

      <main className="details-container">
        <p className="discover-eyebrow">ROOMMATE PROFILE</p>

        <section className="details-profile-card">
          <div className="details-profile-top">
            <div className="details-avatar">
              {roommate.profile_photo_url ? (
                <img
                  src={roommate.profile_photo_url}
                  alt={`${roommate.full_name}'s profile`}
                />
              ) : (
                <span>
                  {(roommate.full_name || "Roommate")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0].toUpperCase())
                    .join("")}
                </span>
              )}
            </div>

            <div className="details-identity">
              <h1>{roommate.full_name}</h1>
              <p>{formatValue(roommate.occupation)}</p>
              <span>⌖ {roommate.city || "City not specified"}</span>
            </div>

            <div className="details-match-score">
              <strong>
                {Math.round(roommate.compatibility_score)}%
              </strong>
              <span>Compatible</span>
            </div>
          </div>

          {roommate.bio && (
            <div className="details-bio">
              <h3>About</h3>
              <p>{roommate.bio}</p>
            </div>
          )}

          <div className="details-budget">
            <span>Monthly Budget</span>
            <strong>
              {roommate.budget_min != null &&
              roommate.budget_max != null
                ? `₹${roommate.budget_min.toLocaleString("en-IN")} – ₹${roommate.budget_max.toLocaleString("en-IN")}`
                : "Not specified"}
            </strong>
          </div>
          <div className="details-safety-actions">
            <button
              type="button"
              className="details-block-button"
              onClick={handleBlockUser}
              disabled={blocking}
            >
              {blocking ? "Blocking..." : "Block User"}
            </button>
            <button
              type="button"
              className="details-report-button"
              onClick={() => {
                setShowReportForm((previous) => !previous);
                setReportMessage("");
              }}
            >
              {showReportForm ? "Cancel Report" : "Report User"}
            </button>

            {showReportForm && (
              <form className="details-report-form" onSubmit={handleReportUser}>
                <h3>Report this profile</h3>

                <label htmlFor="report-reason">Reason for reporting</label>
                <select
                  id="report-reason"
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="inappropriate_behavior">Inappropriate Behavior</option>
                  <option value="fake_profile">Fake Profile</option>
                  <option value="harassment">Harassment</option>
                  <option value="spam">Spam</option>
                  <option value="safety_concern">Safety Concern</option>
                  <option value="other">Other</option>
                </select>

                <label htmlFor="report-description">
                  Additional details (optional)
                </label>
                <textarea
                  id="report-description"
                  value={reportDescription}
                  onChange={(event) => setReportDescription(event.target.value)}
                  placeholder="Tell us more about the issue..."
                  rows={4}
                  maxLength={1000}
                />

                <button type="submit" disabled={reporting}>
                  {reporting ? "Submitting..." : "Submit Report"}
                </button>
              </form>
            )}

            {reportMessage && (
              <p className="safety-feedback">{reportMessage}</p>
            )}

            {blockMessage && (
              <p className="safety-feedback">{blockMessage}</p>
            )}
          </div>
        </section>

        <section className="details-section">
          <div className="details-section-heading">
            <p className="discover-eyebrow">EVERYDAY HABITS</p>
            <h2>Lifestyle & Preferences</h2>
          </div>

          <div className="lifestyle-grid">
            {lifestyleItems.map(([label, value]) => (
              <div className="lifestyle-item" key={label}>
                <span>{label}</span>
                <strong>{formatValue(value)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="details-section">
          <div className="details-section-heading">
            <p className="discover-eyebrow">YOUR COMPATIBILITY</p>
            <h2>Why you match</h2>
            <p>{roommate.message}</p>
          </div>

          <div className="details-breakdown">
            {Object.entries(roommate.category_scores || {}).map(
              ([factor, score]) => (
                <div className="details-breakdown-row" key={factor}>
                  <span>{factorLabels[factor] || factor}</span>

                  <div className="details-progress">
                    <div
                      className="details-progress-fill"
                      style={{
                        width: `${Math.max(0, Math.min(100, score ?? 0))}%`,
                      }}
                    />
                  </div>

                  <strong>
                    {score == null ? "N/A" : `${Math.round(score)}%`}
                  </strong>
                </div>
              )
            )}
          </div>

          <div className="details-factors">
            {roommate.matched_factors?.length > 0 && (
              <div>
                <h3>Things in common</h3>
                <div className="factor-tags">
                  {roommate.matched_factors.map((factor) => (
                    <span className="match-tag" key={factor}>
                      ✓ {factorLabels[factor] || factor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {roommate.conflict_factors?.length > 0 && (
              <div>
                <h3>Potential differences</h3>
                <div className="factor-tags">
                  {roommate.conflict_factors.map((factor) => (
                    <span className="conflict-tag" key={factor}>
                      {factorLabels[factor] || factor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="details-connect-card">
          <h2>Think you could be great roommates?</h2>
          <p>
            Send a connection request and take the first step towards
            finding your rhythm.
          </p>

          <button
            type="button"
            onClick={handleConnectionRequest}
            disabled={sending || requestMessage.includes("successfully")}
          >
            {sending
              ? "Sending..."
              : requestMessage.includes("successfully")
                ? "Request Sent"
                : "Send Connection Request"}
          </button>

          {requestMessage && (
            <p className="connection-feedback">{requestMessage}</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default RoommateDetails;