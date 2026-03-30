import React, { useMemo } from "react";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const parseAmount = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

function StudentFeeAdminTable({ students, filteredStudents, onFieldChange }) {
  const formatAmount = (value) => {
    if (value === null || value === undefined || value === "") return "";
    return String(value);
  };

  const summary = useMemo(() => {
    return filteredStudents.reduce(
      (totals, student) => {
        const downpayment = parseAmount(student.Downpayment);
        const prelim = parseAmount(student.Prelim);
        const midterm = parseAmount(student.Midterm);
        const preFinal = parseAmount(student.PreFinal);
        const finals = parseAmount(student.Finals);
        const assigned = downpayment + prelim + midterm + preFinal + finals;
        const totalFee =
          student.TotalFee !== undefined && student.TotalFee !== null && student.TotalFee !== ""
            ? parseAmount(student.TotalFee)
            : assigned;

        totals.totalFee += totalFee;
        totals.assigned += assigned;
        return totals;
      },
      { totalFee: 0, assigned: 0 }
    );
  }, [filteredStudents]);

  const renderFeeInput = (student, rowKey, field, placeholder) => (
    <input
      type="text"
      className="fee-input"
      value={formatAmount(student[field])}
      onChange={(event) => onFieldChange(rowKey, field, event.target.value)}
      placeholder={placeholder || "0"}
      inputMode="decimal"
    />
  );

  return (
    <main className="student-dashboard">
      <div className="section-header">
        <div>
          <span className="section-kicker">Fee Controls</span>
          <h2>Manage Fee</h2>
          <p className="section-subtitle">
            Update payment fields and verify totals for {filteredStudents.length} visible student accounts.
          </p>
        </div>
        <div className="section-stat-group">
          <div className="section-summary-pill">
            <span>Total tuition</span>
            <strong>{currencyFormatter.format(summary.totalFee)}</strong>
          </div>
          <div className="section-summary-pill">
            <span>Assigned payments</span>
            <strong>{currencyFormatter.format(summary.assigned)}</strong>
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
              <th>Total Fee</th>
              <th>Downpayment</th>
              <th>Prelim</th>
              <th>Midterm</th>
              <th>Pre-Final</th>
              <th>Finals</th>
              <th>Total Balance</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => {
                const originalIndex = students.indexOf(student);
                const rowKey = student.StudentID || `row-${originalIndex}`;
                const downpayment = parseAmount(student.Downpayment);
                const prelim = parseAmount(student.Prelim);
                const midterm = parseAmount(student.Midterm);
                const preFinal = parseAmount(student.PreFinal);
                const finals = parseAmount(student.Finals);
                const computedTotalFee = downpayment + prelim + midterm + preFinal + finals;
                const totalFee =
                  student.TotalFee !== undefined && student.TotalFee !== null && student.TotalFee !== ""
                    ? parseAmount(student.TotalFee)
                    : computedTotalFee;
                const totalBalance =
                  student.TotalBalance !== undefined && student.TotalBalance !== null && student.TotalBalance !== ""
                    ? parseAmount(student.TotalBalance)
                    : Math.max(totalFee - computedTotalFee, 0);

                return (
                  <tr key={rowKey}>
                    <td>{originalIndex + 1}</td>
                    <td>{student.StudentID || "N/A"}</td>
                    <td>{student.Name || "N/A"}</td>
                    <td>{student.Program || "N/A"}</td>
                    <td>{student.YearLevel || "N/A"}</td>
                    <td>{student.Gmail || "N/A"}</td>
                    <td>{renderFeeInput(student, rowKey, "TotalFee", String(totalFee))}</td>
                    <td>{renderFeeInput(student, rowKey, "Downpayment")}</td>
                    <td>{renderFeeInput(student, rowKey, "Prelim")}</td>
                    <td>{renderFeeInput(student, rowKey, "Midterm")}</td>
                    <td>{renderFeeInput(student, rowKey, "PreFinal")}</td>
                    <td>{renderFeeInput(student, rowKey, "Finals")}</td>
                    <td>{renderFeeInput(student, rowKey, "TotalBalance", String(totalBalance))}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="13" className="table-empty-cell">
                  No data uploaded yet. Add a spreadsheet to configure student fee records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default StudentFeeAdminTable;
