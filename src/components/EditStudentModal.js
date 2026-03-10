import React from "react";

function EditStudentModal({ showEditModal, editStudent, onClose, onSubmit, onInputChange }) {
  if (!showEditModal || !editStudent) return null;

  return (
    <div className="modal">
      <div className="modal-content add-student-modal">
        <h2>Edit Student</h2>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>USN #</label>
            <input
              type="text"
              name="StudentID"
              value={editStudent.StudentID}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Student Name *</label>
            <input
              type="text"
              name="Name"
              value={editStudent.Name}
              onChange={onInputChange}
              placeholder="Enter Student Name"
              required
            />
          </div>
          <div className="form-group">
            <label>Program/Course</label>
            <select
              name="Program"
              value={editStudent.Program}
              onChange={onInputChange}
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
                value={editStudent.YearLevel}
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
              value={editStudent.Gmail}
              onChange={onInputChange}
              placeholder="student@acl.edu.ph"
            />
          </div>
          <div className="modal-buttons">
            <button type="submit" className="save-btn">Save Changes</button>
            <button type="button" className="close-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditStudentModal;
