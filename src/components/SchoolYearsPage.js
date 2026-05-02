import React, { useState } from "react";
import schoolYearDashboardIcon from "../assets/schoolyeardb.png";
import aclcLogo from "../assets/aclclogo.png";
import { SEMESTER_OPTIONS } from "../utils/semester";

function SchoolYearsPage({
  schoolYears,
  selectedSchoolYearId,
  selectedSemester,
  onSelectSchoolYear,
  onSelectSemester,
  onImportStudents,
  importLoading = false,
  onCreateSchoolYear,
  selectionMode = false,
  selectedSchoolYearIds = [],
  onToggleSelectionMode,
  onToggleSchoolYearSelection,
  onRequestDeleteSelected,
}) {
  const visibleSchoolYears = Array.isArray(schoolYears) ? schoolYears : [];
  const [semesterModalSchoolYear, setSemesterModalSchoolYear] = useState(null);
  const normalizedSelectedIds = Array.isArray(selectedSchoolYearIds) ? selectedSchoolYearIds : [];

  return (
    <section className="school-years-page">
      <div className="school-years-hero">
        <div>
          <span className="section-kicker">School Years</span>
          <h2>Select School Year</h2>
        </div>
        <div className="school-year-hero-actions">
          <button type="button" className="school-year-secondary-btn" onClick={onToggleSelectionMode}>
            {selectionMode ? "Done" : "Select"}
          </button>
          {selectionMode && normalizedSelectedIds.length > 0 ? (
            <button
              type="button"
              className="school-year-danger-btn"
              onClick={onRequestDeleteSelected}
            >
              Remove
            </button>
          ) : null}
          <button type="button" className="school-year-create-btn" onClick={onCreateSchoolYear}>
            Add School Year
          </button>
        </div>
      </div>

      <div className="school-year-card-grid">
        {visibleSchoolYears.map((schoolYear, index) => {
          const isActive = schoolYear.id === selectedSchoolYearId;
          const isSelectedForRemoval = normalizedSelectedIds.includes(schoolYear.id);
          const previousSchoolYear = index > 0 ? visibleSchoolYears[index - 1] : null;
          const canImportPreviousStudents =
            !selectionMode &&
            Boolean(previousSchoolYear?.id) &&
            Number(schoolYear?.student_count || 0) === 0 &&
            typeof onImportStudents === "function";

          return (
            <div
              key={schoolYear.id}
              className={`school-year-card school-year-card-shell${isActive ? " selected" : ""}${isSelectedForRemoval ? " removal-selected" : ""}`}
            >
              {selectionMode ? (
                <label className="school-year-select-toggle">
                  <input
                    type="checkbox"
                    checked={isSelectedForRemoval}
                    onChange={() => onToggleSchoolYearSelection?.(schoolYear)}
                  />
                  <span>Select</span>
                </label>
              ) : null}
              <button
                type="button"
                className="school-year-card-button"
                onClick={() => {
                  if (selectionMode) {
                    onToggleSchoolYearSelection?.(schoolYear);
                    return;
                  }
                  onSelectSchoolYear?.(schoolYear);
                  setSemesterModalSchoolYear(schoolYear);
                }}
              >
                <img
                  src={aclcLogo}
                  alt=""
                  aria-hidden="true"
                  className="school-year-card-peek-logo"
                />
                <img
                  src={schoolYearDashboardIcon}
                  alt="School Year"
                  className="school-year-card-icon"
                />
                <strong>{`School Year ${schoolYear.label}`}</strong>
                <span className="school-year-card-meta">
                  {schoolYear.student_count > 0 ? `${schoolYear.student_count} students` : "No students yet"}
                </span>
                {isActive && selectedSemester ? (
                  <span className="school-year-card-meta">{selectedSemester}</span>
                ) : null}
              </button>
              {canImportPreviousStudents ? (
                <button
                  type="button"
                  className="school-year-import-btn"
                  disabled={importLoading}
                  onClick={() => onImportStudents?.(schoolYear, previousSchoolYear)}
                >
                  {importLoading
                    ? "Importing students..."
                    : `Import Previous Students (${previousSchoolYear.label})`}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {semesterModalSchoolYear ? (
        <div className="modal" onClick={() => setSemesterModalSchoolYear(null)}>
          <div className="modal-content payment-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-title-row">
              <div>
                <h2>Select Semester</h2>
                <p>{`Choose the semester for School Year ${semesterModalSchoolYear.label || ""}.`}</p>
              </div>
            </div>
            <div className="home-card-grid dashboard-shortcut-grid">
              {SEMESTER_OPTIONS.map((semester) => (
                <button
                  key={semester}
                  type="button"
                  className="home-card dashboard-shortcut-card"
                  onClick={() => {
                    onSelectSemester?.(semester);
                    setSemesterModalSchoolYear(null);
                  }}
                >
                  <div className="home-card-top">
                    <img src={schoolYearDashboardIcon} alt={semester} className="home-card-icon" />
                  </div>
                  <span className="home-card-label">{semester}</span>
                </button>
              ))}
            </div>
            <div className="modal-buttons">
              <button className="close-btn" type="button" onClick={() => setSemesterModalSchoolYear(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default SchoolYearsPage;
