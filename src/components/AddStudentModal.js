import React from "react";

function AddStudentModal({ showAddStudentModal, newStudent, addStudentError, onClose, onSubmit, onInputChange }) {
  if (!showAddStudentModal) return null;

  return (
    <div className="modal">
      <div className="modal-content add-student-modal">
        <h2>Add New Student</h2>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label> USN # *</label>
            <input 
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="StudentID" 
              value={newStudent.StudentID} 
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, "");
                onInputChange({ target: { name: "StudentID", value: digitsOnly } });
              }}
              placeholder="Enter USN #"
              required 
            />
          </div>
          <div className="form-group">
            <label>Student Name *</label>
            <input 
              type="text" 
              name="Name" 
              value={newStudent.Name} 
              onChange={onInputChange}
              placeholder="Enter Student Name"
              required 
            />
          </div>
          <div className="form-group">
            <label>Program/Course *</label>
            <select
              name="Program"
              value={newStudent.Program}
              onChange={onInputChange}
              required
            >
              <option value="">Select Program/Course</option>
              <option value="Bachelor of Science in Information System (BSIS)">
                Bachelor of Science in Information System (BSIS)
              </option>
              <option value="Bachelor of Science in Entrepreneurship (BSE)">
                Bachelor of Science in Entrepreneurship (BSE)
              </option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Year Level</label>
              <select
                name="YearLevel"
                value={newStudent.YearLevel}
                onChange={onInputChange}
              >
                <option value="">Select Year Level</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Gmail</label>
            <input 
              type="email" 
              name="Gmail" 
              value={newStudent.Gmail} 
              onChange={onInputChange}
              placeholder="student@acl.edu.ph"
            />
            {addStudentError ? <p className="form-field-error">{addStudentError}</p> : null}
          </div>
          <div className="modal-buttons">
            <button type="submit" className="save-btn">Add Student</button>
            <button type="button" className="close-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStudentModal;
