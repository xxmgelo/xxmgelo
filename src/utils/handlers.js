import { createStudent } from "./api";
import { normalizeStudentFinancials, PAYMENT_MODES } from "./fees";

const INITIAL_STUDENT = {
  StudentID: "",
  Name: "",
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
  if (!newStudent.StudentID || !newStudent.Name || !newStudent.Program) {
    setFormError?.("Please fill in the required fields: USN #, Student Name, and Program/Course.");
    return;
  }

  const normalizedGmail = String(newStudent.Gmail || "").trim().toLowerCase();
  if (
    normalizedGmail &&
    students.some(
      (student) => String(student.Gmail || student.gmail || "").trim().toLowerCase() === normalizedGmail
    )
  ) {
    setFormError?.("This Gmail account is already assigned to another student.");
    return;
  }

  try {
    const created = await createStudent(normalizeStudentFinancials(newStudent));
    setStudents([...students, created]);
  } catch (error) {
    console.error(error);
    setFormError?.(error?.message || "Student could not be added.");
    return;
  }

  setFormError?.("");
  setShowAddStudentModal(false);
  setNewStudent(INITIAL_STUDENT);
};

export const handleInputChange = (e, newStudent, setNewStudent) => {
  const { name, value } = e.target;
  setNewStudent({ ...newStudent, [name]: value });
};

export { INITIAL_STUDENT };
