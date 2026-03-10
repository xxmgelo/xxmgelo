import React from "react";
import uploadIcon from "../assets/upload.png";
import searchIcon from "../assets/search.png";
import addIcon from "../assets/add.png";

function UploadSection({ onFileUpload, searchQuery, setSearchQuery, isManageTab, onAddStudent }) {
  return (
    <section className="upload-section">
      <div className="upload-left">
        {!isManageTab ? (
          <label className="upload-btn">
            <img src={uploadIcon} alt="Upload" className="btn-icon" />
            Upload File
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={onFileUpload}
              className="file-input"
              hidden
            />
          </label>
        ) : (
          <button className="add-student-btn" onClick={onAddStudent}>
            <img src={addIcon} alt="Add" className="btn-icon" />
            Add Student
          </button>
        )}
        <p className="note">
          {isManageTab 
            ? "Manage student records manually" 
            : "Upload student fee records for 2nd Semester AY 2025-2026"}
        </p>
      </div>
      <div className="upload-right">
        <div className="search-box">
          <img src={searchIcon} alt="Search" className="search-icon-img" />
          <input
            type="text"
            placeholder="Search student name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
    </section>
  );
}

export default UploadSection;
