import React, { useEffect, useState } from "react";
import "./index.css";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import HomeDashboard from "./components/HomeDashboard";
import UploadSection from "./components/UploadSection";
import StudentFeeTable from "./components/StudentFeeTable";
import ManageStudentTable from "./components/ManageStudentTable";
import StudentsTable from "./components/StudentsTable";
import PaymentModal from "./components/PaymentModal";
import AddStudentModal from "./components/AddStudentModal";
import EditStudentModal from "./components/EditStudentModal";
import ConfirmModal from "./components/ConfirmModal";
import { handleFileUpload, handleAddStudent, handleInputChange, INITIAL_STUDENT } from "./utils/handlers";
import { getStudents, deleteStudent, updateStudent } from "./utils/api";

function App() {
  const [students, setStudents] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [newStudent, setNewStudent] = useState(INITIAL_STUDENT);
  const [editStudent, setEditStudent] = useState(null);
  const [confirmState, setConfirmState] = useState({ show: false, type: null, payload: null });
  const [programFilter, setProgramFilter] = useState("");

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await getStudents();
        if (Array.isArray(data)) {
          setStudents(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadStudents();
  }, []);

  const normalizedQuery = searchQuery.toLowerCase();
  const normalizedProgramFilter = programFilter.toLowerCase();

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.Name?.toLowerCase().includes(normalizedQuery) ||
      student.StudentID?.toLowerCase().includes(normalizedQuery);

    const programValue = student.Program?.toLowerCase() || "";
    const matchesProgram = normalizedProgramFilter
      ? programValue.includes(normalizedProgramFilter)
      : true;

    return matchesSearch && matchesProgram;
  });

  const handlePaid = (student) => {
    setSelectedStudent({ ...student, period: "" });
    setShowPaymentModal(true);
  };

  const handleEditStudent = (student) => {
    if (!student) return;
    setEditStudent({ ...student });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditStudent((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editStudent || !editStudent.StudentID) {
      return;
    }

    try {
      const updated = await updateStudent(editStudent);
      setStudents((prev) =>
        prev.map((item) =>
          item.StudentID === updated.StudentID ? updated : item
        )
      );
    } catch (error) {
      console.error(error);
      alert("Update failed. Please try again.");
    }

    setShowEditModal(false);
    setEditStudent(null);
  };

  const executeRemoveSelected = async (selectedStudents) => {
    if (!selectedStudents || selectedStudents.length === 0) {
      return;
    }

    const ids = selectedStudents
      .map((student) => student.StudentID)
      .filter((id) => Boolean(id));

    if (ids.length === 0) {
      return;
    }

    try {
      await Promise.all(ids.map((id) => deleteStudent(id)));
    } catch (error) {
      console.error(error);
      alert("Some deletions failed. Please try again.");
    }

    setStudents((prev) => prev.filter((student) => !ids.includes(student.StudentID)));
  };

  const executeDeleteStudent = async (student) => {
    if (!student || !student.StudentID) {
      return;
    }

    try {
      await deleteStudent(student.StudentID);
      setStudents((prev) => prev.filter((item) => item.StudentID !== student.StudentID));
    } catch (error) {
      console.error(error);
      alert("Delete failed. Please try again.");
    }
  };

  const requestRemoveSelected = (selectedStudents) => {
    if (!selectedStudents || selectedStudents.length === 0) {
      return;
    }
    setConfirmState({
      show: true,
      type: "removeSelected",
      payload: selectedStudents,
    });
  };

  const requestDeleteStudent = (student) => {
    if (!student || !student.StudentID) {
      return;
    }
    setConfirmState({
      show: true,
      type: "deleteSingle",
      payload: student,
    });
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedStudent(null);
  };

  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
    setNewStudent(INITIAL_STUDENT);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditStudent(null);
  };

  const closeConfirmModal = () => {
    setConfirmState({ show: false, type: null, payload: null });
  };

  const confirmAction = async () => {
    if (confirmState.type === "removeSelected") {
      await executeRemoveSelected(confirmState.payload);
    } else if (confirmState.type === "deleteSingle") {
      await executeDeleteStudent(confirmState.payload);
    }
    closeConfirmModal();
  };

  return (
    <div className={`dashboard ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <Header darkMode={darkMode} toggleTheme={toggleTheme} />
      <div className="dashboard-container">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="main-content">
      {activeTab === 'home' && (
        <HomeDashboard setActiveTab={setActiveTab} students={students} />
      )}

      {activeTab === 'studentFee' && (
        <>
          <UploadSection 
            onFileUpload={(e) => handleFileUpload(e, setStudents)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isManageTab={false}
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
          />
          <StudentFeeTable 
            students={students}
            filteredStudents={filteredStudents}
            onPaid={handlePaid}
          />
        </>
      )}

      {activeTab === 'manageStudent' && (
        <>
          <UploadSection 
            onFileUpload={() => {}}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isManageTab={true}
            onAddStudent={() => setShowAddStudentModal(true)}
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
          />
          <ManageStudentTable 
            students={students}
            filteredStudents={filteredStudents}
            onRemoveSelected={requestRemoveSelected}
            onDeleteStudent={requestDeleteStudent}
            onEditStudent={handleEditStudent}
          />
        </>
      )}

      {activeTab === 'students' && (
        <>
          <UploadSection 
            onFileUpload={() => {}}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isManageTab={true}
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
            hideActionButton={true}
            noteText={null}
            showAllFilter={true}
            filtersOnLeft={true}
          />
          <StudentsTable 
            students={students}
            filteredStudents={filteredStudents}
          />
        </>
      )}

      <PaymentModal 
        showPaymentModal={showPaymentModal}
        selectedStudent={selectedStudent}
        onClose={closePaymentModal}
        setSelectedStudent={setSelectedStudent}
      />

      <AddStudentModal 
        showAddStudentModal={showAddStudentModal}
        newStudent={newStudent}
        onClose={closeAddStudentModal}
        onSubmit={(e) => handleAddStudent(e, newStudent, students, setStudents, setShowAddStudentModal, setNewStudent)}
        onInputChange={(e) => handleInputChange(e, newStudent, setNewStudent)}
      />

      <EditStudentModal
        showEditModal={showEditModal}
        editStudent={editStudent}
        onClose={closeEditModal}
        onSubmit={handleUpdateStudent}
        onInputChange={handleEditInputChange}
      />

      <ConfirmModal
        show={confirmState.show}
        message={
          confirmState.type === "removeSelected"
            ? "Are you sure you want to remove the selected students?"
            : "Are you sure you want to delete this student?"
        }
        confirmLabel={confirmState.type === "removeSelected" ? "Remove" : "Delete"}
        cancelLabel="Cancel"
        onConfirm={confirmAction}
        onCancel={closeConfirmModal}
      />
        </main>
      </div>
    </div>
  );
}

export default App;
