import React from "react";

function ConfirmModal({ show, message, confirmLabel = "Remove", cancelLabel = "Cancel", onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Confirm Action</h2>
        <p>{message}</p>
        <div className="modal-buttons">
          <button className="close-btn" onClick={onConfirm}>{confirmLabel}</button>
          <button className="save-btn" onClick={onCancel}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
