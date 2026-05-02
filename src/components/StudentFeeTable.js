import React, { useCallback, useMemo, useState } from "react";
import payIcon from "../assets/pay.png";
import remindIcon from "../assets/reminder.png";
import {
  CARRY_OVER_FIELD,
  CARRY_OVER_LABEL,
  getCurrentInstallmentIndex,
  getCollectedAmount,
  getCarryOverTotals,
  getDisplayDownpaymentAmount,
  getEffectiveTotalFee,
  getLatestPaymentReminderToken,
  getPreviousSemesterBalanceAmount,
  hasRolledToRemainingBalance,
  INSTALLMENT_PAID_AMOUNT_FIELDS,
  INSTALLMENT_FIELDS,
  normalizeStudentFinancials,
  PAYMENT_MODES,
} from "../utils/fees";
import { isSecondSemester } from "../utils/semester";
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
  TotalBalance: "Total Balance",
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

const formatOrLabel = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized || normalized === "N/A") {
    return "";
  }

  return /^OR\b/i.test(normalized) ? normalized : `OR ${normalized}`;
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
  onUpdatePaymentOrNumber,
  sendingReminder = false,
  activeSemester = "",
  onRequestCarryOver,
  isCarryOverAvailable,
}) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [paymentDetailModal, setPaymentDetailModal] = useState({
    open: false,
    student: null,
    field: "",
  });
  const [editingOrState, setEditingOrState] = useState({
    value: "",
    field: "",
    semester: "",
  });
  const [isSavingOrNumber, setIsSavingOrNumber] = useState(false);
  const [orNumberError, setOrNumberError] = useState("");
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
    return student.id || student.OriginalStudentID || student.StudentID || `row-${originalIndex}`;
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
      case "TotalBalance":
        return "total_balance_date";
      default:
        return "";
    }
  };

  const getLatestTotalBalanceSettlement = useCallback((student) => {
    const paymentHistory = Array.isArray(student?.payment_history) ? student.payment_history : [];
    const totalBalanceDate = student?.total_balance_date;
    const normalizedTotalBalanceDate = totalBalanceDate ? new Date(totalBalanceDate).getTime() : NaN;
    const isMatchingSemester = (item) =>
      !activeSemester || !item?.semester || String(item.semester).trim() === String(activeSemester).trim();

    const matchingItems = paymentHistory.filter((item) => {
      if (!isMatchingSemester(item)) {
        return false;
      }

      const paymentTimestamp = item?.payment_date ? new Date(item.payment_date).getTime() : NaN;
      if (Number.isFinite(normalizedTotalBalanceDate) && Number.isFinite(paymentTimestamp)) {
        return paymentTimestamp === normalizedTotalBalanceDate;
      }

      return false;
    });

    if (matchingItems.length > 0) {
      return matchingItems;
    }

    if (paymentHistory.length === 0) {
      return [];
    }

    const semesterHistory = paymentHistory.filter(isMatchingSemester);
    if (semesterHistory.length === 0) {
      return [];
    }

    const latestTimestamp = Math.max(
      ...semesterHistory.map((item) => {
        const timestamp = item?.payment_date ? new Date(item.payment_date).getTime() : NaN;
        return Number.isFinite(timestamp) ? timestamp : -Infinity;
      })
    );

    if (!Number.isFinite(latestTimestamp)) {
      return [];
    }

    return semesterHistory.filter((item) => {
      const timestamp = item?.payment_date ? new Date(item.payment_date).getTime() : NaN;
      return timestamp === latestTimestamp;
    });
  }, [activeSemester]);

  const getTotalBalancePaymentDetail = useCallback((student) => {
    const settlementItems = getLatestTotalBalanceSettlement(student);
    const uniqueOrNumbers = Array.from(
      new Set(
        settlementItems
          .map((item) => item?.or_number || "")
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      )
    );
    const fallbackOrNumber =
      student?.stage_or_numbers?.TotalBalance ||
      student?.official_receipt ||
      uniqueOrNumbers.join(", ");

    return {
      amount: Number(student?.total_balance_paid_amount ?? 0) || settlementItems.reduce(
        (total, item) => total + Number(item?.amount_paid ?? 0),
        0
      ),
      orNumber: fallbackOrNumber || "N/A",
    };
  }, [getLatestTotalBalanceSettlement]);

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

          openPaymentDetailModal(student, field);
        }}
      >
        <span>{paid ? "PAID" : currencyFormatter.format(amount)}</span>
      </button>
    );
  };

  const getCarryOverPaymentDetail = (student, field) => {
    if (field !== "Downpayment") {
      return null;
    }

    const paymentHistory = Array.isArray(student?.payment_history) ? student.payment_history : [];
    const carryOverEntry = [...paymentHistory]
      .reverse()
      .find((item) => item?.field === CARRY_OVER_FIELD && Number(item?.amount_paid) > 0);

    if (!carryOverEntry) {
      return null;
    }

    return {
      label: CARRY_OVER_LABEL,
      amount: Number(carryOverEntry.amount_paid ?? 0),
      orNumber: carryOverEntry.or_number || student?.stage_or_numbers?.[CARRY_OVER_FIELD] || "N/A",
      semester: carryOverEntry.semester || getCarryOverTotals(student).source_semester || "1st Semester",
    };
  };

  const canCarryOverBalance = (student) => {
    if (activeSemester !== "1st Semester" || typeof onRequestCarryOver !== "function") {
      return false;
    }

    if (typeof isCarryOverAvailable === "function") {
      return isCarryOverAvailable(student);
    }

    const normalized = normalizeStudentFinancials(student);
    const currentInstallmentIndex = getCurrentInstallmentIndex(normalized);
    return (
      normalized.TotalBalance > 0 &&
      (currentInstallmentIndex === INSTALLMENT_FIELDS.length - 1 || currentInstallmentIndex === -1)
    );
  };

  const renderTotalBalanceCell = (student) => {
    const canOpenDetail =
      Number(student?.TotalBalance ?? 0) <= 0 &&
      Boolean(student?.total_balance_date) &&
      (isSecondSemester(activeSemester) || Boolean(student?.stage_or_numbers?.TotalBalance));

    if (!canOpenDetail) {
      return (
        <span className={`balance-pill ${student.TotalBalance > 0 ? "due" : "paid"}`}>
          {currencyFormatter.format(student.TotalBalance)}
        </span>
      );
    }

    return (
      <button
        type="button"
        className={`balance-pill balance-pill-button ${student.TotalBalance > 0 ? "due" : "paid"}`}
        onClick={() =>
          openPaymentDetailModal(student, "TotalBalance")
        }
      >
        {currencyFormatter.format(student.TotalBalance)}
      </button>
    );
  };

  const closePaymentDetailModal = () => {
    setPaymentDetailModal({ open: false, student: null, field: "" });
    setEditingOrState({ value: "", field: "", semester: "" });
    setIsSavingOrNumber(false);
    setOrNumberError("");
  };

  const openPaymentDetailModal = (student, field) => {
    setPaymentDetailModal({
      open: true,
      student,
      field,
    });
    setEditingOrState({ value: "", field: "", semester: "" });
    setIsSavingOrNumber(false);
    setOrNumberError("");
  };

  const getPrimaryOrNumber = useCallback((student, field) => {
    if (field === "TotalBalance") {
      return getTotalBalancePaymentDetail(student).orNumber;
    }

    return student?.stage_or_numbers?.[field] || "N/A";
  }, [getTotalBalancePaymentDetail]);

  const handleSaveEditedOrNumber = async () => {
    if (!paymentDetailModal.student || !editingOrState.field || typeof onUpdatePaymentOrNumber !== "function") {
      return;
    }

    setIsSavingOrNumber(true);
    setOrNumberError("");

    try {
      await onUpdatePaymentOrNumber({
        student: paymentDetailModal.student,
        field: editingOrState.field,
        orNumber: editingOrState.value,
        targetSemester: editingOrState.semester || activeSemester,
      });

      const nextStudent = {
        ...paymentDetailModal.student,
        stage_or_numbers: {
          ...(paymentDetailModal.student.stage_or_numbers || {}),
          [editingOrState.field]: editingOrState.value,
        },
        official_receipt:
          editingOrState.field === "TotalBalance"
            ? editingOrState.value
            : paymentDetailModal.student.official_receipt,
        payment_history: Array.isArray(paymentDetailModal.student.payment_history)
          ? paymentDetailModal.student.payment_history.map((item) =>
              editingOrState.field === "TotalBalance"
                ? ((item?.semester || activeSemester) === (editingOrState.semester || activeSemester)
                  ? { ...item, or_number: editingOrState.value }
                  : item)
                : (item?.field === editingOrState.field && (item?.semester || activeSemester) === (editingOrState.semester || activeSemester)
                  ? { ...item, or_number: editingOrState.value }
                  : item)
            )
          : [],
      };

      setPaymentDetailModal((prev) => ({
        ...prev,
        student: nextStudent,
      }));
      setEditingOrState({ value: "", field: "", semester: "" });
    } catch (error) {
      setOrNumberError(error?.message || "Unable to update OR Number.");
    } finally {
      setIsSavingOrNumber(false);
    }
  };

  return (
    <main className="student-dashboard student-fee-dashboard">
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
                const rolledToRemainingBalance = hasRolledToRemainingBalance(normalized);
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
                    <td>
                      <div className="fee-total-display">
                        <span>{currencyFormatter.format(getEffectiveTotalFee(normalized))}</span>
                        {getPreviousSemesterBalanceAmount(normalized) > 0 ? (
                          <span className="fee-effective-note">
                            Includes previous balance: {currencyFormatter.format(getPreviousSemesterBalanceAmount(normalized))}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="fee-total-display">
                        {renderPaymentCell(
                          normalized,
                          "Downpayment",
                          getDisplayDownpaymentAmount(normalized),
                          normalized.downpayment_date
                        )}
                        {getPreviousSemesterBalanceAmount(normalized) > 0 ? (
                          <span className="fee-effective-note">
                            Current sem: {currencyFormatter.format(normalized.Downpayment)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{renderPaymentCell(normalized, "Prelim", normalized.Prelim, normalized.prelim_date)}</td>
                    <td>{renderPaymentCell(normalized, "Midterm", normalized.Midterm, normalized.midterm_date)}</td>
                    <td>{renderPaymentCell(normalized, "PreFinal", normalized.PreFinal, normalized.prefinal_date)}</td>
                    <td>
                      {renderPaymentCell(
                        normalized,
                        "Finals",
                        rolledToRemainingBalance ? 0 : normalized.Finals,
                        rolledToRemainingBalance ? normalized.final_date || normalized.total_balance_date || true : normalized.final_date
                      )}
                    </td>
                    <td>{currencyFormatter.format(normalized.FullPaymentAmount)}</td>
                    <td>
                      {canCarryOverBalance(normalized) ? (
                        <button
                          type="button"
                          className={`balance-pill balance-pill-button ${normalized.TotalBalance > 0 ? "due" : "paid"}`}
                          onClick={() => onRequestCarryOver?.(normalized)}
                        >
                          {currencyFormatter.format(normalized.TotalBalance)}
                        </button>
                      ) : (
                        renderTotalBalanceCell(normalized)
                      )}
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
        <div className="modal" onClick={closePaymentDetailModal}>
          <div className="modal-content payment-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-title-row">
              <div>
                <h2>Payment Details</h2>
                <p>Review the saved payment information for this stage.</p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={closePaymentDetailModal}
              >
                Close
              </button>
            </div>
            {paymentDetailModal.student ? (
              (() => {
                const carryOverDetail = getCarryOverPaymentDetail(
                  paymentDetailModal.student,
                  paymentDetailModal.field
                );
                const primaryOrNumber = getPrimaryOrNumber(
                  paymentDetailModal.student,
                  paymentDetailModal.field
                );
                const amountPaid = currencyFormatter.format(paymentDetailModal.field === "TotalBalance"
                  ? getTotalBalancePaymentDetail(paymentDetailModal.student).amount
                  : Number(
                    paymentDetailModal.student[
                      INSTALLMENT_PAID_AMOUNT_FIELDS[paymentDetailModal.field]
                    ] ?? 0
                  ));

                return (
              <div className="payment-detail-grid">
                <div>
                  <span>Payment Stage</span>
                  <strong>{PAYMENT_FIELD_LABELS[paymentDetailModal.field] || paymentDetailModal.field}</strong>
                </div>
                <div>
                  <span>Amount Paid</span>
                  <strong>{amountPaid}</strong>
                </div>
                <div>
                  <span>Date Paid</span>
                  <strong>
                    {formatPaymentDate(
                      paymentDetailModal.student[getPaymentDateField(paymentDetailModal.field)]
                    ) || "N/A"}
                  </strong>
                </div>
                <div>
                  <span>OR Number</span>
                  {editingOrState.field === paymentDetailModal.field ? (
                    <div className="payment-detail-edit">
                      <input
                        type="text"
                        value={editingOrState.value}
                        onChange={(event) =>
                          setEditingOrState((prev) => ({ ...prev, value: event.target.value.toUpperCase() }))
                        }
                        placeholder="OR-YYYY-000001"
                      />
                      <div className="payment-detail-edit-actions">
                        <button
                          type="button"
                          className="action-btn pay-btn"
                          onClick={handleSaveEditedOrNumber}
                          disabled={isSavingOrNumber}
                        >
                          {isSavingOrNumber ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          className="action-btn remind-btn"
                          onClick={() => {
                            setEditingOrState({ value: "", field: "", semester: "" });
                            setOrNumberError("");
                          }}
                          disabled={isSavingOrNumber}
                        >
                          Cancel
                        </button>
                      </div>
                      {orNumberError ? (
                        <p className="payment-detail-error-text">{orNumberError}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="payment-detail-display">
                      <strong>{formatOrLabel(primaryOrNumber) || "N/A"}</strong>
                      <button
                        type="button"
                        className="action-btn pay-btn"
                        onClick={() => {
                          setEditingOrState({
                            value: primaryOrNumber === "N/A" ? "" : primaryOrNumber,
                            field: paymentDetailModal.field,
                            semester: activeSemester,
                          });
                          setOrNumberError("");
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                {carryOverDetail ? (
                  <div>
                    <span>Previous Balance</span>
                    <strong>{currencyFormatter.format(carryOverDetail.amount)}</strong>
                  </div>
                ) : null}
                {carryOverDetail ? (
                  <div>
                    <span>Previous Balance OR Number</span>
                    {editingOrState.field === CARRY_OVER_FIELD ? (
                      <div className="payment-detail-edit">
                        <input
                          type="text"
                          value={editingOrState.value}
                          onChange={(event) =>
                            setEditingOrState((prev) => ({ ...prev, value: event.target.value.toUpperCase() }))
                          }
                          placeholder="OR-YYYY-000001"
                        />
                        <div className="payment-detail-edit-actions">
                          <button
                            type="button"
                            className="action-btn pay-btn"
                            onClick={handleSaveEditedOrNumber}
                            disabled={isSavingOrNumber}
                          >
                            {isSavingOrNumber ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            className="action-btn remind-btn"
                            onClick={() => {
                              setEditingOrState({ value: "", field: "", semester: "" });
                              setOrNumberError("");
                            }}
                            disabled={isSavingOrNumber}
                          >
                            Cancel
                          </button>
                        </div>
                        {orNumberError ? (
                          <p className="payment-detail-error-text">{orNumberError}</p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="payment-detail-display">
                        <strong>{formatOrLabel(carryOverDetail.orNumber) || "N/A"}</strong>
                        <button
                          type="button"
                          className="action-btn pay-btn"
                          onClick={() => {
                            setEditingOrState({
                              value: carryOverDetail.orNumber === "N/A" ? "" : carryOverDetail.orNumber,
                              field: CARRY_OVER_FIELD,
                              semester: carryOverDetail.semester || activeSemester,
                            });
                            setOrNumberError("");
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
                );
              })()
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
