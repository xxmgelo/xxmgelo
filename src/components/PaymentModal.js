import React, { useEffect, useMemo, useState } from "react";
import {
  PAYMENT_MODES,
  getCollectedAmount,
  normalizeStudentFinancials,
  parseAmount,
  previewPaymentApplication,
} from "../utils/fees";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function PaymentModal({ showPaymentModal, selectedStudent, onClose, onSavePayment }) {
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODES.INSTALLMENT);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [officialReceipt, setOfficialReceipt] = useState("");

  useEffect(() => {
    if (!showPaymentModal || !selectedStudent) {
      return;
    }

    const normalized = normalizeStudentFinancials(selectedStudent);
    setPaymentMode(normalized.PaymentMode);
    setPaymentAmount("");
    setOfficialReceipt("");
  }, [showPaymentModal, selectedStudent]);

  const currentStudent = useMemo(() => {
    if (!selectedStudent) {
      return null;
    }

    return normalizeStudentFinancials({
      ...selectedStudent,
      PaymentMode: paymentMode,
    });
  }, [paymentMode, selectedStudent]);

  const preview = useMemo(() => {
    if (!currentStudent) {
      return null;
    }

    return previewPaymentApplication(currentStudent, paymentAmount);
  }, [currentStudent, paymentAmount]);

  if (!showPaymentModal || !selectedStudent || !currentStudent || !preview) return null;

  const enteredPayment = parseAmount(paymentAmount);
  const currentCollected = getCollectedAmount(currentStudent);
  const nextCollected = getCollectedAmount(preview.nextStudent);
  const isOverpayment = enteredPayment > currentStudent.TotalBalance;
  const overpaymentMessage = isOverpayment
    ? `Payment amount exceeds the remaining balance of ${currencyFormatter.format(currentStudent.TotalBalance)}. Reduce the amount before saving.`
    : "";
  const cannotSave = preview.appliedAmount <= 0 || isOverpayment;

  const handleSave = () => {
    if (cannotSave) {
      return;
    }

    onSavePayment({
      student: {
        ...preview.nextStudent,
        PaymentMode: paymentMode,
      },
      payment: {
        mode: paymentMode,
        amount_requested: enteredPayment,
        amount_applied: preview.appliedAmount,
        outstanding_before: preview.outstandingBefore,
        outstanding_after: preview.outstandingAfter,
        official_receipt: officialReceipt.trim(),
      },
    });
  };

  return (
    <div className="modal">
      <div className="modal-content payment-modal">
        <div className="modal-title-row">
          <div>
            <h2>Process Payment</h2>
            <p>Apply a payment and review the updated tuition balances before saving.</p>
          </div>
          <span className="payment-mode-pill">{paymentMode === PAYMENT_MODES.FULL ? "Full" : "Installment"}</span>
        </div>

        <div className="payment-student-summary">
          <div>
            <span>Student ID</span>
            <strong>{currentStudent.StudentID}</strong>
          </div>
          <div>
            <span>Name</span>
            <strong>{currentStudent.Name}</strong>
          </div>
          <div>
            <span>Program</span>
            <strong>{currentStudent.Program || "N/A"}</strong>
          </div>
        </div>

        <div className="payment-metric-grid">
          <article className="payment-metric-card">
            <span>Total Fee</span>
            <strong>{currencyFormatter.format(currentStudent.TotalFee)}</strong>
          </article>
          <article className="payment-metric-card">
            <span>Collected</span>
            <strong>{currencyFormatter.format(currentCollected)}</strong>
          </article>
          <article className="payment-metric-card">
            <span>Remaining</span>
            <strong>{currencyFormatter.format(currentStudent.TotalBalance)}</strong>
          </article>
        </div>

        <div className="payment-form-grid">
          <div className="form-group">
            <label>Payment Mode</label>
            <select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)}>
              <option value={PAYMENT_MODES.INSTALLMENT}>Installment</option>
              <option value={PAYMENT_MODES.FULL}>Full</option>
            </select>
          </div>
          <div className="form-group">
            <label>Payment Amount</label>
            <input
              type="text"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              placeholder="Enter payment amount"
              inputMode="decimal"
            />
          </div>
          <div className="form-group">
            <label>OR #</label>
            <input
              type="text"
              value={officialReceipt}
              onChange={(event) => setOfficialReceipt(event.target.value)}
              placeholder="Optional receipt reference"
            />
          </div>
        </div>

        <div className="payment-preview-card">
          <div className="payment-preview-header">
            <div>
              <span className="section-kicker">Live Preview</span>
              <h3>Distribution after this payment</h3>
            </div>
            <div className="payment-preview-totals">
              <span>Applied: {currencyFormatter.format(preview.appliedAmount)}</span>
              <span>New balance: {currencyFormatter.format(preview.outstandingAfter)}</span>
            </div>
          </div>

          {overpaymentMessage && <p className="payment-warning">{overpaymentMessage}</p>}

          <div className="payment-breakdown-list">
            {preview.breakdown.map((item) => (
              <div key={item.field} className="payment-breakdown-row">
                <span>{item.label}</span>
                <span>{currencyFormatter.format(item.before)}</span>
                <span>{currencyFormatter.format(item.applied)}</span>
                <span>{currencyFormatter.format(item.after)}</span>
              </div>
            ))}
          </div>

          <div className="payment-result-strip">
            <span>Collected after save: {currencyFormatter.format(nextCollected)}</span>
            <span>Total balance after save: {currencyFormatter.format(preview.nextStudent.TotalBalance)}</span>
          </div>
        </div>

        <div className="modal-buttons">
          <button className="save-btn" type="button" onClick={handleSave} disabled={cannotSave}>
            Save Payment
          </button>
          <button className="close-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
