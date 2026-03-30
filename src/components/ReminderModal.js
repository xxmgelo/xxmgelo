import React, { useEffect, useMemo, useState } from "react";
import { normalizeStudentFinancials, PAYMENT_MODES } from "../utils/fees";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function buildDefaultMessage(student) {
  const modeLabel = student.PaymentMode === PAYMENT_MODES.FULL ? "full payment" : "installment payment";

  return [
    `Good day ${student.Name},`,
    "",
    "This is a friendly reminder from ACLC College of Manila regarding your tuition fee balance.",
    `Your current remaining balance is ${currencyFormatter.format(student.TotalBalance)} under the ${modeLabel} option.`,
    "Please settle your due payment as soon as possible to avoid delays in your clearance and other school transactions.",
    "",
    "If you already paid recently, please disregard this message and coordinate with the accounting office for verification.",
    "",
    "Thank you.",
    "ACLC Fee Management System",
  ].join("\n");
}

function ReminderModal({ show, student, onClose, onConfirm, sending = false }) {
  const normalizedStudent = useMemo(
    () => (student ? normalizeStudentFinancials(student) : null),
    [student]
  );
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!show || !normalizedStudent) {
      return;
    }

    setSubject(`Payment Reminder for ${normalizedStudent.Name}`);
    setMessage(buildDefaultMessage(normalizedStudent));
  }, [show, normalizedStudent]);

  if (!show || !normalizedStudent) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm({
      StudentID: normalizedStudent.StudentID,
      Name: normalizedStudent.Name,
      Gmail: normalizedStudent.Gmail,
      Program: normalizedStudent.Program,
      YearLevel: normalizedStudent.YearLevel,
      PaymentMode: normalizedStudent.PaymentMode,
      TotalFee: normalizedStudent.TotalFee,
      TotalBalance: normalizedStudent.TotalBalance,
      subject,
      message,
    });
  };

  return (
    <div className="modal">
      <div className="modal-content reminder-modal">
        <div className="modal-title-row">
          <div>
            <h2>Send Payment Reminder</h2>
            <p>Review the student email and confirm the reminder before it is sent to Gmail.</p>
          </div>
        </div>

        <div className="payment-student-summary">
          <div>
            <span>Student ID</span>
            <strong>{normalizedStudent.StudentID}</strong>
          </div>
          <div>
            <span>Student</span>
            <strong>{normalizedStudent.Name}</strong>
          </div>
          <div>
            <span>Gmail</span>
            <strong>{normalizedStudent.Gmail || "No email saved"}</strong>
          </div>
          <div>
            <span>Balance Due</span>
            <strong>{currencyFormatter.format(normalizedStudent.TotalBalance)}</strong>
          </div>
        </div>

        <div className="payment-form-grid">
          <div className="form-group reminder-form-group">
            <label>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Reminder subject"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Message</label>
          <textarea
            className="reminder-textarea"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write your reminder message"
            rows={10}
          />
        </div>

        <div className="modal-buttons">
          <button
            className="save-btn"
            type="button"
            onClick={handleConfirm}
            disabled={sending || !normalizedStudent.Gmail || normalizedStudent.TotalBalance <= 0}
          >
            {sending ? "Sending..." : "Confirm & Send"}
          </button>
          <button className="close-btn" type="button" onClick={onClose} disabled={sending}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReminderModal;
