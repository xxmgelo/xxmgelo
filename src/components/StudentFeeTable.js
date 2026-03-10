import React, { useState } from "react";
import payIcon from "../assets/pay.png";
import remindIcon from "../assets/reminder.png";

function StudentFeeTable({ students, filteredStudents, onPaid }) {
  const [selectedRows, setSelectedRows] = useState(new Set());

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
        <h2>BSIS Student Fee Records</h2>
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
              <th>Downpayment</th>
              <th>Prelim</th>
              <th>Midterm</th>
              <th>Pre-Final</th>
              <th>Finals</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => {
                const originalIndex = students.indexOf(student);
                const rowKey = student.StudentID || `row-${originalIndex}`;
                const isSelected = selectedRows.has(rowKey);
                return (
                  <tr key={index} className={isSelected ? "row-selected" : ""}>
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
                    <td>₱{student.Downpayment || "0"}</td>
                    <td>₱{student.Prelim || "0"}</td>
                    <td>₱{student.Midterm || "0"}</td>
                    <td>₱{student.PreFinal || "0"}</td>
                    <td>₱{student.Finals || "0"}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn pay-btn" onClick={() => onPaid(student)}>
                          <img src={payIcon} alt="Pay" className="btn-icon" />
                          Pay
                        </button>
                        <button className="action-btn remind-btn">
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
                <td colSpan="12">No data uploaded — please upload an Excel file.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default StudentFeeTable;
