export const SEMESTERS = {
  FIRST: "1st Semester",
  SECOND: "2nd Semester",
};

export const SEMESTER_OPTIONS = [SEMESTERS.FIRST, SEMESTERS.SECOND];

export const isSecondSemester = (value) => String(value || "").trim() === SEMESTERS.SECOND;

export const getPreviousSemester = (value) =>
  isSecondSemester(value) ? SEMESTERS.FIRST : "";

export const formatActiveContextLabel = (schoolYearLabel = "", semester = "") =>
  [schoolYearLabel ? `SY ${schoolYearLabel}` : "", semester].filter(Boolean).join(" • ");
