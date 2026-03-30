import React from "react";

function StudentsTable({ students, filteredStudents }) {
  return (
    <main className="student-dashboard">
      <div className="section-header">
        <div>
          <span className="section-kicker">Directory</span>
          <h2>Students</h2>
          <p className="section-subtitle">
            Showing {filteredStudents.length} of {students.length} student records.
          </p>
        </div>
        <div className="section-summary-pill">
          <span>Active records</span>
          <strong>{filteredStudents.length}</strong>
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
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => {
                const originalIndex = students.indexOf(student);
                return (
                  <tr key={index}>
                    <td>{originalIndex + 1}</td>
                    <td>{student.StudentID || "N/A"}</td>
                    <td>{student.Name || "N/A"}</td>
                    <td>{student.Program || "N/A"}</td>
                    <td>{student.YearLevel || "N/A"}</td>
                    <td>{student.Gmail || "N/A"}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="table-empty-cell">
                  No student records found. Upload or add students to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default StudentsTable;
