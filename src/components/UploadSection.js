import React from "react";
import uploadIcon from "../assets/upload.png";
import searchIcon from "../assets/search.png";
import addIcon from "../assets/add.png";

function UploadSection({
  onFileUpload,
  searchQuery,
  setSearchQuery,
  isManageTab,
  sectionTitle,
  onAddStudent,
  programFilter,
  onProgramFilterChange,
  hideActionButton,
  noteText,
  showAllFilter,
  filtersOnLeft,
}) {
  const programFilterControls = (
    <div className="program-filter">
      {showAllFilter && (
        <button
          type="button"
          className={`filter-btn ${programFilter === "" ? "active" : ""}`}
          onClick={() => onProgramFilterChange("")}
        >
          All Students
        </button>
      )}
      <button
        type="button"
        className={`filter-btn ${programFilter === "BSIS" ? "active" : ""}`}
        onClick={() => onProgramFilterChange("BSIS")}
      >
        BSIS
      </button>
      <button
        type="button"
        className={`filter-btn ${programFilter === "BSE" ? "active" : ""}`}
        onClick={() => onProgramFilterChange("BSE")}
      >
        BSE
      </button>
    </div>
  );

  return (
    <section className="upload-section">
      <div className="upload-left">
        <div className="upload-copy">
          <span className="section-kicker">Workspace Tools</span>
          <h3>{sectionTitle || "Actions"}</h3>
        </div>
        {filtersOnLeft && <div className="upload-inline-tools">{programFilterControls}</div>}
      </div>
      <div className="upload-right">
        <div className="upload-controls">
          {!hideActionButton && (
            <div className="upload-action-cluster">
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
                <button className="add-student-btn" onClick={onAddStudent} type="button">
                  <img src={addIcon} alt="Add" className="btn-icon" />
                  Add Student
                </button>
              )}
            </div>
          )}
          {!filtersOnLeft && programFilterControls}
        </div>
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
