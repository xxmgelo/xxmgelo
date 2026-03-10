import React from "react";

function ManageStudentTable({ students, filteredStudents }) {
  return (
    <main className="student-dashboard">
      <div className="section-header">
        <h2>Manage Students</h2>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Program/Course</th>
              <th>Year Level</th>
              <th>Gmail</th>
              <th>Section</th>
              <th>Actions</th>
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
                    <td>{student.Section || "N/A"}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit-btn">
                          <img src={require("../assets/edit.png")} alt="Edit" className="btn-icon" />
                          Edit
                        </button>
                        <button className="action-btn delete-btn">
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
                <td colSpan="8">No student records found. Add a student to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default ManageStudentTable;
