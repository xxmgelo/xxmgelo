import React from "react";
import TablePagination from "./TablePagination";
import useTablePagination from "../hooks/useTablePagination";

function StudentsTable({ students, filteredStudents }) {
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    totalItems,
    rangeStart,
    rangeEnd,
  } = useTablePagination(filteredStudents, 10);

  return (
    <main className="student-dashboard">
      <div className="section-header">
        <div>
          <h2>Students</h2>
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
              paginatedItems.map((student, index) => {
                const originalIndex = students.indexOf(student);
                return (
                  <tr key={student.StudentID || `${student.Name}-${originalIndex}`}>
                    <td>{rangeStart + index}</td>
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

export default StudentsTable;
