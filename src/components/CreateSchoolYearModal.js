import React, { useEffect, useMemo, useState } from "react";

const MIN_ALLOWED_START_YEAR = 2025;

const buildSchoolYearLabel = (startYear) => {
  const normalizedStartYear = Number(startYear) || new Date().getFullYear();
  return `${normalizedStartYear}-${normalizedStartYear + 1}`;
};

function CreateSchoolYearModal({
  show,
  onClose,
  onSubmit,
  creating,
  existingSchoolYears = [],
  errorMessage = "",
}) {
  const latestStartYear = useMemo(() => {
    const source = Array.isArray(existingSchoolYears) ? existingSchoolYears : [];
    const validYears = source.map((item) => Number(item?.start_year) || 0).filter((year) => year >= MIN_ALLOWED_START_YEAR);

    if (validYears.length === 0) {
      return MIN_ALLOWED_START_YEAR - 1;
    }

    return validYears.reduce((maxYear, year) => Math.max(maxYear, year), MIN_ALLOWED_START_YEAR);
  }, [existingSchoolYears]);
  const defaultStartYear = Math.max(latestStartYear + 1, MIN_ALLOWED_START_YEAR);
  const [startYear, setStartYear] = useState(defaultStartYear);
  const [importPreviousStudents, setImportPreviousStudents] = useState(true);

  useEffect(() => {
    if (!show) {
      return;
    }

    setStartYear(defaultStartYear);
    setImportPreviousStudents(true);
  }, [defaultStartYear, show]);

  const schoolYearLabel = buildSchoolYearLabel(startYear);
  const helperText = `Only the next up-to-date School Year can be created: ${schoolYearLabel}`;

  if (!show) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal-content add-student-modal school-year-create-modal">
        <h2>Create School Year</h2>
        <div className="form-group">
          <label>School Year</label>
          <input type="text" value={schoolYearLabel} readOnly />
          <p>{helperText}</p>
        </div>
        <div className="form-group">
          <label>Start Year</label>
          <input
            type="number"
            min={defaultStartYear}
            max={defaultStartYear}
            step="1"
            value={startYear}
            onChange={() => setStartYear(defaultStartYear)}
            placeholder="Next available start year"
            readOnly
          />
        </div>
        <div className="form-group">
          <label>Select Year</label>
          <div className="school-year-year-grid">
            <button
              type="button"
              className="school-year-year-tile selected"
              onClick={() => setStartYear(defaultStartYear)}
            >
              {defaultStartYear}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>Student Import</label>
          <select
            value={importPreviousStudents ? "yes" : "no"}
            onChange={(event) => setImportPreviousStudents(event.target.value === "yes")}
          >
            <option value="yes">Create and import from recent school year</option>
            <option value="no">Create empty school year</option>
          </select>
        </div>
        {errorMessage ? <p className="form-field-error school-year-modal-error">{errorMessage}</p> : null}
        <div className="modal-buttons">
          <button
            type="button"
            className="save-btn"
            onClick={() => onSubmit?.({ importPreviousStudents, startYear })}
            disabled={creating}
          >
            {creating ? "Creating..." : "Create"}
          </button>
          <button type="button" className="close-btn" onClick={onClose} disabled={creating}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateSchoolYearModal;
