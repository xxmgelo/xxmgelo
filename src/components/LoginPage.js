import React, { useState } from "react";
import mainAdminAvatar from "../assets/admindb.png";
import assistantAdminAvatar from "../assets/admindb.png";
import loginBg from "../assets/aclcbg.png";
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
    <div className="login-page" style={{ backgroundImage: `url(${loginBg})` }}>
      <div className="login-layout">
        <div className="login-card">
          <div className="login-profiles">
          <button
            type="button"
            className="login-profile-card"
            onClick={() => handleSelectRole("main")}
          >
            <span className="login-profile-name">Jhea Pelonio</span>
            <img src={mainAdminAvatar} alt="Main Admin" className="login-profile-avatar" />
            <span className="login-profile-role">Main Admin</span>
          </button>

          <button
            type="button"
            className="login-profile-card"
            onClick={() => handleSelectRole("assistant")}
          >
            <span className="login-profile-name">Beben Magbanua</span>
            <img src={assistantAdminAvatar} alt="Assistant Admin" className="login-profile-avatar" />
            <span className="login-profile-role">Assistant Admin</span>
          </button>
          </div>
          {error && <div className="login-error">{error}</div>}
        </div>

        <div className="login-visual">
          <img src={loginGif} alt="ACLC Animation" />
        </div>
      </div>

      {showModal && (
        <div className="login-modal">
          <div className="login-modal-card">
            <div className="login-modal-header">
              <div>
                <p className="login-modal-eyebrow">Sign in as</p>
                <h2 className="login-modal-title">
                  {selectedRole === "assistant" ? "Assistant Admin" : "Main Admin"}
                </h2>
              </div>
              <button type="button" className="login-modal-close" onClick={closeModal}>
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
      )}
    </div>
  );
}

export default LoginPage;
