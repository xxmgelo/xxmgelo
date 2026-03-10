import React from "react";

function PaymentModal({ showPaymentModal, selectedStudent, onClose, setSelectedStudent }) {
  if (!showPaymentModal || !selectedStudent) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Payment Details</h2>
        <p><strong>Student ID:</strong> {selectedStudent.StudentID}</p>
        <p><strong>Name:</strong> {selectedStudent.Name}</p>
        <div className="form-group">
          <label>Period:</label>
          <select 
            className="period-select"
            value={selectedStudent.period}
            onChange={(e) => setSelectedStudent({...selectedStudent, period: e.target.value})}
          >
            <option value="Prelim">Prelim</option>
            <option value="Midterm">Midterm</option>
            <option value="PreFinal">Pre-Final</option>
            <option value="Finals">Finals</option>
          </select>
        </div>
        <div className="form-group">
          <label>Amount:</label>
          <input type="text" defaultValue={selectedStudent[selectedStudent.period] || 0} />
        </div>
        <div className="form-group">
          <label>Payment Amount:</label>
          <input type="text" placeholder="Enter payment amount" />
        </div>
        <div className="form-group">
          <label>OR #:</label>
          <input type="text" />
        </div>
        <div className="modal-buttons">
          <button className="save-btn">Save</button>
          <button className="close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
