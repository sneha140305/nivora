import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  UserRound,
  Wallet,
  Clock,
  Heart,
  LoaderCircle,
  CheckCircle,
  Camera,
  Trash2,
  Pencil,
  X,
  Mail,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../services/api";
import "./Profile.css";

const initialForm = {
  city: "",
  occupation: "",
  bio: "",
  budget_min: "",
  budget_max: "",
  sleep_time: "",
  wake_time: "",
  work_schedule: "",
  cleanliness_level: "",
  noise_tolerance: "",
  food_preference: "",
  social_level: "",
  guest_frequency: "",
  pets_allowed: "",
};

function Profile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const photoInputRef = useRef(null);

  const [photoUploading, setPhotoUploading] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [accountForm, setAccountForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  });

  const [editingAccount, setEditingAccount] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);

  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch lifestyle profile.
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiRequest("/api/profile/");

        setForm({
          city: data.city || "",
          occupation: data.occupation || "",
          bio: data.bio || "",
          budget_min: data.budget_min ?? "",
          budget_max: data.budget_max ?? "",
          sleep_time: data.sleep_time || "",
          wake_time: data.wake_time || "",
          work_schedule: data.work_schedule || "",
          cleanliness_level: data.cleanliness_level || "",
          noise_tolerance: data.noise_tolerance || "",
          food_preference: data.food_preference || "",
          social_level: data.social_level || "",
          guest_frequency: data.guest_frequency || "",
          pets_allowed:
            data.pets_allowed === null || data.pets_allowed === undefined
              ? ""
              : String(data.pets_allowed),
        });

        setHasProfile(true);
      } catch (err) {
        if (err.message.toLowerCase().includes("not found")) {
          setHasProfile(false);
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Lifestyle form handler.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // Account form handler.
  const handleAccountChange = (event) => {
    const { name, value } = event.target;

    setAccountForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // Save account details.
  const handleAccountSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const fullName = accountForm.full_name.trim();
    const email = accountForm.email.trim();

    if (fullName.length < 2 || fullName.length > 100) {
      setError("Name must contain between 2 and 100 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setAccountSaving(true);

    try {
      const updatedUser = await apiRequest("/api/auth/me", {
        method: "PUT",
        body: JSON.stringify({
          full_name: fullName,
          email: email.toLowerCase(),
        }),
      });

      setUser(updatedUser);

      setAccountForm({
        full_name: updatedUser.full_name,
        email: updatedUser.email,
      });

      setEditingAccount(false);
      setSuccess("Account information updated successfully!");
    } catch (err) {
      setError(err.message || "Unable to update account information.");
    } finally {
      setAccountSaving(false);
    }
  };

  // Cancel account editing.
  const handleCancelAccountEdit = () => {
    setAccountForm({
      full_name: user?.full_name || "",
      email: user?.email || "",
    });

    setEditingAccount(false);
    setError("");
    setSuccess("");
  };

  // Upload profile photo.
  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setPhotoUploading(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiRequest("/api/profile/photo", {
        method: "POST",
        body: formData,
      });

      setUser((previous) => ({
        ...previous,
        profile_photo_url: response.profile_photo_url,
      }));

      setSuccess("Profile photo updated successfully!");
    } catch (err) {
      setError(err.message || "Unable to upload profile photo.");
    } finally {
      setPhotoUploading(false);
      event.target.value = "";
    }
  };

  // Remove profile photo.
  const handleRemovePhoto = async () => {
    setPhotoUploading(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("/api/profile/photo", {
        method: "DELETE",
      });

      setUser((previous) => ({
        ...previous,
        profile_photo_url: null,
      }));

      setSuccess("Profile photo removed successfully!");
    } catch (err) {
      setError(err.message || "Unable to remove profile photo.");
    } finally {
      setPhotoUploading(false);
    }
  };

  // Save lifestyle profile.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      form.budget_min !== "" &&
      form.budget_max !== "" &&
      Number(form.budget_min) > Number(form.budget_max)
    ) {
      setError("Minimum budget cannot exceed maximum budget.");
      return;
    }

    const payload = {
      ...form,
      budget_min: form.budget_min === "" ? null : Number(form.budget_min),
      budget_max: form.budget_max === "" ? null : Number(form.budget_max),
      pets_allowed:
        form.pets_allowed === "" ? null : form.pets_allowed === "true",
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") {
        payload[key] = null;
      }
    });

    setSaving(true);

    try {
      const endpoint = "/api/profile/";
      const method = hasProfile ? "PUT" : "POST";

      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      setHasProfile(true);
      setSuccess("Your lifestyle profile has been saved successfully!");
    } catch (err) {
      setError(err.message || "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  // Reusable dropdown renderer.
  const renderSelect = (
    name,
    label,
    options,
    placeholder = "Select an option"
  ) => (
    <div className="profile-field">
      <label htmlFor={name}>{label}</label>
      <select
        id={name}
        name={name}
        value={form[name]}
        onChange={handleChange}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  if (loading) {
    return (
      <div className="profile-loading">
        <LoaderCircle className="profile-spinner" size={25} />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-topbar">
        <a href="/" className="profile-brand">
          nivora<span>.</span>
        </a>

        <button
          className="profile-back-button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </button>
      </header>

      <main className="profile-container">
        <div className="profile-heading">
          <span>GET TO KNOW YOU</span>
          <h1>{hasProfile ? "Your lifestyle profile" : "Create your profile"}</h1>
          <p>
            Tell us about your lifestyle, habits and preferences.
            We'll use them to find roommates who match your rhythm.
          </p>
        </div>

        {error && <div className="profile-alert error">{error}</div>}

        {success && (
          <div className="profile-alert success">
            <CheckCircle size={19} />
            {success}
          </div>
        )}

        {/* Account Information */}
        <section className="profile-form-section account-info-section">
          <div className="profile-section-title">
            <UserRound size={21} />
            <div>
              <h2>Account information</h2>
              <p>Manage your name and email address.</p>
            </div>
          </div>

          <form onSubmit={handleAccountSubmit}>
            {editingAccount ? (
              <>
                <div className="profile-form-grid">
                  <div className="profile-field">
                    <label htmlFor="account_full_name">Full name</label>
                    <input
                      id="account_full_name"
                      name="full_name"
                      type="text"
                      value={accountForm.full_name}
                      onChange={handleAccountChange}
                      placeholder="Enter your full name"
                      minLength={2}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="account_email">Email address</label>
                    <input
                      id="account_email"
                      name="email"
                      type="email"
                      value={accountForm.email}
                      onChange={handleAccountChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="profile-account-actions">
                  <button
                    type="submit"
                    className="profile-save-button"
                    disabled={accountSaving}
                  >
                    {accountSaving ? (
                      <>
                        <LoaderCircle
                          className="profile-spinner"
                          size={18}
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save changes
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="profile-account-cancel"
                    onClick={handleCancelAccountEdit}
                    disabled={accountSaving}
                  >
                    <X size={17} />
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="profile-form-grid">
                  <div className="profile-field">
                    <label>Full name</label>
                    <button
                      type="button"
                      className="profile-account-value profile-account-clickable"
                      onClick={() => setEditingAccount(true)}
                    >
                      <UserRound size={17} />
                      <span>{user?.full_name || "Not available"}</span>
                      <Pencil size={15} />
                    </button>
                  </div>

                  <div className="profile-field">
                    <label>Email address</label>
                    <button
                      type="button"
                      className="profile-account-value profile-account-clickable"
                      onClick={() => setEditingAccount(true)}
                    >
                      <Mail size={17} />
                      <span>{user?.email || "Not available"}</span>
                      <Pencil size={15} />
                    </button>
                  </div>
                </div>

                <div className="profile-account-actions">
                  <button
                    type="button"
                    className="profile-photo-upload"
                    onClick={() => setEditingAccount(true)}
                  >
                    <Pencil size={16} />
                    Edit account details
                  </button>
                </div>
              </>
            )}
          </form>
        </section>

        {/* Lifestyle Profile Form */}
        <form className="profile-form" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <section className="profile-form-section">
            <div className="profile-section-title">
              <UserRound size={21} />
              <div>
                <h2>Basic information</h2>
                <p>A little introduction about yourself.</p>
              </div>
            </div>

            {/* Profile Photo */}
            <div className="profile-photo-section">
              <div className="profile-photo-preview">
                {user?.profile_photo_url ? (
                  <img
                    src={user.profile_photo_url}
                    alt="Your profile"
                  />
                ) : (
                  <span>
                    {(user?.full_name || "User")
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0].toUpperCase())
                      .join("")}
                  </span>
                )}
              </div>

              <div className="profile-photo-info">
                <h3>Profile photo</h3>
                <p>Help your potential roommates recognize you.</p>
                <small>JPG, PNG or WEBP - Maximum 5 MB</small>

                <div className="profile-photo-actions">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    hidden
                  />

                  <button
                    type="button"
                    className="profile-photo-upload"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photoUploading}
                  >
                    {photoUploading ? (
                      <LoaderCircle
                        size={16}
                        className="profile-spinner"
                      />
                    ) : (
                      <Camera size={16} />
                    )}
                    {photoUploading ? "Uploading..." : "Upload photo"}
                  </button>

                  {user?.profile_photo_url && (
                    <button
                      type="button"
                      className="profile-photo-remove"
                      onClick={handleRemovePhoto}
                      disabled={photoUploading}
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-form-grid">
              <div className="profile-field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Indore"
                  maxLength={100}
                />
              </div>

              {renderSelect("occupation", "Occupation", [
                { value: "student", label: "Student" },
                {
                  value: "working_professional",
                  label: "Working professional",
                },
                { value: "freelancer", label: "Freelancer" },
                { value: "other", label: "Other" },
              ])}

              <div className="profile-field full-width">
                <label htmlFor="bio">About me</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Share a little about yourself and what makes you a good roommate..."
                  maxLength={500}
                  rows={4}
                />
                <small>{form.bio.length}/500 characters</small>
              </div>
            </div>
          </section>

          {/* Monthly Budget */}
          <section className="profile-form-section">
            <div className="profile-section-title">
              <Wallet size={21} />
              <div>
                <h2>Monthly accommodation budget</h2>
                <p>Set your preferred monthly rent range in INR.</p>
              </div>
            </div>

            <div className="profile-form-grid">
              <div className="profile-field">
                <label htmlFor="budget_min">Minimum budget (₹)</label>
                <input
                  id="budget_min"
                  name="budget_min"
                  type="number"
                  min="0"
                  value={form.budget_min}
                  onChange={handleChange}
                  placeholder="e.g. 5000"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="budget_max">Maximum budget (₹)</label>
                <input
                  id="budget_max"
                  name="budget_max"
                  type="number"
                  min="0"
                  value={form.budget_max}
                  onChange={handleChange}
                  placeholder="e.g. 10000"
                />
              </div>
            </div>
          </section>

          {/* Daily Routine */}
          <section className="profile-form-section">
            <div className="profile-section-title">
              <Clock size={21} />
              <div>
                <h2>Daily routine</h2>
                <p>Help us understand your everyday schedule.</p>
              </div>
            </div>

            <div className="profile-form-grid">
              <div className="profile-field">
                <label htmlFor="sleep_time">Usual sleep time</label>
                <input
                  id="sleep_time"
                  name="sleep_time"
                  type="time"
                  value={form.sleep_time}
                  onChange={handleChange}
                />
              </div>

              <div className="profile-field">
                <label htmlFor="wake_time">Usual wake-up time</label>
                <input
                  id="wake_time"
                  name="wake_time"
                  type="time"
                  value={form.wake_time}
                  onChange={handleChange}
                />
              </div>

              {renderSelect("work_schedule", "Work schedule", [
                { value: "day_shift", label: "Day shift" },
                { value: "night_shift", label: "Night shift" },
                { value: "flexible", label: "Flexible" },
                { value: "remote", label: "Remote" },
                { value: "not_applicable", label: "Not applicable" },
              ])}
            </div>
          </section>

          {/* Lifestyle Preferences */}
          <section className="profile-form-section">
            <div className="profile-section-title">
              <Heart size={21} />
              <div>
                <h2>Lifestyle preferences</h2>
                <p>Find people whose habits feel comfortable with yours.</p>
              </div>
            </div>

            <div className="profile-form-grid">
              {renderSelect("cleanliness_level", "Cleanliness level", [
                { value: "very_clean", label: "Very clean" },
                { value: "moderate", label: "Moderate" },
                { value: "relaxed", label: "Relaxed" },
              ])}

              {renderSelect("noise_tolerance", "Noise tolerance", [
                { value: "low", label: "Low - prefer quiet" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High - comfortable with noise" },
              ])}

              {renderSelect("food_preference", "Food preference", [
                { value: "vegetarian", label: "Vegetarian" },
                { value: "non_vegetarian", label: "Non-vegetarian" },
                { value: "vegan", label: "Vegan" },
                { value: "eggetarian", label: "Eggetarian" },
                { value: "no_preference", label: "No preference" },
              ])}

              {renderSelect("social_level", "Social personality", [
                { value: "introvert", label: "Introvert" },
                { value: "balanced", label: "Balanced" },
                { value: "extrovert", label: "Extrovert" },
              ])}

              {renderSelect(
                "guest_frequency",
                "How often do you host guests?",
                [
                  { value: "rarely", label: "Rarely" },
                  { value: "sometimes", label: "Sometimes" },
                  { value: "frequently", label: "Frequently" },
                ]
              )}

              {renderSelect("pets_allowed", "Are pets allowed?", [
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ])}
            </div>
          </section>

          {/* Save Profile */}
          <div className="profile-submit-area">
            <p>
              You can update your preferences whenever your lifestyle changes.
            </p>

            <button
              type="submit"
              className="profile-save-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle className="profile-spinner" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {hasProfile ? "Update profile" : "Save profile"}
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default Profile;