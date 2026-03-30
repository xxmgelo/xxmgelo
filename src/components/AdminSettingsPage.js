import React, { useEffect, useState } from "react";
import uploadIcon from "../assets/upload.png";

function AdminSettingsPage({
  admin,
  darkMode,
  onToggleTheme,
  themeColors,
  defaultTheme,
  onSavePreferences,
  onUpdateProfile,
  onUpdatePassword,
}) {
  const [activeSection, setActiveSection] = useState("general");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarPayload, setAvatarPayload] = useState("");
  const [profileStatus, setProfileStatus] = useState({ loading: false, error: "", success: "" });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [accentColor, setAccentColor] = useState("#007877");
  const [preferenceStatus, setPreferenceStatus] = useState({ loading: false, error: "", success: "" });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: "", success: "" });
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  useEffect(() => {
    setFullName(admin?.fullName || admin?.name || "");
    setUsername(admin?.username || "");
    setAvatarPreview(admin?.avatarUrl || "");
    setAvatarPayload("");
    setIsEditingProfile(false);
    setIsEditingPassword(false);
  }, [admin]);

  useEffect(() => {
    if (themeColors?.start) {
      setAccentColor(themeColors.start);
    }
  }, [themeColors]);

  const handleAvatarChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setAvatarPreview(result);
      setAvatarPayload(result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!isEditingProfile) {
      return;
    }
    setProfileStatus({ loading: true, error: "", success: "" });

    try {
      await onUpdateProfile({
        full_name: fullName.trim(),
        username: username.trim(),
        avatar: avatarPayload,
      });
      setAvatarPayload("");
      setIsEditingProfile(false);
      setProfileStatus({ loading: false, error: "", success: "Profile updated successfully." });
    } catch (error) {
      const message = error && error.message ? error.message : "Update failed. Please try again.";
      setProfileStatus({ loading: false, error: message, success: "" });
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!isEditingPassword) {
      return;
    }
    setPasswordStatus({ loading: true, error: "", success: "" });

    if (!currentPassword || !newPassword) {
      setPasswordStatus({ loading: false, error: "Please fill in all password fields.", success: "" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ loading: false, error: "New passwords do not match.", success: "" });
      return;
    }

    try {
      await onUpdatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsEditingPassword(false);
      setPasswordStatus({ loading: false, error: "", success: "Password updated successfully." });
    } catch (error) {
      const message = error && error.message ? error.message : "Password update failed.";
      setPasswordStatus({ loading: false, error: message, success: "" });
    }
  };

  const handlePreferencesSave = async () => {
    setPreferenceStatus({ loading: true, error: "", success: "" });
    try {
      await onSavePreferences({ start: accentColor, end: accentColor, notificationsEnabled });
      setPreferenceStatus({ loading: false, error: "", success: "Preferences updated." });
    } catch (error) {
      const message = error && error.message ? error.message : "Unable to save preferences.";
      setPreferenceStatus({ loading: false, error: message, success: "" });
    }
  };

  const handleResetDefaults = async () => {
    const fallbackColor = defaultTheme?.start || "#007877";

    setAccentColor(fallbackColor);
    setPreferenceStatus({ loading: true, error: "", success: "" });

    try {
      await onSavePreferences({
        start: fallbackColor,
        end: fallbackColor,
        notificationsEnabled,
      });
      setPreferenceStatus({ loading: false, error: "", success: "Default accent restored." });
    } catch (error) {
      const message = error && error.message ? error.message : "Unable to restore defaults.";
      setPreferenceStatus({ loading: false, error: message, success: "" });
    }
  };

  return (
    <section className="admin-settings">
      <div className="admin-settings-header">
        <h2>Admin Settings</h2>
        <p>Manage your account details, avatar, and credentials.</p>
      </div>

      <div className="admin-settings-panel">
        <aside className="admin-settings-nav">
          <button
            type="button"
            className={`admin-settings-tab ${activeSection === "general" ? "active" : ""}`}
            onClick={() => setActiveSection("general")}
          >
            General
          </button>
          <button
            type="button"
            className={`admin-settings-tab ${activeSection === "security" ? "active" : ""}`}
            onClick={() => setActiveSection("security")}
          >
            Login & Security
          </button>
          <button
            type="button"
            className={`admin-settings-tab ${activeSection === "preferences" ? "active" : ""}`}
            onClick={() => setActiveSection("preferences")}
          >
            Preferences
          </button>
        </aside>

        <div className="admin-settings-content">
          {activeSection === "general" && (
            <div className="admin-settings-section">
              <div className="admin-settings-section-header">
                <h3>Account Profile</h3>
                <button
                  type="button"
                  className="admin-settings-edit"
                  onClick={() => setIsEditingProfile((prev) => !prev)}
                >
                  {isEditingProfile ? "Cancel" : "Edit"}
                </button>
              </div>

              <div className="admin-settings-avatar">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Admin avatar" className="admin-settings-avatar-img" />
                ) : (
                  <div className="admin-settings-avatar-placeholder">No Image</div>
                )}
                <label className="admin-settings-upload-button">
                  <img src={uploadIcon} alt="Upload" className="admin-upload-icon" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={!isEditingProfile}
                  />
                </label>
              </div>

              <form className="admin-settings-form" onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Enter full name"
                    required
                    disabled={!isEditingProfile}
                  />
                </div>

                <div className="form-group">
                  <label>Current Username</label>
                  <input
                    type="text"
                    value={admin?.username || ""}
                    placeholder="Current username"
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>New Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter new username"
                    required
                    disabled={!isEditingProfile}
                  />
                </div>


                {profileStatus.error && <div className="admin-settings-error">{profileStatus.error}</div>}
                {profileStatus.success && <div className="admin-settings-success">{profileStatus.success}</div>}

                <button
                  type="submit"
                  className="save-btn"
                  disabled={!isEditingProfile || profileStatus.loading}
                >
                  {profileStatus.loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {activeSection === "security" && (
            <div className="admin-settings-section">
              <div className="admin-settings-section-header">
                <h3>Change Password</h3>
                <button
                  type="button"
                  className="admin-settings-edit"
                  onClick={() => setIsEditingPassword((prev) => !prev)}
                >
                  {isEditingPassword ? "Cancel" : "Edit"}
                </button>
              </div>
              <form className="admin-settings-form" onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Enter current password"
                    required
                    disabled={!isEditingPassword}
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter new password"
                    required
                    disabled={!isEditingPassword}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={!isEditingPassword}
                  />
                </div>

                {passwordStatus.error && <div className="admin-settings-error">{passwordStatus.error}</div>}
                {passwordStatus.success && <div className="admin-settings-success">{passwordStatus.success}</div>}

                <button
                  type="submit"
                  className="save-btn"
                  disabled={!isEditingPassword || passwordStatus.loading}
                >
                  {passwordStatus.loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {activeSection === "preferences" && (
            <div className="admin-settings-section">
              <div className="admin-settings-section-header">
                <h3>Account Preferences</h3>
              </div>

              <div className="admin-settings-row">
                <div>
                  <p className="admin-settings-row-title">Theme</p>
                  <p className="admin-settings-row-subtitle">Choose your dashboard appearance.</p>
                </div>
                <div className="admin-settings-theme-toggle">
                  <button
                    type="button"
                    className={`admin-settings-theme-btn ${darkMode ? "" : "active"}`}
                    onClick={() => {
                      if (darkMode) onToggleTheme();
                    }}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    className={`admin-settings-theme-btn ${darkMode ? "active" : ""}`}
                    onClick={() => {
                      if (!darkMode) onToggleTheme();
                    }}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div className="admin-settings-row">
                <div>
                  <p className="admin-settings-row-title">Accent Color</p>
                  <p className="admin-settings-row-subtitle">
                    Apply one clean brand color to buttons, highlights, and panels.
                  </p>
                </div>
                <div className="admin-settings-gradient-picker">
                  <label className="admin-settings-color">
                    <span>Accent</span>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(event) => setAccentColor(event.target.value)}
                    />
                  </label>
                  <div
                    className="admin-settings-gradient-preview"
                    style={{ background: accentColor }}
                  />
                </div>
              </div>

              <div className="admin-settings-row">
                <div>
                  <p className="admin-settings-row-title">Notifications</p>
                  <p className="admin-settings-row-subtitle">
                    Receive system alerts and updates.
                  </p>
                </div>
                <label className="admin-settings-switch">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={() => setNotificationsEnabled((prev) => !prev)}
                  />
                  <span className="admin-settings-slider" />
                </label>
              </div>

              {(preferenceStatus.error || preferenceStatus.success) && (
                <div>
                  {preferenceStatus.error && (
                    <div className="admin-settings-error">{preferenceStatus.error}</div>
                  )}
                  {preferenceStatus.success && (
                    <div className="admin-settings-success">{preferenceStatus.success}</div>
                  )}
                </div>
              )}

              <div className="admin-settings-preferences-actions">
                <button
                  type="button"
                  className="admin-settings-default-btn"
                  onClick={handleResetDefaults}
                  disabled={preferenceStatus.loading}
                >
                  Set as Default
                </button>
                <button
                  type="button"
                  className="save-btn"
                  onClick={handlePreferencesSave}
                  disabled={preferenceStatus.loading}
                >
                  {preferenceStatus.loading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminSettingsPage;
