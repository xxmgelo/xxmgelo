import React, { useCallback, useEffect, useState } from "react";
import "./index.css";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import HomeDashboard from "./components/HomeDashboard";
import AnalyticsReports from "./components/AnalyticsReports";
import UploadSection from "./components/UploadSection";
import StudentFeeTable from "./components/StudentFeeTable";
import StudentFeeAdminTable from "./components/StudentFeeAdminTable";
import ManageStudentTable from "./components/ManageStudentTable";
import StudentsTable from "./components/StudentsTable";
import PaymentModal from "./components/PaymentModal";
import ReminderModal from "./components/ReminderModal";
import AddStudentModal from "./components/AddStudentModal";
import EditStudentModal from "./components/EditStudentModal";
import ConfirmModal from "./components/ConfirmModal";
import LoginPage from "./components/LoginPage";
import AdminSettingsPage from "./components/AdminSettingsPage";
import mainAdminAvatar from "./assets/admin.png";
import assistantAdminAvatar from "./assets/administrator.png";
import { handleFileUpload, handleAddStudent, handleInputChange, INITIAL_STUDENT } from "./utils/handlers";
import { applyFeeFieldChange, normalizeStudentFinancials } from "./utils/fees";
import {
  getStudents,
  deleteStudent,
  updateStudent,
  adminLogin,
  updateAdminProfile,
  updateAdminPassword,
  sendPaymentReminder,
} from "./utils/api";

const AUTH_STORAGE_KEY = "aclc_admin_session";
const ASSISTANT_ADMIN_USERNAME = "assistantadmin";
const THEME_STORAGE_KEY = "aclc_theme_preferences";
const DARK_MODE_STORAGE_KEY = "aclc_dark_mode";
const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;

const DEFAULT_THEME = {
  start: "#007877",
  end: "#007877",
};

const VIEW_META = {
  home: {
    title: "Operations Dashboard",
    description: "Monitor collections, student records, and the next high-impact action from one workspace.",
  },
  studentFee: {
    title: "Collection Desk",
    description: "Review balances, search students quickly, and move payment processing forward with less friction.",
  },
  manageStudent: {
    title: "Student Records",
    description: "Add, update, and clean student information in a structured, low-error workflow.",
  },
  manageFee: {
    title: "Fee Configuration",
    description: "Adjust tuition breakdowns and keep every fee record accurate before collection time.",
  },
  students: {
    title: "Student Directory",
    description: "Scan the full roster, filter by program, and verify student details in seconds.",
  },
  analytics: {
    title: "Analytics & Reports",
    description: "Track collections, payment status, enrollment mix, and balance trends with professional summaries.",
  },
  adminSettings: {
    title: "Admin Settings",
    description: "Manage your profile, security, and interface preferences in one place.",
  },
};

function App() {
  const [students, setStudents] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedReminderStudent, setSelectedReminderStudent] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(false);
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
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem(DARK_MODE_STORAGE_KEY, JSON.stringify(newMode));
      return newMode;
    });
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
    root.style.setProperty("--accent-secondary", prefs.start);
    root.style.setProperty("--accent-tertiary", prefs.start);

    const primaryRgb = hexToRgb(prefs.start);
    if (primaryRgb) {
      root.style.setProperty("--accent-primary-rgb", primaryRgb);
      root.style.setProperty("--accent-secondary-rgb", primaryRgb);
      root.style.setProperty("--accent-success", prefs.start);
      root.style.setProperty("--accent-success-rgb", primaryRgb);
    }
  }, [hexToRgb]);

  const normalizeThemePrefs = useCallback((prefs) => {
    if (!prefs || !prefs.start) {
      return DEFAULT_THEME;
    }

    const start = String(prefs.start).toUpperCase();
    const end = prefs.end ? String(prefs.end).toUpperCase() : start;

    if (!HEX_COLOR_PATTERN.test(start) || !HEX_COLOR_PATTERN.test(end)) {
      return DEFAULT_THEME;
    }

    return { start, end: start };
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
    const storedDarkMode = localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (storedDarkMode !== null) {
      try {
        const isDarkMode = JSON.parse(storedDarkMode);
        setDarkMode(isDarkMode);
      } catch (error) {
        console.warn("Failed to parse stored dark mode preference.", error);
      }
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark-mode");
    } else {
      root.classList.remove("dark-mode");
    }
  }, [darkMode]);

  useEffect(() => {
    const preventZoom = (e) => {
      // Prevent Ctrl/Cmd + Plus (=)
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
      }
      // Prevent Ctrl/Cmd + Minus (-)
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
      }
      // Prevent Ctrl/Cmd + 0
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', preventZoom);
    
    // Prevent mouse wheel zoom (Ctrl + Scroll)
    const preventMouseWheelZoom = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', preventMouseWheelZoom, { passive: false });

    return () => {
      window.removeEventListener('keydown', preventZoom);
      window.removeEventListener('wheel', preventMouseWheelZoom);
    };
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
          setStudents(data.map((student) => normalizeStudentFinancials(student)));
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
  const activeView = VIEW_META[activeTab] || VIEW_META.home;

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
    setSelectedStudent(normalizeStudentFinancials(student));
    setShowPaymentModal(true);
  };

  const handleEditStudent = (student) => {
    if (!student) return;
    setEditStudent({ ...student });
    setShowEditModal(true);
  };

  const handleRemind = (student) => {
    setSelectedReminderStudent(normalizeStudentFinancials(student));
    setShowReminderModal(true);
  };

  const handleFeeFieldChange = (rowKey, field, value) => {
    setStudents((prev) =>
      prev.map((student, index) => {
        const key = student.StudentID || `row-${index}`;
        if (key !== rowKey) return student;
        return applyFeeFieldChange(student, field, value);
      })
    );
  };

  const handleFeeFieldCommit = async (rowKey) => {
    const studentToSave = students.find((student, index) => {
      const key = student.StudentID || `row-${index}`;
      return key === rowKey;
    });

    if (!studentToSave || !studentToSave.StudentID) {
      return;
    }

    try {
      const updated = normalizeStudentFinancials(await updateStudent(studentToSave));
      setStudents((prev) =>
        prev.map((item) =>
          item.StudentID === updated.StudentID ? updated : item
        )
      );
    } catch (error) {
      console.error(error);
      alert(error?.message || "Fee update failed. Please try again.");
    }
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
      const updated = normalizeStudentFinancials(await updateStudent(editStudent));
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

  const closeReminderModal = () => {
    if (sendingReminder) {
      return;
    }

    setShowReminderModal(false);
    setSelectedReminderStudent(null);
  };

  const handleSavePayment = async (updatedStudent) => {
    if (!updatedStudent || !updatedStudent.StudentID) {
      return;
    }

    try {
      const savedStudent = normalizeStudentFinancials(await updateStudent(updatedStudent));
      setStudents((prev) =>
        prev.map((student) =>
          student.StudentID === savedStudent.StudentID ? savedStudent : student
        )
      );
      closePaymentModal();
    } catch (error) {
      console.error(error);
      alert("Payment could not be saved. Please try again.");
    }
  };

  const handleSendReminder = async (payload) => {
    setSendingReminder(true);

    try {
      await sendPaymentReminder(payload);
      alert(`Reminder email sent to ${payload.Gmail}.`);
      setShowReminderModal(false);
      setSelectedReminderStudent(null);
    } catch (error) {
      console.error(error);
      alert(error.message || "Reminder email could not be sent.");
    } finally {
      setSendingReminder(false);
    }
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
      end: prefs.start,
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
      <Header
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        viewTitle={activeView.title}
        viewDescription={activeView.description}
        userName={authUser?.name}
        studentCount={students.length}
      />
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
            sectionTitle="Payment Queue"
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
            noteText="Upload records, search by student, and process collections with fewer clicks."
          />
          <StudentFeeTable 
            students={students}
            filteredStudents={filteredStudents}
            onPaid={handlePaid}
            onRemind={handleRemind}
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
            sectionTitle="Student Record Actions"
            onAddStudent={() => setShowAddStudentModal(true)}
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
            noteText="Keep the roster current by adding, editing, or removing records from one workspace."
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
            sectionTitle="Fee Structure Controls"
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
            hideActionButton={true}
            noteText="Review payment fields and tune the fee structure before posting or collecting balances."
          />
          <StudentFeeAdminTable 
            students={students}
            filteredStudents={filteredStudents}
            onFieldChange={handleFeeFieldChange}
            onFieldCommit={handleFeeFieldCommit}
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
            sectionTitle="Student Directory"
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
            hideActionButton={true}
            noteText="Browse the full student list, confirm enrollment data, and narrow results by program."
            showAllFilter={true}
            filtersOnLeft={true}
          />
          <StudentsTable 
            students={students}
            filteredStudents={filteredStudents}
          />
        </>
      )}

      {activeTab === 'analytics' && (
        <AnalyticsReports students={students} />
      )}

      {activeTab === 'adminSettings' && (
        <AdminSettingsPage
          admin={authUser}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          themeColors={themePrefs}
          defaultTheme={DEFAULT_THEME}
          onSavePreferences={handleSavePreferences}
          onUpdateProfile={handleUpdateAdminProfile}
          onUpdatePassword={handleUpdateAdminPassword}
        />
      )}


      <PaymentModal 
        showPaymentModal={showPaymentModal}
        selectedStudent={selectedStudent}
        onClose={closePaymentModal}
        onSavePayment={handleSavePayment}
      />

      <ReminderModal
        show={showReminderModal}
        student={selectedReminderStudent}
        onClose={closeReminderModal}
        onConfirm={handleSendReminder}
        sending={sendingReminder}
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
