import React from "react";

function ConfirmModal({
  show,
  title = "Confirm Action",
  message,
  details = [],
  confirmLabel = "Remove",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!show) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{title}</h2>
        <p>{message}</p>
        {Array.isArray(details) && details.length > 0 ? (
          <div className="confirm-detail-list">
            {details.map((detail) => (
              <p key={detail}>{detail}</p>
            ))}
          </div>
        ) : null}
        <div className="modal-buttons">
          <button className="close-btn" onClick={onConfirm}>{confirmLabel}</button>
          <button className="save-btn" onClick={onCancel}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
