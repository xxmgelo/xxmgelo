import React, { useMemo } from "react";
import { normalizeStudentFinancials, PAYMENT_MODES, getCollectedAmount, getEffectiveTotalFee } from "../utils/fees";
import TablePagination from "./TablePagination";
import useTablePagination from "../hooks/useTablePagination";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function StudentFeeAdminTable({ students, filteredStudents, onFieldChange, onFieldCommit }) {
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
      value={formatAmount(options.value !== undefined ? options.value : student[field])}
      onChange={(event) => onFieldChange(rowKey, field, event.target.value)}
      onBlur={() => onFieldCommit(rowKey)}
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
                const rowKey = student.StudentID || `row-${originalIndex}`;
                const normalized = normalizeStudentFinancials(student);
                const installmentDisabled = normalized.PaymentMode === PAYMENT_MODES.FULL;
                const fullPaymentDisabled = normalized.PaymentMode !== PAYMENT_MODES.FULL;

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
                          value: normalized.BaseTotalFee ?? normalized.TotalFee,
                          placeholder: String(normalized.BaseTotalFee || normalized.TotalFee || 0),
                        })}
                        {Number(normalized.Discount || 0) > 0 ? (
                          <span className="fee-effective-note">
                            Effective: {currencyFormatter.format(getEffectiveTotalFee(normalized))}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{renderFeeInput(normalized, rowKey, "Discount", { placeholder: "0" })}</td>
                    <td>{renderFeeInput(normalized, rowKey, "Downpayment", { disabled: installmentDisabled })}</td>
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
                <td colSpan="16" className="table-empty-cell">
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
