import React, { useState } from "react";
import mainAdminAvatar from "../assets/admindb.png";
import assistantAdminAvatar from "../assets/admindb.png";
import loginGif from "../assets/aclcanimated2.gif";

function LoginPage({ onLogin, loading, error }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setIdentifier("");
    setPassword("");
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ identifier, password });
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRole("");
    setIdentifier("");
    setPassword("");
  };

  return (
    <div className={`login-page${showModal ? " login-open" : ""}`}>
      <div className="login-layout">
        <div className="login-card">
          <div className="login-card-intro">
            <span className="login-eyebrow">Secure access</span>
            <h1>ACLC Fee Management System</h1>
            <p className="login-subtitle">
              Choose an administrator account to continue managing student records, balances, and payment activity.
            </p>
            <div className="login-highlights">
              <span>Fast balance lookup</span>
              <span>Cleaner payment workflow</span>
              <span>Centralized student data</span>
            </div>
          </div>
          <div className="login-profiles">
            <button
              type="button"
              className="login-profile-card"
              onClick={() => handleSelectRole("main")}
            >
              <img src={mainAdminAvatar} alt="Main Admin" className="login-profile-avatar" />
              <span className="login-profile-role">Main Admin</span>
              <span className="login-profile-name">Jhea Pelonio</span>
            </button>

            <button
              type="button"
              className="login-profile-card"
              onClick={() => handleSelectRole("assistant")}
            >
              <img src={assistantAdminAvatar} alt="Assistant Admin" className="login-profile-avatar" />
              <span className="login-profile-role">Assistant Admin</span>
              <span className="login-profile-name">Beben Magbanua</span>
            </button>
          </div>
          {error && <div className="login-error">{error}</div>}
        </div>

        <div className="login-side">
          <div className="login-visual">
            <div className="login-visual-inner">
              <div className="login-visual-brand">
                <img src={loginGif} alt="ACLC Animation" />
                <p className="login-visual-text">ACLC COLLEGE OF MANILA</p>
                <p className="login-visual-address">
                  2355 Legarda corner Manrique St., Sampaloc Manila.
                </p>
              </div>
              <div className="login-visual-stats">
                <div className="login-visual-stat">
                  <strong>1</strong>
                  <span>System for records and collections</span>
                </div>
                <div className="login-visual-stat">
                  <strong>2</strong>
                  <span>Admin roles with guided access</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`login-inline-shell${showModal ? " is-open" : ""}`}>
            <div className="login-inline">
              <div className="login-inline-header">
                <div>
                  <p className="login-modal-eyebrow">Sign in as</p>
                  <h2 className="login-modal-title">
                    {selectedRole === "assistant" ? "Assistant Admin" : "Main Admin"}
                  </h2>
                </div>
                <button type="button" className="login-inline-close" onClick={closeModal}>
                  Close
                </button>
              </div>

              <form className="login-modal-form" onSubmit={handleSubmit}>
                <label className="login-label">
                  Username
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter username"
                    className="login-input"
                    required
                  />
                </label>
                <label className="login-label">
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="login-input"
                    required
                  />
                </label>
                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? "Signing in..." : "Login"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
