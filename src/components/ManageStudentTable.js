import React, { useMemo, useState } from "react";
import deleteIcon from "../assets/delete.png";

function ManageStudentTable({ students, filteredStudents, onRemoveSelected, onDeleteStudent, onEditStudent }) {
  const [selectedRows, setSelectedRows] = useState(new Set());

  const visibleRowKeys = useMemo(
    () =>
      filteredStudents.map((student) => {
        const originalIndex = students.indexOf(student);
        return student.StudentID || `row-${originalIndex}`;
      }),
    [filteredStudents, students]
  );

  const allSelected = visibleRowKeys.length > 0 && selectedRows.size === visibleRowKeys.length;

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
        return new Set();
      }
      return new Set(visibleRowKeys);
    });
  };

  const handleRemoveSelected = () => {
    if (!onRemoveSelected) {
      return;
    }
    const selectedStudents = filteredStudents.filter((student) => {
      const originalIndex = students.indexOf(student);
      const rowKey = student.StudentID || `row-${originalIndex}`;
      return selectedRows.has(rowKey);
    });
    onRemoveSelected(selectedStudents);
  };

  const handleDeleteSingle = (student) => {
    if (!onDeleteStudent) {
      return;
    }
    onDeleteStudent(student);
  };

  const handleEditSingle = (student) => {
    if (!onEditStudent) {
      return;
    }
    onEditStudent(student);
  };

  return (
    <main className="student-dashboard">
      <div className="section-header">
        <div>
          <span className="section-kicker">Record Management</span>
          <h2>Manage Students</h2>
          <p className="section-subtitle">
            Maintain {filteredStudents.length} visible student profiles and keep the roster accurate.
          </p>
        </div>
        <div className="section-actions">
          <div className="section-summary-pill">
            <span>Selected</span>
            <strong>{selectedRows.size}</strong>
          </div>
          {selectedRows.size > 0 && (
            <button className="action-btn delete-btn" onClick={handleRemoveSelected} type="button">
              <img src={deleteIcon} alt="Remove" className="btn-icon" />
              Remove from list
            </button>
          )}
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
                  aria-label="Select all students"
                />
              </th>
              <th>USN #</th>
              <th>Name</th>
              <th>Program/Course</th>
              <th>Year Level</th>
              <th>Gmail</th>
              <th>Actions</th>
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
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit-btn" onClick={() => handleEditSingle(student)}>
                          <img src={require("../assets/edit.png")} alt="Edit" className="btn-icon" />
                          Edit
                        </button>
                        <button className="action-btn delete-btn" onClick={() => handleDeleteSingle(student)}>
                          <img src={require("../assets/delete.png")} alt="Delete" className="btn-icon" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="table-empty-cell">
                  No student records found. Add a student to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default ManageStudentTable;
