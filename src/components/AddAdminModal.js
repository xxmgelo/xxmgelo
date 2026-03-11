import React from "react";
import uploadIcon from "../assets/upload.png";

function AddAdminModal({ show, newAdmin, onClose, onSubmit, onInputChange, onAvatarChange }) {
  if (!show) return null;

  const avatarPreview = newAdmin.avatar;

  return (
    <div className="modal">
      <div className="modal-content add-admin-modal">
        <h2>Create Administrator</h2>
        <form onSubmit={onSubmit}>
          <div className="admin-avatar-upload">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Admin avatar" className="admin-avatar-preview" />
            ) : (
              <div className="admin-avatar-placeholder">No Image</div>
            )}
            <label className="admin-avatar-upload-button">
              <img src={uploadIcon} alt="Upload" className="admin-upload-icon" />
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
              />
            </label>
          </div>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="full_name"
              value={newAdmin.full_name}
              onChange={onInputChange}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={newAdmin.username}
              onChange={onInputChange}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={newAdmin.password}
              onChange={onInputChange}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="modal-buttons">
            <button type="button" className="close-btn" onClick={onClose}>Close</button>
            <button type="submit" className="save-btn">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddAdminModal;
