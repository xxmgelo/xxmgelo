import React, { useState } from "react";
import "./index.css";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import HomeDashboard from "./components/HomeDashboard";
import UploadSection from "./components/UploadSection";
import StudentFeeTable from "./components/StudentFeeTable";
import ManageStudentTable from "./components/ManageStudentTable";
import PaymentModal from "./components/PaymentModal";
import AddStudentModal from "./components/AddStudentModal";
import { handleFileUpload, handleAddStudent, handleInputChange, INITIAL_STUDENT } from "./utils/handlers";

function App() {
  const [students, setStudents] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [newStudent, setNewStudent] = useState(INITIAL_STUDENT);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const filteredStudents = students.filter((student) =>
    student.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.StudentID?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePaid = (student, period) => {
    setSelectedStudent({ ...student, period });
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedStudent(null);
  };

  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
    setNewStudent(INITIAL_STUDENT);
  };

  return (
    <div className={`dashboard ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <Header darkMode={darkMode} toggleTheme={toggleTheme} />
      <div className="dashboard-container">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="main-content">
      {activeTab === 'home' && (
        <HomeDashboard setActiveTab={setActiveTab} />
      )}

      {activeTab === 'studentFee' && (
        <>
          <UploadSection 
            onFileUpload={(e) => handleFileUpload(e, setStudents)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isManageTab={false}
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
          />
          <ManageStudentTable 
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
        </main>
      </div>
    </div>
  );
}

export default App;
