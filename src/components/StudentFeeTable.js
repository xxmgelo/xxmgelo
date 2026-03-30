import React, { useMemo, useState } from "react";
import payIcon from "../assets/pay.png";
import remindIcon from "../assets/reminder.png";

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

function StudentFeeTable({ students, filteredStudents, onPaid }) {
  const [selectedRows, setSelectedRows] = useState(new Set());

  const summary = useMemo(() => {
    return filteredStudents.reduce(
      (totals, student) => {
        const downpayment = parseAmount(student.Downpayment);
        const prelim = parseAmount(student.Prelim);
        const midterm = parseAmount(student.Midterm);
        const preFinal = parseAmount(student.PreFinal);
        const finals = parseAmount(student.Finals);
        const collected = downpayment + prelim + midterm + preFinal + finals;
        const totalFee =
          student.TotalFee !== undefined && student.TotalFee !== null && student.TotalFee !== ""
            ? parseAmount(student.TotalFee)
            : collected;
        const totalBalance =
          student.TotalBalance !== undefined && student.TotalBalance !== null && student.TotalBalance !== ""
            ? parseAmount(student.TotalBalance)
            : Math.max(totalFee - collected, 0);

        totals.collected += collected;
        totals.outstanding += totalBalance;
        if (totalBalance > 0) {
          totals.pending += 1;
        }

        return totals;
      },
      { collected: 0, outstanding: 0, pending: 0 }
    );
  }, [filteredStudents]);

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

  return (
    <main className="student-dashboard">
      <div className="section-header">
        <div>
          <span className="section-kicker">Collections</span>
          <h2>Student Fee Records</h2>
          <p className="section-subtitle">
            Review balances and launch payment actions for {filteredStudents.length} visible students.
          </p>
        </div>
        <div className="section-stat-group">
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
              <th>Select</th>
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => {
                const originalIndex = students.indexOf(student);
                const rowKey = student.StudentID || `row-${originalIndex}`;
                const isSelected = selectedRows.has(rowKey);
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
                  <tr key={rowKey} className={isSelected ? "row-selected" : ""}>
                    <td>{originalIndex + 1}</td>
                    <td>
                      <input
                        type="checkbox"
                        className="checklist-box"
                        checked={isSelected}
                        onChange={() => toggleRow(rowKey)}
                      />
                    </td>
                    <td>{student.StudentID || "N/A"}</td>
                    <td>{student.Name || "N/A"}</td>
                    <td>{student.Program || "N/A"}</td>
                    <td>{student.YearLevel || "N/A"}</td>
                    <td>{student.Gmail || "N/A"}</td>
                    <td>{currencyFormatter.format(totalFee)}</td>
                    <td>{currencyFormatter.format(downpayment)}</td>
                    <td>{currencyFormatter.format(prelim)}</td>
                    <td>{currencyFormatter.format(midterm)}</td>
                    <td>{currencyFormatter.format(preFinal)}</td>
                    <td>{currencyFormatter.format(finals)}</td>
                    <td>
                      <span className={`balance-pill ${totalBalance > 0 ? "due" : "paid"}`}>
                        {currencyFormatter.format(totalBalance)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn pay-btn" onClick={() => onPaid(student)} type="button">
                          <img src={payIcon} alt="Pay" className="btn-icon" />
                          Pay
                        </button>
                        <button className="action-btn remind-btn" type="button">
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
                <td colSpan="15" className="table-empty-cell">
                  No data uploaded yet. Add an Excel file to start managing collections.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default StudentFeeTable;
