import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

function App() {
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Handle Excel Upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Normalize headers to match expected keys
      const normalizedData = jsonData.map((row) => ({
        StudentID: row["Student ID"] || row["ID"] || "",
        Name: row["Name"] || "",
        Program: row["Program/Course"] || row["Program"] || row["Course"] || "",
        YearLevel: row["Year Level"] || row["Year"] || "",
        Section: row["Section"] || "",
        Prelim: row["Prelim"] || 0,
        Midterm: row["Midterm"] || 0,
        PreFinal: row["Pre-Final"] || row["PreFinal"] || 0,
        Finals: row["Finals"] || 0,
      }));

      setStudents(normalizedData);
    };
    reader.readAsArrayBuffer(file);
  };

  // Open modal for Paid action
  const handlePaid = (student, period) => {
    setSelectedStudent({ ...student, period });
    setShowModal(true);
  };

  // Select student via checkbox
  const handleSelectStudent = (student) => {
    alert(`Selected student: ${student.Name || "N/A"}`);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <h1>ACLC Fee Management System</h1>
      </header>

      {/* Upload Section */}
      <section className="upload-section">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="file-input"
        />
        <button className="upload-btn">Uploading</button>
        <p className="note">Upload student fee records for 2nd Semester AY 2025-2026</p>
      </section>

      {/* Student Table */}
      <main className="student-dashboard">
        <h2>Manage Students</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Select</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Program/Course</th>
              <th>Year Level</th>
              <th>Section</th>
              <th>Prelim</th>
              <th>Midterm</th>
              <th>Pre-Final</th>
              <th>Finals</th>
              <th>Paid</th>
              <th>Remind</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      type="checkbox"
                      className="checklist-box"
                      onChange={() => handleSelectStudent(student)}
                    />
                  </td>
                  <td>{student.StudentID || "N/A"}</td>
                  <td>{student.Name || "N/A"}</td>
                  <td>{student.Program || "N/A"}</td>
                  <td>{student.YearLevel || "N/A"}</td>
                  <td>{student.Section || "N/A"}</td>
                  <td>{student.Prelim || "₱0"}</td>
                  <td>{student.Midterm || "₱0"}</td>
                  <td>{student.PreFinal || "₱0"}</td>
                  <td>{student.Finals || "₱0"}</td>
                  <td>
                    <button className="action-btn" onClick={() => handlePaid(student, "Prelim")}>
                      Paid
                    </button>
                  </td>
                  <td>
                    <button className="action-btn">Remind</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="13">No data uploaded — please upload an Excel file.</td>
              </tr>
            )}
          </tbody>
        </table>
      </main>

      {/* Modal for Paid */}
      {showModal && selectedStudent && (
        <div className="modal">
          <div className="modal-content">
            <h2>Payment Details</h2>
            <p><strong>Student ID:</strong> {selectedStudent.StudentID}</p>
            <p><strong>Name:</strong> {selectedStudent.Name}</p>
            <p><strong>Period:</strong> {selectedStudent.period}</p>
            <label>Amount:</label>
            <input type="text" defaultValue={selectedStudent[selectedStudent.period]} />
            <label>Custom Amount:</label>
            <input type="text" />
            <label>OR #:</label>
            <input type="text" />
            <div className="modal-buttons">
              <button className="save-btn">Save</button>
              <button className="close-btn" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
