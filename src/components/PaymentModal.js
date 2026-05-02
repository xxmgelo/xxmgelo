import React, { useEffect, useMemo, useState } from "react";
import {
  CARRY_OVER_FIELD,
  INSTALLMENT_FIELDS,
  INSTALLMENT_LABELS,
  PAYMENT_MODES,
  getCarryOverTotals,
  getCollectedAmount,
  getCurrentSemesterTuitionAmount,
  getCurrentInstallmentIndex,
  getDisplayDownpaymentAmount,
  getPreviousSemesterBalanceAmount,
  getTotalPayableAmount,
  normalizeStudentFinancials,
  parseAmount,
  previewPaymentApplication,
} from "../utils/fees";
import {
  generateNextOrNumber,
  isValidOrNumber,
  normalizeOrNumber,
} from "../utils/orNumbers";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});
const roundCurrency = (value) => Math.round((Number(value) || 0) * 100) / 100;

const getPaymentCategory = (field) => {
  if (field === CARRY_OVER_FIELD) {
    return "previous_balance";
  }
  if (field === "Downpayment") {
    return "downpayment";
  }
  return "current_semester_payment";
};

function PaymentModal({
  showPaymentModal,
  selectedStudent,
  onClose,
  onSavePayment,
  existingOrNumbers = new Set(),
  activeSchoolYearLabel = "",
  activeSemester = "",
}) {
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODES.INSTALLMENT);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [lineItemOrNumbers, setLineItemOrNumbers] = useState({});
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    if (!showPaymentModal || !selectedStudent) {
      return;
    }

    const normalized = normalizeStudentFinancials(selectedStudent);
    setPaymentMode(normalized.PaymentMode);
    setPaymentAmount("");
    setLineItemOrNumbers({});
    setValidationMessage("");
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

  const payableLineItems = useMemo(
    () =>
      (preview?.breakdown || [])
        .filter((item) => Number(item?.applied) > 0)
        .map((item) => ({
          key: item.field,
          field: item.field,
          label: item.label,
          amount_paid: roundCurrency(item.applied),
          payment_category: item.payment_category || getPaymentCategory(item.field),
          source_semester: item.source_semester || "",
        })),
    [preview]
  );

  useEffect(() => {
    if (!showPaymentModal || payableLineItems.length === 0) {
      return;
    }

    const reserved = new Set(
      Object.values(lineItemOrNumbers)
        .map((value) => normalizeOrNumber(value))
        .filter(Boolean)
    );

    setLineItemOrNumbers((prev) => {
      const next = { ...prev };
      const existing = new Set(existingOrNumbers || []);
      reserved.forEach((value) => existing.add(value));

      payableLineItems.forEach((item) => {
        if (normalizeOrNumber(next[item.key])) {
          return;
        }

        const generated = generateNextOrNumber(existing);
        next[item.key] = generated;
        existing.add(generated);
      });

      return next;
    });
  }, [existingOrNumbers, lineItemOrNumbers, payableLineItems, showPaymentModal]);

  if (!showPaymentModal || !selectedStudent || !currentStudent || !preview) return null;

  const enteredPayment = parseAmount(paymentAmount);
  const currentCollected = getCollectedAmount(currentStudent);
  const nextCollected = getCollectedAmount(preview.nextStudent);
  const isOverpayment = enteredPayment > currentStudent.TotalBalance;
  const overpaymentMessage = isOverpayment
    ? `Payment amount exceeds the remaining balance of ${currencyFormatter.format(currentStudent.TotalBalance)}. Reduce the amount before saving.`
    : "";

  const validateOrNumbers = () => {
    const normalizedValues = payableLineItems.map((item) => ({
      ...item,
      orNumber: normalizeOrNumber(lineItemOrNumbers[item.key]),
    }));

    for (const item of normalizedValues) {
      if (!item.orNumber) {
        return "OR Number is required for every payment item.";
      }
      if (!isValidOrNumber(item.orNumber)) {
        return `Invalid OR Number format for ${item.label}. Use OR-YYYY-000001.`;
      }
    }

    const seen = new Set();
    for (const item of normalizedValues) {
      if (seen.has(item.orNumber)) {
        return "Each payment item must use a different OR Number.";
      }
      seen.add(item.orNumber);
    }

    for (const item of normalizedValues) {
      if ((existingOrNumbers || new Set()).has(item.orNumber)) {
        return `${item.orNumber} already exists. Enter a unique OR Number.`;
      }
    }

    return "";
  };

  const cannotSave = preview.appliedAmount <= 0 || isOverpayment || payableLineItems.length === 0;

  const handleSave = () => {
    if (cannotSave) {
      return;
    }

    const orValidationError = validateOrNumbers();
    if (orValidationError) {
      setValidationMessage(orValidationError);
      return;
    }

    const carryOver = getCarryOverTotals(currentStudent);
    const appliedLineItems = payableLineItems.map((item) => ({
      ...item,
      or_number: normalizeOrNumber(lineItemOrNumbers[item.key]),
      semester: item.field === CARRY_OVER_FIELD ? carryOver.source_semester || "1st Semester" : activeSemester,
    }));

    const stageMeta =
      paymentMode === PAYMENT_MODES.FULL
        ? {
            stage_field: "FullPaymentAmount",
            stage_label: "Full Payment",
            stage_amount_before: roundCurrency(currentStudent.TotalBalance),
            stage_amount_paid: roundCurrency(preview.appliedAmount),
            stage_amount_remaining: roundCurrency(preview.outstandingAfter),
          }
        : (() => {
            const currentIndex = getCurrentInstallmentIndex(currentStudent);

            if (carryOver.remaining > 0 && appliedLineItems.some((item) => item.field === CARRY_OVER_FIELD)) {
              return {
                stage_field: CARRY_OVER_FIELD,
                stage_label: "Previous Balance from 1st Semester",
                stage_amount_before: carryOver.remaining,
                stage_amount_paid: appliedLineItems
                  .filter((item) => item.field === CARRY_OVER_FIELD)
                  .reduce((total, item) => total + item.amount_paid, 0),
                stage_amount_remaining: preview.nextStudent.carried_over_remaining ?? 0,
              };
            }

            if (currentIndex === -1) {
              return {
                stage_field: null,
                stage_label: "Installment",
                stage_amount_before: 0,
                stage_amount_paid: roundCurrency(preview.appliedAmount),
                stage_amount_remaining: 0,
              };
            }

            const stageField = INSTALLMENT_FIELDS[currentIndex];
            const stageLabel = INSTALLMENT_LABELS[stageField];
            const stageAmountBefore = roundCurrency(currentStudent[stageField]);
            const stageAmountPaid = roundCurrency(
              appliedLineItems
                .filter((item) => item.field === stageField)
                .reduce((total, item) => total + item.amount_paid, 0)
            );
            const stageAmountRemaining = roundCurrency(Math.max(stageAmountBefore - stageAmountPaid, 0));

            return {
              stage_field: stageField,
              stage_label: stageLabel,
              stage_amount_before: stageAmountBefore,
              stage_amount_paid: stageAmountPaid,
              stage_amount_remaining: stageAmountRemaining,
            };
          })();

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
        official_receipt:
          appliedLineItems.length === 1
            ? appliedLineItems[0].or_number
            : appliedLineItems.map((item) => item.or_number).join(", "),
        payment_breakdown: preview.breakdown,
        payment_line_items: appliedLineItems,
        school_year_label: activeSchoolYearLabel,
        semester: activeSemester,
        ...stageMeta,
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
            <span>Semester</span>
            <strong>{activeSemester || "N/A"}</strong>
          </div>
        </div>

        <div className="payment-metric-grid">
          <article className="payment-metric-card">
            <span>2nd Semester Tuition</span>
            <strong>{currencyFormatter.format(getCurrentSemesterTuitionAmount(currentStudent))}</strong>
          </article>
          <article className="payment-metric-card">
            <span>Previous Balance</span>
            <strong>{currencyFormatter.format(getPreviousSemesterBalanceAmount(currentStudent))}</strong>
          </article>
          <article className="payment-metric-card">
            <span>Total Payable</span>
            <strong>{currencyFormatter.format(getTotalPayableAmount(currentStudent))}</strong>
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
            <label>School Year</label>
            <input type="text" value={activeSchoolYearLabel || ""} readOnly />
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
          {validationMessage ? <p className="payment-warning">{validationMessage}</p> : null}

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

          {paymentMode === PAYMENT_MODES.INSTALLMENT ? (
            <div className="payment-result-strip">
              <span>
                Downpayment breakdown: {currencyFormatter.format(getDisplayDownpaymentAmount(currentStudent))}
              </span>
              <span>
                Current sem: {currencyFormatter.format(currentStudent.Downpayment)}
              </span>
              <span>
                Previous balance: {currencyFormatter.format(getPreviousSemesterBalanceAmount(currentStudent))}
              </span>
            </div>
          ) : null}

          {payableLineItems.length > 0 ? (
            <div className="payment-form-grid" style={{ marginTop: 16 }}>
              {payableLineItems.map((item) => (
                <div key={item.key} className="form-group">
                  <label>{`${item.label} OR #`}</label>
                  <input
                    type="text"
                    value={lineItemOrNumbers[item.key] || ""}
                    onChange={(event) => {
                      setValidationMessage("");
                      setLineItemOrNumbers((prev) => ({
                        ...prev,
                        [item.key]: event.target.value,
                      }));
                    }}
                    placeholder="OR-YYYY-000001"
                  />
                  <small>{currencyFormatter.format(item.amount_paid)}</small>
                </div>
              ))}
            </div>
          ) : null}

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
