import * as XLSX from "xlsx";

const INITIAL_STUDENT = {
  StudentID: "",
  Name: "",
  Program: "",
  YearLevel: "",
  Section: "",
  Gmail: "",
  Prelim: 0,
  Midterm: 0,
  PreFinal: 0,
  Finals: 0
};

export const handleFileUpload = (event, setStudents) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const normalizedData = jsonData.map((row) => ({
      StudentID: row["Student ID"] || row["ID"] || "",
      Name: row["Name"] || "",
      Program: row["Program/Course"] || row["Program"] || row["Course"] || "",
      YearLevel: row["Year Level"] || row["Year"] || "",
      Section: row["Section"] || "",
      Gmail: row["Gmail"] || row["Email"] || "",
      Prelim: row["Prelim"] || 0,
      Midterm: row["Midterm"] || 0,
      PreFinal: row["Pre-Final"] || row["PreFinal"] || 0,
      Finals: row["Finals"] || 0,
    }));

    setStudents(normalizedData);
  };
  reader.readAsArrayBuffer(file);
};

export const handleAddStudent = (e, newStudent, students, setStudents, setShowAddStudentModal, setNewStudent) => {
  e.preventDefault();
  if (!newStudent.StudentID || !newStudent.Name) {
    alert("Please fill in required fields");
    return;
  }
  setStudents([...students, newStudent]);
  setShowAddStudentModal(false);
  setNewStudent(INITIAL_STUDENT);
};

export const handleInputChange = (e, newStudent, setNewStudent) => {
  const { name, value } = e.target;
  setNewStudent({ ...newStudent, [name]: value });
};

export { INITIAL_STUDENT };
 