import React, { useEffect, useMemo, useState } from "react";
import {
  getCarryOverTotals,
  getCurrentSemesterTuitionAmount,
  getDisplayDownpaymentAmount,
  normalizeStudentFinancials,
  PAYMENT_MODES,
  getCollectedAmount,
  getEffectiveTotalFee,
  getTotalPayableAmount,
} from "../utils/fees";
import TablePagination from "./TablePagination";
import useTablePagination from "../hooks/useTablePagination";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function StudentFeeAdminTable({
  students,
  filteredStudents,
  onFieldChange,
  onFieldCommit,
}) {
  const [draftValues, setDraftValues] = useState({});
  const getRowKey = (student, fallbackIndex = -1) =>
    student.id || student.OriginalStudentID || student.StudentID || `row-${fallbackIndex}`;
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    totalItems,
    rangeStart,
    rangeEnd,
  } = useTablePagination(filteredStudents, 10);

  const formatAmount = (value) => {
    if (value === null || value === undefined || value === "") return "";
    return String(value);
  };

  useEffect(() => {
    setDraftValues({});
  }, [students]);

  const getDraftKey = (rowKey, field) => `${rowKey}:${field}`;

  const getInputValue = (student, rowKey, field, options = {}) => {
    const draftKey = getDraftKey(rowKey, field);
    if (Object.prototype.hasOwnProperty.call(draftValues, draftKey)) {
      return draftValues[draftKey];
    }
    return formatAmount(options.value !== undefined ? options.value : student[field]);
  };

  const summary = useMemo(() => {
    return filteredStudents.reduce(
      (totals, student) => {
        const normalized = normalizeStudentFinancials(student);
        totals.totalFee += getEffectiveTotalFee(normalized);
        totals.outstanding += normalized.TotalBalance;
        totals.collected += getCollectedAmount(normalized);
        return totals;
      },
      { totalFee: 0, outstanding: 0, collected: 0 }
    );
  }, [filteredStudents]);

  const renderFeeInput = (student, rowKey, field, options = {}) => (
    <input
      type="text"
      className={`fee-input ${options.readOnly ? "fee-output" : ""}`}
      value={getInputValue(student, rowKey, field, options)}
      onChange={(event) => {
        const draftKey = getDraftKey(rowKey, field);
        setDraftValues((prev) => ({
          ...prev,
          [draftKey]: event.target.value,
        }));
      }}
      onBlur={() => {
        const draftKey = getDraftKey(rowKey, field);
        const nextValue = Object.prototype.hasOwnProperty.call(draftValues, draftKey)
          ? draftValues[draftKey]
          : formatAmount(options.value !== undefined ? options.value : student[field]);

        setDraftValues((prev) => {
          const next = { ...prev };
          delete next[draftKey];
          return next;
        });

        onFieldCommit(rowKey, field, nextValue);
      }}
      placeholder={options.placeholder || "0"}
      inputMode="decimal"
      readOnly={Boolean(options.readOnly)}
      disabled={Boolean(options.disabled)}
    />
  );

  const renderModeSelect = (student, rowKey) => (
    <select
      className="fee-input fee-select"
      value={student.PaymentMode}
      onChange={(event) => onFieldChange(rowKey, "PaymentMode", event.target.value)}
      onBlur={() => onFieldCommit(rowKey)}
    >
      <option value={PAYMENT_MODES.INSTALLMENT}>Installment</option>
      <option value={PAYMENT_MODES.FULL}>Full</option>
    </select>
  );

  return (
    <main className="student-dashboard">
      <div className="section-header">
        <div>
          <h2>Manage Fees</h2>
        </div>
        <div className="section-stat-group">
          <div className="section-summary-pill">
            <span>Total tuition</span>
            <strong>{currencyFormatter.format(summary.totalFee)}</strong>
          </div>
          <div className="section-summary-pill">
            <span>Collected</span>
            <strong>{currencyFormatter.format(summary.collected)}</strong>
          </div>
          <div className="section-summary-pill">
            <span>Outstanding</span>
            <strong>{currencyFormatter.format(summary.outstanding)}</strong>
          </div>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>USN #</th>
              <th>Name</th>
              <th>Program/Course</th>
              <th>Year Level</th>
              <th>Gmail</th>
              <th>Payment Mode</th>
              <th>Total Fee</th>
              <th>Discount (%)</th>
              <th>Previous Balance</th>
              <th>Downpayment</th>
              <th>Prelim</th>
              <th>Midterm</th>
              <th>Pre-Final</th>
              <th>Finals</th>
              <th>Full Payment</th>
              <th>Total Balance</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              paginatedItems.map((student, index) => {
                const originalIndex = students.indexOf(student);
                const rowKey = getRowKey(student, originalIndex);
                const normalized = normalizeStudentFinancials(student);
                const carryOver = getCarryOverTotals(normalized);
                const installmentDisabled = normalized.PaymentMode === PAYMENT_MODES.FULL;
                const fullPaymentDisabled = normalized.PaymentMode !== PAYMENT_MODES.FULL;
                const displayDownpaymentAmount = getDisplayDownpaymentAmount(normalized);

                return (
                  <tr key={rowKey}>
                    <td>{rangeStart + index}</td>
                    <td>{normalized.StudentID || "N/A"}</td>
                    <td>{normalized.Name || "N/A"}</td>
                    <td>{normalized.Program || "N/A"}</td>
                    <td>{normalized.YearLevel || "N/A"}</td>
                    <td>{normalized.Gmail || "N/A"}</td>
                    <td>{renderModeSelect(normalized, rowKey)}</td>
                    <td>
                      <div className="fee-total-display">
                        {renderFeeInput(normalized, rowKey, "TotalFee", {
                          value: getCurrentSemesterTuitionAmount(normalized),
                          placeholder: String(getCurrentSemesterTuitionAmount(normalized) || 0),
                        })}
                        {carryOver.remaining > 0 ? (
                          <>
                            <span className="fee-effective-note">
                              2nd Sem Tuition: {currencyFormatter.format(getCurrentSemesterTuitionAmount(normalized))}
                            </span>
                            <span className="fee-effective-note">
                              Previous Balance (1st Semester): {currencyFormatter.format(carryOver.remaining)}
                            </span>
                            <span className="fee-effective-note">
                              Final Total Fee: {currencyFormatter.format(getTotalPayableAmount(normalized))}
                            </span>
                          </>
                        ) : null}
                        {Number(normalized.Discount || 0) > 0 ? (
                          <span className="fee-effective-note">
                            Effective: {currencyFormatter.format(getEffectiveTotalFee(normalized))}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{renderFeeInput(normalized, rowKey, "Discount", { placeholder: "0" })}</td>
                    <td>
                      {renderFeeInput(normalized, rowKey, "CarriedOverAmount", {
                        value: carryOver.remaining,
                        readOnly: true,
                        placeholder: "0",
                      })}
                    </td>
                    <td>
                      <div className="fee-total-display">
                        <input
                          type="text"
                          className="fee-input"
                          value={getInputValue(normalized, rowKey, "Downpayment", {
                            value: displayDownpaymentAmount,
                          })}
                          onChange={(event) => {
                            const draftKey = getDraftKey(rowKey, "Downpayment");
                            setDraftValues((prev) => ({
                              ...prev,
                              [draftKey]: event.target.value,
                            }));
                          }}
                          onBlur={() => {
                            const draftKey = getDraftKey(rowKey, "Downpayment");
                            const typedValue = Object.prototype.hasOwnProperty.call(draftValues, draftKey)
                              ? draftValues[draftKey]
                              : formatAmount(displayDownpaymentAmount);
                            const normalizedValue = Math.max(
                              Number(String(typedValue).replace(/[^0-9.-]/g, "")) - carryOver.remaining,
                              0
                            );

                            setDraftValues((prev) => {
                              const next = { ...prev };
                              delete next[draftKey];
                              return next;
                            });

                            onFieldCommit(rowKey, "Downpayment", String(normalizedValue));
                          }}
                          placeholder={String(displayDownpaymentAmount || 0)}
                          inputMode="decimal"
                          disabled={Boolean(installmentDisabled)}
                        />
                        {carryOver.remaining > 0 && normalized.PaymentMode === PAYMENT_MODES.INSTALLMENT ? (
                          <span className="fee-effective-note">
                            Final Downpayment: {currencyFormatter.format(displayDownpaymentAmount)}
                          </span>
                        ) : null}
                        {carryOver.remaining > 0 && normalized.PaymentMode === PAYMENT_MODES.INSTALLMENT ? (
                          <span className="fee-effective-note">
                            {currencyFormatter.format(normalized.Downpayment)} current sem + {currencyFormatter.format(carryOver.remaining)} previous balance
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{renderFeeInput(normalized, rowKey, "Prelim", { disabled: installmentDisabled })}</td>
                    <td>{renderFeeInput(normalized, rowKey, "Midterm", { disabled: installmentDisabled })}</td>
                    <td>{renderFeeInput(normalized, rowKey, "PreFinal", { disabled: installmentDisabled })}</td>
                    <td>{renderFeeInput(normalized, rowKey, "Finals", { disabled: installmentDisabled })}</td>
                    <td>{renderFeeInput(normalized, rowKey, "FullPaymentAmount", { disabled: fullPaymentDisabled })}</td>
                    <td>{renderFeeInput(normalized, rowKey, "TotalBalance", { value: normalized.TotalBalance, readOnly: true })}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="17" className="table-empty-cell">
                  No data uploaded yet. Add a spreadsheet to configure student fee records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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

export default StudentFeeAdminTable;
