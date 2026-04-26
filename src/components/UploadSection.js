import React from "react";
import searchIcon from "../assets/search.png";
import addIcon from "../assets/add.png";

function UploadSection({
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
              {isManageTab ? (
                <button className="add-student-btn" onClick={onAddStudent} type="button">
                  <img src={addIcon} alt="Add" className="btn-icon" />
                  Add Student
                </button>
              ) : null}
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
