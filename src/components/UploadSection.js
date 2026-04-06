import React from "react";
import uploadIcon from "../assets/upload.png";
import searchIcon from "../assets/search.png";
import addIcon from "../assets/add.png";

function UploadSection({
  onFileUpload,
  searchQuery,
  setSearchQuery,
  isManageTab,
  panelVariant,
  sectionTitle,
  onAddStudent,
  programFilter,
  onProgramFilterChange,
  yearFilter,
  onYearFilterChange,
  hideActionButton,
  noteText,
  showAllFilter,
  filtersOnLeft,
}) {
  const sectionClassName = [
    "upload-section",
    isManageTab ? "upload-section-manage" : "",
    panelVariant ? `upload-section-${panelVariant}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const programFilterControls = (
    <div className="tab-strip tab-strip-tight">
      <button
        type="button"
        className={`tab-btn ${programFilter === "BSIS" ? "active" : ""}`}
        onClick={() => onProgramFilterChange("BSIS")}
      >
        BSIS
      </button>
      <button
        type="button"
        className={`tab-btn ${programFilter === "BSE" ? "active" : ""}`}
        onClick={() => onProgramFilterChange("BSE")}
      >
        BSE
      </button>
    </div>
  );

  const yearFilterControls = (
    <div className="tab-strip tab-strip-chrome">
      {["1st", "2nd", "3rd", "4th"].map((year) => (
        <button
          key={year}
          type="button"
          className={`tab-btn ${yearFilter === year ? "active" : ""}`}
          onClick={() => onYearFilterChange(year)}
        >
          {year} Year
        </button>
      ))}
    </div>
  );

  return (
    <section className={sectionClassName}>
      <div className="upload-left">
        {sectionTitle ? (
          <div className="upload-copy">
            <h3>{sectionTitle}</h3>
          </div>
        ) : null}
        {filtersOnLeft && (
          <div className="upload-inline-tools tab-row">
            {yearFilterControls}
            <div className="tab-spacer" />
            {programFilterControls}
          </div>
        )}
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
          {!filtersOnLeft && (
            <div className="upload-inline-tools tab-row">
              {yearFilterControls}
              <div className="tab-spacer" />
              {programFilterControls}
            </div>
          )}
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
