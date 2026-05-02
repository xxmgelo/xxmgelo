import { createStudent } from "./api";
import { normalizeStudentFinancials, PAYMENT_MODES } from "./fees";

export const composeStudentName = (student = {}) => {
  const surname = String(student.Surname || "").trim();
  const givenName = String(student.GivenName || "").trim();
  const initial = String(student.Initial || "").trim();

  return [surname, givenName].filter(Boolean).join(", ") + (initial ? ` ${initial}` : "");
};

const INITIAL_STUDENT = {
  StudentID: "",
  Name: "",
  Surname: "",
  GivenName: "",
  Initial: "",
  SchoolYearID: 0,
  Semester: "",
  Program: "",
  YearLevel: "",
  Gmail: "",
  TotalFee: 0,
  BaseTotalFee: 0,
  Discount: 0,
  Downpayment: 0,
  Prelim: 0,
  Midterm: 0,
  PreFinal: 0,
  Finals: 0,
  TotalBalance: 0,
  PaymentMode: PAYMENT_MODES.INSTALLMENT,
  FullPaymentAmount: 0,
  CanRemind: false,
  date_paid: null,
  DatePaid: null,
  downpayment_date: null,
  prelim_date: null,
  midterm_date: null,
  prefinal_date: null,
  final_date: null,
  total_balance_date: null,
};

export const handleAddStudent = async (
  e,
  newStudent,
  students,
  setStudents,
  setShowAddStudentModal,
  setNewStudent,
  setFormError
) => {
  e.preventDefault();
  const composedName = composeStudentName(newStudent);
  if (!newStudent.StudentID || !newStudent.Surname || !newStudent.GivenName || !newStudent.Program) {
    setFormError?.("Please fill in the required fields: USN #, surname, given name, and Program/Course.");
    return;
  }

  const normalizedGmail = String(newStudent.Gmail || "").trim().toLowerCase();
  const normalizedStudentId = String(newStudent.StudentID || "").trim();
  const normalizedSchoolYearId = String(newStudent.SchoolYearID || "").trim();
  const normalizedSemester = String(newStudent.Semester || "").trim().toLowerCase();
  if (
    normalizedGmail &&
    students.some(
      (student) =>
        String(student.Gmail || student.gmail || "").trim().toLowerCase() === normalizedGmail &&
        String(student.SchoolYearID || student.school_year_id || "").trim() === normalizedSchoolYearId &&
        String(student.Semester || student.semester || "").trim().toLowerCase() === normalizedSemester &&
        String(
          student.OriginalStudentID ||
          student.StudentID ||
          student.student_id ||
          ""
        ).trim() !== normalizedStudentId
    )
  ) {
    setFormError?.("This Gmail account is already assigned to another student in the same school year and semester.");
    return;
  }

  try {
    const created = await createStudent(
      normalizeStudentFinancials({
        ...newStudent,
        Name: composedName,
      })
    );
    setStudents([...students, created]);
  } catch (error) {
    console.error(error);
    setFormError?.(error?.message || "Student could not be added.");
    return;
  }

  setFormError?.("");
  setShowAddStudentModal(false);
  setNewStudent({
    ...INITIAL_STUDENT,
    SchoolYearID: newStudent.SchoolYearID || 0,
    Semester: newStudent.Semester || "",
  });
};

export const handleInputChange = (e, newStudent, setNewStudent) => {
  const { name } = e.target;
  const value =
    name === "Initial"
      ? String(e.target.value || "").replace(/[^a-z]/gi, "").slice(0, 1).toUpperCase()
      : e.target.value;
  const nextStudent = { ...newStudent, [name]: value };
  nextStudent.Name = composeStudentName(nextStudent);
  setNewStudent(nextStudent);
};

export { INITIAL_STUDENT };
