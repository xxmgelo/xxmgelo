import React, { useCallback, useMemo, useState } from "react";
import payIcon from "../assets/pay.png";
import remindIcon from "../assets/reminder.png";
import {
  getCollectedAmount,
  getEffectiveTotalFee,
  getLatestPaymentReminderToken,
  INSTALLMENT_PAID_AMOUNT_FIELDS,
  normalizeStudentFinancials,
  PAYMENT_MODES,
} from "../utils/fees";
import TablePagination from "./TablePagination";
import useTablePagination from "../hooks/useTablePagination";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const tableDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const PAYMENT_FIELD_LABELS = {
  Downpayment: "Downpayment",
  Prelim: "Prelim",
  Midterm: "Midterm",
  PreFinal: "Pre-Final",
  Finals: "Finals",
  FullPaymentAmount: "Full Payment",
};

const formatPaymentDate = (value) => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return tableDateFormatter.format(parsedDate);
};

const isStagePaid = (student, field, amount, dateValue) => {
  const paidAmountField = INSTALLMENT_PAID_AMOUNT_FIELDS[field];
  const paidAmount = Number(student?.[paidAmountField] ?? 0);
  return Number(amount) <= 0 && (Boolean(dateValue) || paidAmount > 0);
};

function StudentFeeTable({
  students,
  filteredStudents,
  onPaid,
  onRemind,
  onRemindSelected,
  sendingReminder = false,
}) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [paymentDetailModal, setPaymentDetailModal] = useState({
    open: false,
    student: null,
    field: "",
  });
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    totalItems,
    rangeStart,
    rangeEnd,
  } = useTablePagination(filteredStudents, 10);

  const getRowKey = useCallback((student) => {
    const originalIndex = students.indexOf(student);
    return student.StudentID || `row-${originalIndex}`;
  }, [students]);

  const visibleRowKeys = useMemo(
    () => paginatedItems.map((student) => getRowKey(student)),
    [paginatedItems, getRowKey]
  );

  const allSelected =
    visibleRowKeys.length > 0 && visibleRowKeys.every((rowKey) => selectedRows.has(rowKey));

  const summary = useMemo(() => {
    return filteredStudents.reduce(
      (totals, student) => {
        const normalized = normalizeStudentFinancials(student);
        totals.collected += getCollectedAmount(normalized);
        totals.outstanding += normalized.TotalBalance;
        if (normalized.TotalBalance > 0) {
          totals.pending += 1;
        }

        return totals;
      },
      { collected: 0, outstanding: 0, pending: 0 }
    );
  }, [filteredStudents]);

  const selectedStudents = useMemo(
    () =>
      filteredStudents.filter((student) => {
        const rowKey = getRowKey(student);
        return selectedRows.has(rowKey);
      }),
    [filteredStudents, selectedRows, getRowKey]
  );

  const eligibleSelectedStudents = useMemo(
    () =>
      selectedStudents
        .map((student) => normalizeStudentFinancials(student))
        .filter((student) => {
          const reminderToken = getLatestPaymentReminderToken(student);
          return (
            student.Gmail &&
            student.TotalBalance > 0 &&
            student.CanRemind &&
            reminderToken &&
            student.reminder_sent_token !== reminderToken
          );
        }),
    [selectedStudents]
  );

  const toggleRow = (rowKey) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedRows((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        visibleRowKeys.forEach((rowKey) => next.delete(rowKey));
        return next;
      }

      const next = new Set(prev);
      visibleRowKeys.forEach((rowKey) => next.add(rowKey));
      return next;
    });
  };

  const handleRemindSelected = async () => {
    if (!onRemindSelected || sendingReminder || eligibleSelectedStudents.length === 0) {
      return;
    }

    await onRemindSelected(eligibleSelectedStudents);
  };

  const getPaymentDateField = (field) => {
    switch (field) {
      case "Downpayment":
        return "downpayment_date";
      case "Prelim":
        return "prelim_date";
      case "Midterm":
        return "midterm_date";
      case "PreFinal":
        return "prefinal_date";
      case "Finals":
        return "final_date";
      case "FullPaymentAmount":
        return "total_balance_date";
      default:
        return "";
    }
  };

  const renderPaymentCell = (student, field, amount, dateValue) => {
    const paid = isStagePaid(student, field, amount, dateValue);

    return (
      <button
        type="button"
        className={`payment-amount-cell${paid ? " payment-paid-cell" : ""}`}
        onClick={() => {
          if (!paid) {
            return;
          }

          setPaymentDetailModal({
            open: true,
            student,
            field,
          });
        }}
      >
        <span>{paid ? "PAID" : currencyFormatter.format(amount)}</span>
      </button>
    );
  };

  return (
    <main className="student-dashboard">
      <div className="section-header">
        <div>
          <h2>Student Fees</h2>
        </div>
        <div className="section-actions">
          <div className="section-summary-pill">
            <span>Collected</span>
            <strong>{currencyFormatter.format(summary.collected)}</strong>
          </div>
          <div className="section-summary-pill">
            <span>Outstanding</span>
            <strong>{currencyFormatter.format(summary.outstanding)}</strong>
          </div>
          <div className="section-summary-pill">
            <span>Selected</span>
            <strong>{selectedStudents.length}</strong>
          </div>
          <button
            className="action-btn remind-btn"
            type="button"
            onClick={handleRemindSelected}
            disabled={sendingReminder || eligibleSelectedStudents.length === 0}
          >
            <img src={remindIcon} alt="Remind selected" className="btn-icon" />
            {sendingReminder ? "Sending..." : `Send ${eligibleSelectedStudents.length} Reminder${eligibleSelectedStudents.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>
                Select
                <input
                  type="checkbox"
                  className="checklist-box"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all students in current page"
                />
              </th>
              <th>USN #</th>
              <th>Name</th>
              <th>Program/Course</th>
              <th>Year Level</th>
              <th>Gmail</th>
              <th>Payment Mode</th>
              <th>Total Fee</th>
              <th>Downpayment</th>
              <th>Prelim</th>
              <th>Midterm</th>
              <th>Pre-Final</th>
              <th>Finals</th>
              <th>Full Payment</th>
              <th>Total Balance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              paginatedItems.map((student, index) => {
                const rowKey = getRowKey(student);
                const isSelected = selectedRows.has(rowKey);
                const normalized = normalizeStudentFinancials(student);
                const isPaid = normalized.TotalBalance <= 0;
                const reminderToken = getLatestPaymentReminderToken(normalized);
                const reminderAlreadySent =
                  Boolean(reminderToken) && normalized.reminder_sent_token === reminderToken;
                const canRemind = Boolean(
                  !isPaid &&
                  normalized.Gmail &&
                  normalized.CanRemind &&
                  reminderToken &&
                  !reminderAlreadySent
                );

                return (
                  <tr key={rowKey} className={isSelected ? "row-selected" : ""}>
                    <td>{rangeStart + index}</td>
                    <td>
                      <input
                        type="checkbox"
                        className="checklist-box"
                        checked={isSelected}
                        onChange={() => toggleRow(rowKey)}
                      />
                    </td>
                    <td>{normalized.StudentID || "N/A"}</td>
                    <td>{normalized.Name || "N/A"}</td>
                    <td>{normalized.Program || "N/A"}</td>
                    <td>{normalized.YearLevel || "N/A"}</td>
                    <td>{normalized.Gmail || student.Gmail || student.gmail || "N/A"}</td>
                    <td>
                      <span className="payment-mode-pill">
                        {normalized.PaymentMode === PAYMENT_MODES.FULL ? "Full" : "Installment"}
                      </span>
                    </td>
                    <td>{currencyFormatter.format(getEffectiveTotalFee(normalized))}</td>
                    <td>{renderPaymentCell(normalized, "Downpayment", normalized.Downpayment, normalized.downpayment_date)}</td>
                    <td>{renderPaymentCell(normalized, "Prelim", normalized.Prelim, normalized.prelim_date)}</td>
                    <td>{renderPaymentCell(normalized, "Midterm", normalized.Midterm, normalized.midterm_date)}</td>
                    <td>{renderPaymentCell(normalized, "PreFinal", normalized.PreFinal, normalized.prefinal_date)}</td>
                    <td>{renderPaymentCell(normalized, "Finals", normalized.Finals, normalized.final_date)}</td>
                    <td>{currencyFormatter.format(normalized.FullPaymentAmount)}</td>
                    <td>
                      <span className={`balance-pill ${normalized.TotalBalance > 0 ? "due" : "paid"}`}>
                        {currencyFormatter.format(normalized.TotalBalance)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn pay-btn"
                          onClick={() => onPaid(normalized)}
                          type="button"
                          disabled={isPaid}
                        >
                          <img src={payIcon} alt="Pay" className="btn-icon" />
                          {isPaid ? "Paid" : "Pay"}
                        </button>
                        <button
                          className="action-btn remind-btn"
                          type="button"
                          disabled={sendingReminder || !canRemind}
                          onClick={() => onRemind(normalized)}
                          title={
                            reminderAlreadySent
                              ? "Reminder already sent for the latest paid stage."
                              : !normalized.CanRemind
                                ? "Save payment first before sending a reminder."
                                : ""
                          }
                        >
                          <img src={remindIcon} alt="Remind" className="btn-icon" />
                          Remind
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="17" className="table-empty-cell">
                  No data uploaded yet. Add an Excel file to start managing collections.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {paymentDetailModal.open ? (
        <div className="modal" onClick={() => setPaymentDetailModal({ open: false, student: null, field: "" })}>
          <div className="modal-content payment-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-title-row">
              <div>
                <h2>Payment Details</h2>
                <p>Review the saved payment information for this stage.</p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setPaymentDetailModal({ open: false, student: null, field: "" })}
              >
                Close
              </button>
            </div>
            {paymentDetailModal.student ? (
              <div className="payment-detail-grid">
                <div>
                  <span>Student</span>
                  <strong>{paymentDetailModal.student.Name || "N/A"}</strong>
                </div>
                <div>
                  <span>Student ID</span>
                  <strong>{paymentDetailModal.student.StudentID || "N/A"}</strong>
                </div>
                <div>
                  <span>Payment Stage</span>
                  <strong>{PAYMENT_FIELD_LABELS[paymentDetailModal.field] || paymentDetailModal.field}</strong>
                </div>
                <div>
                  <span>Amount Paid</span>
                  <strong>
                    {currencyFormatter.format(
                      Number(
                        paymentDetailModal.student[
                          INSTALLMENT_PAID_AMOUNT_FIELDS[paymentDetailModal.field]
                        ] ?? 0
                      )
                    )}
                  </strong>
                </div>
                <div>
                  <span>Date Paid</span>
                  <strong>
                    {formatPaymentDate(
                      paymentDetailModal.student[getPaymentDateField(paymentDetailModal.field)]
                    ) || "N/A"}
                  </strong>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {filteredStudents.length > 0 ? (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onPageChange={setCurrentPage}
        />
      ) : null}
    </main>
  );
}

export default StudentFeeTable;
