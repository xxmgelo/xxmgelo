import React, { useCallback, useEffect, useState } from "react";
import "./index.css";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import HomeDashboard from "./components/HomeDashboard";
import UploadSection from "./components/UploadSection";
import StudentFeeTable from "./components/StudentFeeTable";
import StudentFeeAdminTable from "./components/StudentFeeAdminTable";
import ManageStudentTable from "./components/ManageStudentTable";
import StudentsTable from "./components/StudentsTable";
import PaymentModal from "./components/PaymentModal";
import AddStudentModal from "./components/AddStudentModal";
import EditStudentModal from "./components/EditStudentModal";
import ConfirmModal from "./components/ConfirmModal";
import LoginPage from "./components/LoginPage";
import AdminSettingsPage from "./components/AdminSettingsPage";
import mainAdminAvatar from "./assets/admin.png";
import assistantAdminAvatar from "./assets/administrator.png";
import { handleFileUpload, handleAddStudent, handleInputChange, INITIAL_STUDENT } from "./utils/handlers";
import {
  getStudents,
  deleteStudent,
  updateStudent,
  adminLogin,
  updateAdminProfile,
  updateAdminPassword,
} from "./utils/api";

const AUTH_STORAGE_KEY = "aclc_admin_session";
const ASSISTANT_ADMIN_USERNAME = "assistantadmin";
const THEME_STORAGE_KEY = "aclc_theme_preferences";
const PALETTE_COLORS = new Set(["#2B2D42", "#8D99AE", "#EDF2F4", "#EF233C", "#D90429"]);

const DEFAULT_THEME = {
  start: "#8D99AE",
  end: "#2B2D42",
};

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
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [themePrefs, setThemePrefs] = useState(DEFAULT_THEME);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const hexToRgb = useCallback((hex) => {
    const normalized = hex.replace("#", "");
    if (normalized.length !== 6) {
      return null;
    }
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return Number.isNaN(r) ? null : `${r}, ${g}, ${b}`;
  }, []);

  const applyThemeColors = useCallback((prefs) => {
    if (!prefs || !prefs.start || !prefs.end) {
      return;
    }

    const root = document.documentElement;
    root.style.setProperty("--accent-primary", prefs.start);
    root.style.setProperty("--accent-secondary", prefs.end);

    const primaryRgb = hexToRgb(prefs.start);
    const secondaryRgb = hexToRgb(prefs.end);
    if (primaryRgb) {
      root.style.setProperty("--accent-primary-rgb", primaryRgb);
      root.style.setProperty("--accent-success", prefs.start);
      root.style.setProperty("--accent-success-rgb", primaryRgb);
    }
    if (secondaryRgb) {
      root.style.setProperty("--accent-secondary-rgb", secondaryRgb);
    }
  }, [hexToRgb]);

  const normalizeThemePrefs = useCallback((prefs) => {
    if (!prefs || !prefs.start || !prefs.end) {
      return DEFAULT_THEME;
    }

    const start = String(prefs.start).toUpperCase();
    const end = String(prefs.end).toUpperCase();

    if (!PALETTE_COLORS.has(start) || !PALETTE_COLORS.has(end)) {
      return DEFAULT_THEME;
    }

    return { start, end };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.name) {
        setAuthUser(parsed);
      }
    } catch (error) {
      console.warn("Failed to parse stored session.", error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (!storedTheme) {
      applyThemeColors(DEFAULT_THEME);
      return;
    }

    try {
      const parsed = JSON.parse(storedTheme);
      const normalized = normalizeThemePrefs(parsed);
      setThemePrefs(normalized);
      applyThemeColors(normalized);
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.warn("Failed to parse stored theme preferences.", error);
      applyThemeColors(DEFAULT_THEME);
    }
  }, [applyThemeColors, normalizeThemePrefs]);

  useEffect(() => {
    applyThemeColors(themePrefs);
  }, [themePrefs, applyThemeColors]);

  useEffect(() => {
    if (!authUser) {
      return;
    }

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
  }, [authUser]);

  const handleLogin = async ({ identifier, password }) => {
    setAuthError("");
    setAuthLoading(true);

    const normalizedIdentifier = identifier.trim();
    const normalizedPassword = password.trim();

    try {
      const result = await adminLogin(normalizedIdentifier, normalizedPassword);
      const admin = result && result.admin ? result.admin : null;

      if (!admin) {
        throw new Error("Invalid credentials. Please try again.");
      }

      const session = {
        id: admin.id || null,
        name: admin.full_name || admin.username || normalizedIdentifier,
        fullName: admin.full_name || "",
        role: admin.role || "admin",
        avatar: admin.username === ASSISTANT_ADMIN_USERNAME ? "assistant" : "main",
        avatarUrl: admin.avatar || "",
        username: admin.username,
        email: admin.email || "",
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      setAuthUser(session);
      setActiveTab("home");
    } catch (error) {
      const message =
        error && error.message
          ? error.message
          : "Login failed. Please try again.";
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthUser(null);
    setStudents([]);
    setSearchQuery("");
    setProgramFilter("");
    setActiveTab("home");
  };

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

  const handleFeeFieldChange = (rowKey, field, value) => {
    setStudents((prev) =>
      prev.map((student, index) => {
        const key = student.StudentID || `row-${index}`;
        if (key !== rowKey) return student;
        return { ...student, [field]: value };
      })
    );
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

  const handleUpdateAdminProfile = async (payload) => {
    if (!authUser) {
      throw new Error("No active admin session.");
    }

    const response = await updateAdminProfile({
      id: authUser.id,
      full_name: payload.full_name,
      username: payload.username,
      avatar: payload.avatar,
    });

    const updatedAdmin = response && response.admin ? response.admin : null;
    const nextSession = {
      ...authUser,
      name: updatedAdmin?.full_name || payload.full_name || authUser.name,
      fullName: updatedAdmin?.full_name || payload.full_name || authUser.fullName,
      username: updatedAdmin?.username || payload.username || authUser.username,
      avatarUrl: updatedAdmin?.avatar || payload.avatar || authUser.avatarUrl,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    setAuthUser(nextSession);
    return nextSession;
  };

  const handleUpdateAdminPassword = async (payload) => {
    if (!authUser) {
      throw new Error("No active admin session.");
    }

    await updateAdminPassword({
      id: authUser.id,
      username: authUser.username,
      current_password: payload.current_password,
      new_password: payload.new_password,
    });
  };

  const handleSavePreferences = async (prefs) => {
    const nextPrefs = normalizeThemePrefs({
      start: prefs.start,
      end: prefs.end,
    });
    setThemePrefs(nextPrefs);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(nextPrefs));
  };

  const confirmAction = async () => {
    if (confirmState.type === "removeSelected") {
      await executeRemoveSelected(confirmState.payload);
    } else if (confirmState.type === "deleteSingle") {
      await executeDeleteStudent(confirmState.payload);
    }
    closeConfirmModal();
  };

  if (!authUser) {
    return (
      <div className={`dashboard login-view ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <LoginPage onLogin={handleLogin} loading={authLoading} error={authError} />
      </div>
    );
  }

  return (
    <div className={`dashboard ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <Header darkMode={darkMode} toggleTheme={toggleTheme} />
      <div className="dashboard-container">
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          userName={authUser?.name}
          userAvatar={
            authUser?.avatarUrl
              ? authUser.avatarUrl
              : authUser?.avatar === "assistant"
                ? assistantAdminAvatar
                : mainAdminAvatar
          }
        />
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

      {activeTab === 'manageFee' && (
        <>
          <UploadSection 
            onFileUpload={(e) => handleFileUpload(e, setStudents)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isManageTab={true}
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
            hideActionButton={true}
            noteText="Manage Total Fee and payment fields for each student"
          />
          <StudentFeeAdminTable 
            students={students}
            filteredStudents={filteredStudents}
            onFieldChange={handleFeeFieldChange}
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

      {activeTab === 'adminSettings' && (
        <AdminSettingsPage
          admin={authUser}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          themeColors={themePrefs}
          onSavePreferences={handleSavePreferences}
          onUpdateProfile={handleUpdateAdminProfile}
          onUpdatePassword={handleUpdateAdminPassword}
        />
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
