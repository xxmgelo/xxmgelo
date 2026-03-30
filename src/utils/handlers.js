import * as XLSX from "xlsx";
import { createStudent, upsertStudents } from "./api";

const INITIAL_STUDENT = {
  StudentID: "",
  Name: "",
  Program: "",
  YearLevel: "",
  Gmail: "",
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
      StudentID: row["Student ID"] || row.ID || "",
      Name: row.Name || "",
      Program: row["Program/Course"] || row.Program || row.Course || "",
      YearLevel: row["Year Level"] || row.Year || "",
      Gmail: row.Gmail || row.Email || "",
    }));

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
    const created = await createStudent(newStudent);
    setStudents([...students, created]);
  } catch (error) {
    console.error(error);
    alert("Saved locally only. API not reachable.");
    setStudents([...students, newStudent]);
  }

  setShowAddStudentModal(false);
  setNewStudent(INITIAL_STUDENT);
};

export const handleInputChange = (e, newStudent, setNewStudent) => {
  const { name, value } = e.target;
  setNewStudent({ ...newStudent, [name]: value });
};

export { INITIAL_STUDENT };
