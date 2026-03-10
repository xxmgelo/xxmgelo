import React from "react";

function AddStudentModal({ showAddStudentModal, newStudent, onClose, onSubmit, onInputChange }) {
  if (!showAddStudentModal) return null;

  return (
    <div className="modal">
      <div className="modal-content add-student-modal">
        <h2>Add New Student</h2>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Student ID *</label>
            <input 
              type="text" 
              name="StudentID" 
              value={newStudent.StudentID} 
              onChange={onInputChange}
              placeholder="Enter Student ID"
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
            <label>Program/Course</label>
            <input 
              type="text" 
              name="Program" 
              value={newStudent.Program} 
              onChange={onInputChange}
              placeholder="Enter Program/Course"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Year Level</label>
              <input 
                type="text" 
                name="YearLevel" 
                value={newStudent.YearLevel} 
                onChange={onInputChange}
                placeholder="Enter Year Level"
              />
            </div>
            <div className="form-group">
              <label>Section</label>
              <input 
                type="text" 
                name="Section" 
                value={newStudent.Section} 
                onChange={onInputChange}
                placeholder="Enter Section"
              />
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
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Prelim Fee</label>
              <input 
                type="number" 
                name="Prelim" 
                value={newStudent.Prelim} 
                onChange={onInputChange}
              />
            </div>
            <div className="form-group">
              <label>Midterm Fee</label>
              <input 
                type="number" 
                name="Midterm" 
                value={newStudent.Midterm} 
                onChange={onInputChange}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Pre-Final Fee</label>
              <input 
                type="number" 
                name="PreFinal" 
                value={newStudent.PreFinal} 
                onChange={onInputChange}
              />
            </div>
            <div className="form-group">
              <label>Finals Fee</label>
              <input 
                type="number" 
                name="Finals" 
                value={newStudent.Finals} 
                onChange={onInputChange}
              />
            </div>
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
