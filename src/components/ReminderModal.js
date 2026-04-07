import React, { useEffect, useMemo, useState } from "react";
import { normalizeStudentFinancials } from "../utils/fees";
import { buildReminderDraft } from "../utils/reminders";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function ReminderModal({ show, student, onClose, onConfirm, sending = false }) {
  const normalizedStudent = useMemo(
    () => (student ? normalizeStudentFinancials(student) : null),
    [student]
  );
  const reminderDraft = useMemo(
    () => (normalizedStudent ? buildReminderDraft(normalizedStudent) : null),
    [normalizedStudent]
  );
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!show || !normalizedStudent || !reminderDraft) {
      return;
    }

    setSubject(reminderDraft.subject);
    setMessage(reminderDraft.message);
  }, [show, normalizedStudent, reminderDraft]);

  if (!show || !normalizedStudent || !reminderDraft) {
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
      due_type: reminderDraft.dueType,
      due_label: reminderDraft.dueLabel,
      due_amount: reminderDraft.dueAmount,
      html: reminderDraft.html,
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
            <span>{reminderDraft.dueLabel || "Balance Due"}</span>
            <strong>{currencyFormatter.format(reminderDraft.dueAmount)}</strong>
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
