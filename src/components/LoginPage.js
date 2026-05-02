import React, { useState } from "react";
import loginGif from "../assets/aclcanimated2.gif";
import admissionImage from "../assets/admission.jpg";

function LoginPage({ onLogin, loading, error }) {
  const [showForm, setShowForm] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin({ identifier, password });
  };

  const handleOpenForm = () => {
    setShowForm(true);
    setIdentifier("");
    setPassword("");
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setIdentifier("");
    setPassword("");
  };

  return (
    <div className={`login-page${showForm ? " login-open" : ""}`}>
      <div className="login-shell">
        <div className="login-shell-background" aria-hidden="true">
          <img src={admissionImage} alt="" className="login-admission-image" />
        </div>

        <div className="login-content">
          <div className="login-brand-block">
            <img src={loginGif} alt="ACLC Animation" className="login-brand-gif" />
            <p className="login-visual-text">ACLC COLLEGE OF MANILA</p>
            <p className="login-visual-address">
              2355 Legarda corner Manrique St., Sampaloc Manila.
            </p>
          </div>

          <div className="login-panel">
            {!showForm ? (
              <button type="button" className="login-button login-button-launch" onClick={handleOpenForm}>
                Login
              </button>
            ) : null}

            <div className={`login-inline-shell${showForm ? " is-open" : ""}`}>
              <div className="login-inline">
                <div className="login-inline-header">
                  <div>
                    <p className="login-modal-eyebrow">Sign in</p>
                  </div>
                  <button type="button" className="login-inline-close" onClick={handleCloseForm}>
                    Close
                  </button>
                </div>

                <form className="login-modal-form" onSubmit={handleSubmit}>
                  {error ? <div className="login-form-error">{error}</div> : null}
                  <label className="login-label">
                    Username
                    <input
                      type="text"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
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
                      onChange={(event) => setPassword(event.target.value)}
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
    </div>
  );
}

export default LoginPage;
