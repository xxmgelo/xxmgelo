import * as XLSX from "xlsx";
import { createStudent, upsertStudents } from "./api";
import { normalizeStudentFinancials, PAYMENT_MODES } from "./fees";

const INITIAL_STUDENT = {
  StudentID: "",
  Name: "",
  Program: "",
  YearLevel: "",
  Gmail: "",
  TotalFee: 0,
  Downpayment: 0,
  Prelim: 0,
  Midterm: 0,
  PreFinal: 0,
  Finals: 0,
  TotalBalance: 0,
  PaymentMode: PAYMENT_MODES.INSTALLMENT,
  FullPaymentAmount: 0,
};

export const handleFileUpload = (event, setStudents) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const normalizedData = jsonData.map((row) => ({
      StudentID: row["Student ID"] || row.ID || row.StudentID || "",
      Name: row.Name || "",
      Program: row["Program/Course"] || row.Program || row.Course || "",
      YearLevel: row["Year Level"] || row.Year || row.YearLevel || "",
      Gmail: row.Gmail || row.Email || "",
      TotalFee: row["Total Fee"] ?? row.total_fee ?? row.TotalFee ?? 0,
      Downpayment: row.Downpayment ?? row.downpayment ?? 0,
      Prelim: row.Prelim ?? row.prelim ?? 0,
      Midterm: row.Midterm ?? row.midterm ?? 0,
      PreFinal: row["Pre-Final"] ?? row.PreFinal ?? row.pre_final ?? 0,
      Finals: row.Finals ?? row.finals ?? 0,
      TotalBalance: row["Total Balance"] ?? row.TotalBalance ?? row.total_balance ?? 0,
      PaymentMode: row["Payment Mode"] ?? row.PaymentMode ?? row.payment_mode ?? PAYMENT_MODES.INSTALLMENT,
      FullPaymentAmount: row["Full Payment Amount"] ?? row.FullPaymentAmount ?? row.full_payment_amount ?? 0,
    })).map((student) => normalizeStudentFinancials(student));

    try {
      const saved = await upsertStudents(normalizedData);
      if (Array.isArray(saved)) {
        setStudents(saved);
      } else {
        setStudents(normalizedData);
      }
    } catch (error) {
      console.error(error);
      alert("Upload saved locally only. API not reachable.");
      setStudents(normalizedData);
    }
  };
  reader.readAsArrayBuffer(file);
};

export const handleAddStudent = async (
  e,
  newStudent,
  students,
  setStudents,
  setShowAddStudentModal,
  setNewStudent
) => {
  e.preventDefault();
  if (!newStudent.StudentID || !newStudent.Name) {
    alert("Please fill in required fields");
    return;
  }

  try {
    const created = await createStudent(normalizeStudentFinancials(newStudent));
    setStudents([...students, created]);
  } catch (error) {
    console.error(error);
    alert("Saved locally only. API not reachable.");
    setStudents([...students, normalizeStudentFinancials(newStudent)]);
  }

  setShowAddStudentModal(false);
  setNewStudent(INITIAL_STUDENT);
};

export const handleInputChange = (e, newStudent, setNewStudent) => {
  const { name, value } = e.target;
  setNewStudent({ ...newStudent, [name]: value });
};

export { INITIAL_STUDENT };
