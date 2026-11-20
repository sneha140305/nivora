import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import "./Discover.css";

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

function Discover() {
  const [matches, setMatches] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [city, setCity] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMatches = async (selectedCity = "") => {
    setLoading(true);
    setError("");

    try {
      const endpoint = selectedCity.trim()
        ? `/api/matching/?city=${encodeURIComponent(selectedCity.trim())}`
        : "/api/matching/";

      const data = await apiRequest(endpoint);

      setMatches(data.matches || []);
      setTotalMatches(data.total_matches || 0);
    } catch (err) {
      setMatches([]);
      setTotalMatches(0);
      setError(err.message || "Unable to load roommate matches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
        fetchMatches();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearchCity(city);
    fetchMatches(city);
  };

  return (
    <div className="discover-page">
      <header className="discover-header">
        <Link to="/dashboard" className="discover-logo">
          NIVORA<span>.</span>
        </Link>

        <Link to="/dashboard" className="back-dashboard">
          ← Dashboard
        </Link>
      </header>

      <main className="discover-container">
        <section className="discover-intro">
          <p className="discover-eyebrow">FIND YOUR RHYTHM</p>
          <h1>Discover your next roommate.</h1>
          <p>
            Find people whose everyday habits and lifestyle align with yours.
          </p>
        </section>

        <form className="discover-search" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <label htmlFor="city-search">Search by city</label>
            <input
              id="city-search"
              type="text"
              placeholder="Enter a city, e.g. Indore"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>

          <button
            type="submit"
            className="discover-search-button"
            disabled={loading}
          >
            {loading ? "Searching..." : "Find Roommates"}
          </button>
        </form>

        <section className="matches-section">
          <div className="matches-heading">
            <div>
              <p className="discover-eyebrow">YOUR COMPATIBILITY</p>
              <h2>
                {loading ? "Finding matches..." : `${totalMatches} Roommate${totalMatches === 1 ? "" : "s"} Found`}
              </h2>
            </div>

            {searchCity && (
              <span className="city-tag">{searchCity}</span>
            )}
          </div>

          {loading && (
            <div className="discover-message">
              <div className="loading-spinner" />
              <p>Finding people who match your lifestyle...</p>
            </div>
          )}

          {!loading && error && (
            <div className="discover-empty">
              <h3>Let's set up your lifestyle first.</h3>
              <p>{error}</p>
              <Link to="/profile" className="discover-action">
                Complete My Profile
              </Link>
            </div>
          )}

          {!loading && !error && matches.length === 0 && (
            <div className="discover-empty">
              <div className="empty-icon">⌂</div>
              <h3>No matches found yet.</h3>
              <p>
                We couldn't find compatible roommates in this search.
                Try another city or check back as more people join NIVORA.
              </p>
              {searchCity && (
                <button
                  className="discover-action"
                  onClick={() => {
                    setCity("");
                    setSearchCity("");
                    fetchMatches();
                  }}
                >
                  Show My City's Matches
                </button>
              )}
            </div>
          )}

          {!loading && !error && matches.length > 0 && (
            <div className="roommate-grid">
              {matches.map((match) => (
                <article className="roommate-card" key={match.user_id}>
                  <div className="roommate-card-top">
                    <div className="roommate-avatar">
                      {match.full_name?.charAt(0)?.toUpperCase() || "R"}
                    </div>

                    <div className="roommate-identity">
                      <h3>{match.full_name}</h3>
                      <p>
                        {match.occupation || "Occupation not specified"}
                      </p>
                    </div>

                    <div className="compatibility-score">
                      <strong>
                        {Math.round(match.compatibility_score)}%
                      </strong>
                      <span>Match</span>
                    </div>
                  </div>

                  <div className="roommate-location">
                    <span>⌖</span>
                    {match.city || "City not specified"}
                  </div>

                  {match.bio && (
                    <p className="roommate-bio">{match.bio}</p>
                  )}

                  <div className="roommate-details">
                    {match.budget_min != null && match.budget_max != null && (
                      <div>
                        <span>Monthly Budget</span>
                        <strong>
                          ₹{match.budget_min.toLocaleString("en-IN")} – ₹
                          {match.budget_max.toLocaleString("en-IN")}
                        </strong>
                      </div>
                    )}

                    {match.sleep_time && (
                      <div>
                        <span>Sleep Time</span>
                        <strong>{match.sleep_time}</strong>
                      </div>
                    )}
                  </div>

                  <p className="match-message">{match.message}</p>

                  <details className="compatibility-breakdown">
                    <summary>View compatibility breakdown</summary>

                    <div className="breakdown-content">
                      {Object.entries(match.category_scores || {}).map(
                        ([factor, score]) => (
                          <div className="breakdown-row" key={factor}>
                            <span>
                              {factorLabels[factor] || factor}
                            </span>

                            <strong>
                              {score == null
                                ? "Not available"
                                : `${Math.round(score)}%`}
                            </strong>
                          </div>
                        )
                      )}
                    </div>
                  </details>

                  {match.matched_factors?.length > 0 && (
                    <div className="factor-group">
                      <h4>Things in common</h4>
                      <div className="factor-tags">
                        {match.matched_factors.map((factor) => (
                          <span className="match-tag" key={factor}>
                            ✓ {factorLabels[factor] || factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.conflict_factors?.length > 0 && (
                    <div className="factor-group">
                      <h4>Potential differences</h4>
                      <div className="factor-tags">
                        {match.conflict_factors.map((factor) => (
                          <span className="conflict-tag" key={factor}>
                            {factorLabels[factor] || factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Link
                    to={`/roommates/${match.user_id}`}
                    className="discover-action"
                  >
                    View Full Profile →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Discover;