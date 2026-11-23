import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import "./Discover.css";
import "./DiscoverFilters.css";

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

const initialFilters = {
  sleep: "",
  food: "",
  cleanliness: "",
  budgetMin: "",
  budgetMax: "",
  sort: "high",
};

function Discover() {
  const [matches, setMatches] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [city, setCity] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(initialFilters);

  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [connectingId, setConnectingId] = useState(null);
  const [connectionMessages, setConnectionMessages] = useState({});

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

  const fetchConnectionStatuses = async () => {
    try {
      const [sent, received] = await Promise.all([
        apiRequest("/api/connections/sent"),
        apiRequest("/api/connections/received"),
      ]);

      const statuses = {};

      const priority = {
        rejected: 1,
        pending: 2,
        incoming: 3,
        accepted: 4,
      };

      const addStatus = (userId, status) => {
        const existing = statuses[userId];

        if (
          !existing ||
          priority[status] > priority[existing]
        ) {
          statuses[userId] = status;
        }
      };

      sent.forEach((request) => {
        addStatus(request.user.id, request.status);
      });

      received.forEach((request) => {
        addStatus(
          request.user.id,
          request.status === "pending" ? "incoming" : request.status
        );
      });

      setConnectionStatuses(statuses);
    } catch (err) {
      console.error("Unable to load connection statuses:", err);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchMatches();
      fetchConnectionStatuses();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearchCity(city.trim());
    fetchMatches(city);
  };

  const handleConnect = async (userId) => {
    setConnectingId(userId);

    setConnectionMessages((previous) => ({
      ...previous,
      [userId]: "",
    }));

    try {
      await apiRequest("/api/connections/", {
        method: "POST",
        body: JSON.stringify({
          receiver_id: userId,
        }),
      });

      setConnectionStatuses((previous) => ({
        ...previous,
        [userId]: "pending",
      }));

      setConnectionMessages((previous) => ({
        ...previous,
        [userId]: "Connection request sent successfully!",
      }));
    } catch (err) {
      setConnectionMessages((previous) => ({
        ...previous,
        [userId]: err.message || "Unable to send connection request.",
      }));

      await fetchConnectionStatuses();
    } finally {
      setConnectingId(null);
    }
  };

  const updateFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const getOptions = (field) => {
    return [
      ...new Set(
        matches
          .map((match) => match[field])
          .filter((value) => value != null && String(value).trim() !== "")
          .map(String)
      ),
    ].sort((a, b) => a.localeCompare(b));
  };

  const filteredMatches = useMemo(() => {
    let result = [...matches];

    if (filters.sleep) {
      result = result.filter(
        (match) => match.sleep_time === filters.sleep
      );
    }

    if (filters.food) {
      result = result.filter(
        (match) => match.food_preference === filters.food
      );
    }

    if (filters.cleanliness) {
      result = result.filter(
        (match) => match.cleanliness_level === filters.cleanliness
      );
    }

    const minimumBudget =
      filters.budgetMin !== "" ? Number(filters.budgetMin) : null;

    const maximumBudget =
      filters.budgetMax !== "" ? Number(filters.budgetMax) : null;

    if (minimumBudget !== null || maximumBudget !== null) {
      result = result.filter((match) => {
        if (match.budget_min == null || match.budget_max == null) {
          return false;
        }

        const overlapsMinimum =
          minimumBudget === null || match.budget_max >= minimumBudget;

        const overlapsMaximum =
          maximumBudget === null || match.budget_min <= maximumBudget;

        return overlapsMinimum && overlapsMaximum;
      });
    }

    result.sort((a, b) => {
      const difference =
        a.compatibility_score - b.compatibility_score;

      return filters.sort === "low" ? difference : -difference;
    });

    return result;
  }, [matches, filters]);

  const activeFilterCount = [
    filters.sleep,
    filters.food,
    filters.cleanliness,
    filters.budgetMin,
    filters.budgetMax,
  ].filter((value) => value !== "").length;

  const renderConnectionButton = (userId) => {
    const status = connectionStatuses[userId];
    const isConnecting = connectingId === userId;

    if (status === "accepted") {
      return (
        <button className="quick-connect-button connected" disabled>
          ✓ Connected
        </button>
      );
    }

    if (status === "pending") {
      return (
        <button className="quick-connect-button pending" disabled>
          ◷ Request Pending
        </button>
      );
    }

    if (status === "incoming") {
      return (
        <Link to="/connections" className="quick-connect-button incoming">
          Respond in Connections →
        </Link>
      );
    }

    return (
      <button
        className="quick-connect-button"
        onClick={() => handleConnect(userId)}
        disabled={isConnecting}
      >
        {isConnecting
          ? "Sending..."
          : status === "rejected"
            ? "↻ Connect Again"
            : "+ Quick Connect"}
      </button>
    );
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

        <section className="discover-filters">
          <div className="filters-heading">
            <div>
              <p className="discover-eyebrow">REFINE YOUR SEARCH</p>
              <h2>Find your ideal match</h2>
              <p>Filter roommates by the lifestyle that matters to you.</p>
            </div>

            <button
              type="button"
              className="clear-filters-button"
              onClick={clearFilters}
              disabled={activeFilterCount === 0 && filters.sort === "high"}
            >
              Clear filters
              {activeFilterCount > 0 && (
                <span>{activeFilterCount}</span>
              )}
            </button>
          </div>

          <div className="filters-grid">
            <div className="filter-field">
              <label htmlFor="sleep-filter">Sleep schedule</label>
              <select
                id="sleep-filter"
                value={filters.sleep}
                onChange={(event) =>
                  updateFilter("sleep", event.target.value)
                }
              >
                <option value="">Any schedule</option>
                {getOptions("sleep_time").map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="food-filter">Food preference</label>
              <select
                id="food-filter"
                value={filters.food}
                onChange={(event) =>
                  updateFilter("food", event.target.value)
                }
              >
                <option value="">Any preference</option>
                {getOptions("food_preference").map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="cleanliness-filter">Cleanliness</label>
              <select
                id="cleanliness-filter"
                value={filters.cleanliness}
                onChange={(event) =>
                  updateFilter("cleanliness", event.target.value)
                }
              >
                <option value="">Any level</option>
                {getOptions("cleanliness_level").map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="sort-filter">Sort by compatibility</label>
              <select
                id="sort-filter"
                value={filters.sort}
                onChange={(event) =>
                  updateFilter("sort", event.target.value)
                }
              >
                <option value="high">Highest match first</option>
                <option value="low">Lowest match first</option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="budget-min">Minimum monthly budget (₹)</label>
              <input
                id="budget-min"
                type="number"
                min="0"
                placeholder="e.g. 3000"
                value={filters.budgetMin}
                onChange={(event) =>
                  updateFilter("budgetMin", event.target.value)
                }
              />
            </div>

            <div className="filter-field">
              <label htmlFor="budget-max">Maximum monthly budget (₹)</label>
              <input
                id="budget-max"
                type="number"
                min="0"
                placeholder="e.g. 10000"
                value={filters.budgetMax}
                onChange={(event) =>
                  updateFilter("budgetMax", event.target.value)
                }
              />
            </div>
          </div>
        </section>

        <section className="matches-section">
          <div className="matches-heading">
            <div>
              <p className="discover-eyebrow">YOUR COMPATIBILITY</p>
              <h2>
                {loading
                  ? "Finding matches..."
                  : `${filteredMatches.length} Roommate${
                      filteredMatches.length === 1 ? "" : "s"
                    } Found`}
              </h2>

              {!loading && matches.length !== filteredMatches.length && (
                <p className="filter-result-count">
                  Showing {filteredMatches.length} of {totalMatches} matches
                </p>
              )}
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

          {!loading &&
            !error &&
            matches.length > 0 &&
            filteredMatches.length === 0 && (
              <div className="discover-empty">
                <div className="empty-icon">⌕</div>
                <h3>No roommates match these filters.</h3>
                <p>
                  Try adjusting your preferences to discover more potential
                  roommates.
                </p>
                <button
                  className="discover-action"
                  onClick={clearFilters}
                >
                  Clear all filters
                </button>
              </div>
            )}

          {!loading && !error && filteredMatches.length > 0 && (
            <div className="roommate-grid">
              {filteredMatches.map((match) => (
                <article className="roommate-card" key={match.user_id}>
                  <div className="roommate-card-top">
                    <div className="roommate-avatar">
                      {match.profile_photo_url ? (
                        <img
                          src={match.profile_photo_url}
                          alt={`${match.full_name}'s profile`}
                        />
                      ) : (
                        <span>
                          {(match.full_name || "Roommate")
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0].toUpperCase())
                            .join("")}
                        </span>
                      )}
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

                  <div className="quick-connect-section">
                    {renderConnectionButton(match.user_id)}

                    {connectionMessages[match.user_id] && (
                      <p className="quick-connect-message">
                        {connectionMessages[match.user_id]}
                      </p>
                    )}
                  </div>

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