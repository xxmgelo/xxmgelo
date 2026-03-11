import React from "react";
import addIcon from "../assets/add.png";
import administratorIcon from "../assets/administrator.png";

function AdministratorPage({ admins, onAddAdmin, loading, error }) {
  return (
    <main className="student-dashboard">
      <div className="section-header">
        <h2>Administrator</h2>
        <div className="section-actions">
          <button className="action-btn add-btn" onClick={onAddAdmin}>
            <img src={addIcon} alt="Add" className="btn-icon" />
            Add Administrator
          </button>
        </div>
      </div>

      {error && <p className="section-error">{error}</p>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Avatar</th>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">Loading administrators...</td>
              </tr>
            ) : admins.length > 0 ? (
              admins.map((admin, index) => (
                <tr key={admin.id || index}>
                  <td>{index + 1}</td>
                  <td>
                    <img
                      src={admin.avatar || administratorIcon}
                      alt={admin.full_name || admin.username}
                      className="admin-table-avatar"
                    />
                  </td>
                  <td>{admin.full_name || "N/A"}</td>
                  <td>{admin.username || "N/A"}</td>
                  <td>{admin.role || "admin"}</td>
                  <td>{admin.created_at || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No administrators yet. Add one to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default AdministratorPage;
