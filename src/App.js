import React, { useCallback, useEffect, useRef, useState } from "react";
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
import AddStudentModal from "./components/AddStudentModal";
import EditStudentModal from "./components/EditStudentModal";
import ConfirmModal from "./components/ConfirmModal";
import LoginPage from "./components/LoginPage";
import AdminSettingsPage from "./components/AdminSettingsPage";
import mainAdminAvatar from "./assets/admin.png";
import assistantAdminAvatar from "./assets/administrator.png";
import { handleFileUpload, handleAddStudent, handleInputChange, INITIAL_STUDENT } from "./utils/handlers";
import {
  applyFeeFieldChange,
  INSTALLMENT_DATE_FIELDS,
  getLatestPaymentReminderToken,
  normalizeStudentFinancials,
} from "./utils/fees";
import { buildReminderDraft } from "./utils/reminders";
import { buildPaymentReceiptDraft } from "./utils/receipts";
import {
  getStudents,
  deleteStudent,
  updateStudent,
  adminLogin,
  updateAdminProfile,
  updateAdminPassword,
  sendPaymentReceipt,
  sendPaymentReminder,
} from "./utils/api";

const AUTH_STORAGE_KEY = "aclc_admin_session";
const ASSISTANT_ADMIN_USERNAME = "assistantadmin";
const THEME_STORAGE_KEY = "aclc_theme_preferences";
const DARK_MODE_STORAGE_KEY = "aclc_dark_mode";
const PAYMENT_CACHE_STORAGE_KEY = "aclc_payment_detail_cache";
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
    title: "Student Fee",
    description: "Review balances, search students quickly, and move payment processing forward with less friction.",
  },
  manageStudent: {
    title: "Manage Students",
    description: "Add, update, and clean student information in a structured, low-error workflow.",
  },
  manageFee: {
    title: "Manage Fees",
    description: "Adjust tuition breakdowns and keep every fee record accurate before collection time.",
  },
  students: {
    title: "Students",
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

const resolvePaymentDateFields = (paymentMeta, paymentTimestamp) => {
  const nextDateFields = {};
  const paymentBreakdown = Array.isArray(paymentMeta?.payment_breakdown) ? paymentMeta.payment_breakdown : [];

  paymentBreakdown.forEach((item) => {
    const dateField = INSTALLMENT_DATE_FIELDS[item?.field];
    if (dateField && item?.field !== "FullPaymentAmount" && Number(item?.applied) > 0) {
      nextDateFields[dateField] = paymentTimestamp;
    }
  });

  if (Object.keys(nextDateFields).length === 0) {
    const fallbackDateField = INSTALLMENT_DATE_FIELDS[paymentMeta?.stage_field];
    if (fallbackDateField && paymentMeta?.stage_field !== "FullPaymentAmount" && Number(paymentMeta?.amount_applied) > 0) {
      nextDateFields[fallbackDateField] = paymentTimestamp;
    }
  }

  if (Number(paymentMeta?.outstanding_after) <= 0) {
    nextDateFields.total_balance_date = paymentTimestamp;
  }

  return nextDateFields;
};

const resolvePaymentAmountFields = (paymentMeta) => {
  const nextAmountFields = {};
  const paymentBreakdown = Array.isArray(paymentMeta?.payment_breakdown) ? paymentMeta.payment_breakdown : [];

  paymentBreakdown.forEach((item) => {
    const amountField =
      item?.field === "Downpayment"
        ? "downpayment_paid_amount"
        : item?.field === "Prelim"
          ? "prelim_paid_amount"
          : item?.field === "Midterm"
            ? "midterm_paid_amount"
            : item?.field === "PreFinal"
              ? "prefinal_paid_amount"
              : item?.field === "Finals"
                ? "final_paid_amount"
                : item?.field === "FullPaymentAmount"
                  ? "total_balance_paid_amount"
                  : "";

    if (amountField && Number(item?.applied) > 0) {
      nextAmountFields[amountField] = Number(item.applied);
    }
  });

  if (Object.keys(nextAmountFields).length === 0) {
    const fallbackAmountField =
      paymentMeta?.stage_field === "Downpayment"
        ? "downpayment_paid_amount"
        : paymentMeta?.stage_field === "Prelim"
          ? "prelim_paid_amount"
          : paymentMeta?.stage_field === "Midterm"
            ? "midterm_paid_amount"
            : paymentMeta?.stage_field === "PreFinal"
              ? "prefinal_paid_amount"
              : paymentMeta?.stage_field === "Finals"
                ? "final_paid_amount"
                : paymentMeta?.stage_field === "FullPaymentAmount"
                  ? "total_balance_paid_amount"
                  : "";

    if (fallbackAmountField && Number(paymentMeta?.stage_amount_paid ?? paymentMeta?.amount_applied) > 0) {
      nextAmountFields[fallbackAmountField] = Number(paymentMeta.stage_amount_paid ?? paymentMeta.amount_applied);
    }
  }

  return nextAmountFields;
};

const getStageLabelFromField = (stageField) => {
  switch (stageField) {
    case "Downpayment":
      return "Downpayment";
    case "Prelim":
      return "Prelim";
    case "Midterm":
      return "Midterm";
    case "PreFinal":
      return "Pre-Final";
    case "Finals":
      return "Finals";
    case "FullPaymentAmount":
      return "Full Payment";
    default:
      return "Payment";
  }
};

const loadPaymentDetailCache = () => {
  try {
    const stored = localStorage.getItem(PAYMENT_CACHE_STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.warn("Failed to parse payment detail cache.", error);
    return {};
  }
};

const savePaymentDetailCache = (cache) => {
  try {
    localStorage.setItem(PAYMENT_CACHE_STORAGE_KEY, JSON.stringify(cache || {}));
  } catch (error) {
    console.warn("Failed to persist payment detail cache.", error);
  }
};

const mergePaymentDetailsIntoStudent = (student, cache = {}) => {
  if (!student || !student.StudentID) {
    return student;
  }

  const cacheKey = String(student.StudentID);
  const cached = cache[cacheKey];
  if (!cached || typeof cached !== "object") {
    return student;
  }

  return {
    ...student,
    ...Object.fromEntries(
      Object.entries(cached).filter(([, value]) => value !== undefined && value !== null && value !== "")
    ),
  };
};

const extractPersistedPaymentDetails = (student = {}) => ({
  downpayment_date: student.downpayment_date ?? null,
  prelim_date: student.prelim_date ?? null,
  midterm_date: student.midterm_date ?? null,
  prefinal_date: student.prefinal_date ?? null,
  final_date: student.final_date ?? null,
  total_balance_date: student.total_balance_date ?? null,
  downpayment_paid_amount: student.downpayment_paid_amount ?? null,
  prelim_paid_amount: student.prelim_paid_amount ?? null,
  midterm_paid_amount: student.midterm_paid_amount ?? null,
  prefinal_paid_amount: student.prefinal_paid_amount ?? null,
  final_paid_amount: student.final_paid_amount ?? null,
  total_balance_paid_amount: student.total_balance_paid_amount ?? null,
  date_paid: student.date_paid ?? student.DatePaid ?? null,
  DatePaid: student.DatePaid ?? student.date_paid ?? null,
  reminder_sent_token: student.reminder_sent_token ?? null,
});

function App() {
  const [students, setStudents] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderNotice, setReminderNotice] = useState({
    visible: false,
    message: "",
    tone: "success",
  });
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [newStudent, setNewStudent] = useState(INITIAL_STUDENT);
  const [addStudentError, setAddStudentError] = useState("");
  const [editStudent, setEditStudent] = useState(null);
  const [confirmState, setConfirmState] = useState({ show: false, type: null, payload: null });
  const [programFilter, setProgramFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [themePrefs, setThemePrefs] = useState(DEFAULT_THEME);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const reminderNoticeTimerRef = useRef(null);

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
    return () => {
      if (reminderNoticeTimerRef.current) {
        window.clearTimeout(reminderNoticeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const loadStudents = async () => {
      try {
        const data = await getStudents();
        if (Array.isArray(data)) {
          const paymentCache = loadPaymentDetailCache();
          setStudents(
            data.map((student) =>
              normalizeStudentFinancials(mergePaymentDetailsIntoStudent(student, paymentCache))
            )
          );
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
    setYearFilter("");
    setActiveTab("home");
  };

  const normalizedQuery = searchQuery.toLowerCase();
  const normalizedProgramFilter = programFilter.toLowerCase();
  const normalizedYearFilter = yearFilter.toLowerCase();
  const activeView = VIEW_META[activeTab] || VIEW_META.home;

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.Name?.toLowerCase().includes(normalizedQuery) ||
      student.StudentID?.toLowerCase().includes(normalizedQuery);

    const programValue = student.Program?.toLowerCase() || "";
    const matchesProgram = normalizedProgramFilter
      ? programValue.includes(normalizedProgramFilter)
      : true;

    const yearValue = (student.YearLevel || "").toLowerCase();
    const matchesYear = normalizedYearFilter
      ? yearValue.includes(normalizedYearFilter)
      : true;

    return matchesSearch && matchesProgram && matchesYear;
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

  const showReminderToast = useCallback((message, tone = "success") => {
    if (reminderNoticeTimerRef.current) {
      window.clearTimeout(reminderNoticeTimerRef.current);
    }

    setReminderNotice({ visible: true, message, tone });
    reminderNoticeTimerRef.current = window.setTimeout(() => {
      setReminderNotice((prev) => ({ ...prev, visible: false }));
    }, 2800);
  }, []);

  const buildReminderPayload = useCallback((student) => {
    const reminderDraft = buildReminderDraft(student);
    const reminderStudent = reminderDraft.student;
    const payload = {
      StudentID: reminderStudent.StudentID,
      Name: reminderStudent.Name,
      Gmail: reminderStudent.Gmail,
      Program: reminderStudent.Program,
      YearLevel: reminderStudent.YearLevel,
      PaymentMode: reminderStudent.PaymentMode,
      TotalFee: reminderStudent.TotalFee,
      TotalBalance: reminderStudent.TotalBalance,
      due_type: reminderDraft.dueType,
      due_label: reminderDraft.dueLabel,
      due_amount: reminderDraft.dueAmount,
      subject: reminderDraft.subject,
      message: reminderDraft.message,
      html: reminderDraft.html,
    };

    return {
      payload,
      reminderStudent,
    };
  }, []);

  const getReminderState = useCallback((student) => {
    const normalizedStudent = normalizeStudentFinancials(student);
    const reminderToken = getLatestPaymentReminderToken(normalizedStudent);
    const isReminderAlreadySent =
      Boolean(normalizedStudent.reminder_sent_token) &&
      Boolean(reminderToken) &&
      normalizedStudent.reminder_sent_token === reminderToken;

    return {
      normalizedStudent,
      reminderToken,
      isReminderAlreadySent,
      canRemind:
        Boolean(normalizedStudent.Gmail) &&
        normalizedStudent.TotalBalance > 0 &&
        normalizedStudent.CanRemind &&
        Boolean(reminderToken) &&
        !isReminderAlreadySent,
    };
  }, []);

  const handleRemind = async (student) => {
    if (sendingReminder) {
      return;
    }

    const { normalizedStudent, reminderToken, isReminderAlreadySent, canRemind } = getReminderState(student);
    if (!canRemind) {
      if (!normalizedStudent.CanRemind) {
        showReminderToast("Reminder is available only after saving a payment for this student.", "error");
      } else if (isReminderAlreadySent) {
        showReminderToast("Reminder has already been sent for the latest paid stage.", "error");
      }
      return;
    }

    setSendingReminder(true);
    try {
      const { payload } = buildReminderPayload(normalizedStudent);
      await sendPaymentReminder(payload);
      setStudents((prev) =>
        prev.map((item) =>
          item.StudentID === normalizedStudent.StudentID
            ? normalizeStudentFinancials({
                ...item,
                CanRemind: false,
                reminder_sent_token: reminderToken,
              })
            : item
        )
      );
    } catch (error) {
      console.error(error);
      showReminderToast(error?.message || "Reminder email could not be sent.", "error");
    } finally {
      setSendingReminder(false);
    }
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
      const nextCache = loadPaymentDetailCache();
      ids.forEach((id) => {
        delete nextCache[String(id)];
      });
      savePaymentDetailCache(nextCache);
      setStudents((prev) => prev.filter((student) => !ids.includes(student.StudentID)));
    } catch (error) {
      console.error(error);
      alert(error?.message || "Some deletions failed. Please try again.");
    }
  };

  const executeDeleteStudent = async (student) => {
    if (!student || !student.StudentID) {
      return;
    }

    try {
      await deleteStudent(student.StudentID);
      const nextCache = loadPaymentDetailCache();
      delete nextCache[String(student.StudentID)];
      savePaymentDetailCache(nextCache);
      setStudents((prev) => prev.filter((item) => item.StudentID !== student.StudentID));
    } catch (error) {
      console.error(error);
      alert(error?.message || "Delete failed. Please try again.");
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

  const handleSavePayment = async (payload) => {
    const incomingStudent = payload?.student ? payload.student : payload;
    const paymentMeta = payload?.payment || null;

    if (!incomingStudent || !incomingStudent.StudentID) {
      return;
    }

    const datePaid = new Date().toISOString();
    const paymentDateFields = resolvePaymentDateFields(paymentMeta, datePaid);
    const paymentAmountFields = resolvePaymentAmountFields(paymentMeta);
    const receiptPaymentMeta = paymentMeta
      ? {
        ...paymentMeta,
        date_paid: datePaid,
        payment_type: getStageLabelFromField(paymentMeta.stage_field),
        stage_label: getStageLabelFromField(paymentMeta.stage_field),
      }
      : null;
    const normalizedIncomingStudent = normalizeStudentFinancials({
      ...incomingStudent,
      CanRemind: true,
      date_paid: datePaid,
      DatePaid: datePaid,
      ...paymentDateFields,
      ...paymentAmountFields,
    });

    try {
      const persistedStudent = await updateStudent(normalizedIncomingStudent);
      const savedStudent = normalizeStudentFinancials({
        ...normalizedIncomingStudent,
        ...persistedStudent,
      });
      const nextCache = loadPaymentDetailCache();
      nextCache[String(savedStudent.StudentID)] = {
        ...nextCache[String(savedStudent.StudentID)],
        ...extractPersistedPaymentDetails(savedStudent),
      };
      savePaymentDetailCache(nextCache);
      setStudents((prev) =>
        prev.map((student) =>
          student.StudentID === savedStudent.StudentID
            ? normalizeStudentFinancials({
                ...savedStudent,
                reminder_sent_token: null,
              })
            : student
        )
      );
      closePaymentModal();

      if (
        receiptPaymentMeta &&
        savedStudent.Gmail &&
        Number(receiptPaymentMeta.amount_applied) > 0
      ) {
        try {
          const receiptDraft = buildPaymentReceiptDraft(savedStudent, receiptPaymentMeta);

          await sendPaymentReceipt({
            StudentID: savedStudent.StudentID,
            Name: savedStudent.Name,
            Gmail: savedStudent.Gmail,
            Program: savedStudent.Program,
            YearLevel: savedStudent.YearLevel,
            PaymentMode: savedStudent.PaymentMode,
            TotalFee: savedStudent.TotalFee,
            TotalBalance: savedStudent.TotalBalance,
            FullPaymentAmount: savedStudent.FullPaymentAmount,
            amount_requested: receiptPaymentMeta.amount_requested,
            amount_applied: receiptPaymentMeta.amount_applied,
            outstanding_before: receiptPaymentMeta.outstanding_before,
            outstanding_after: receiptPaymentMeta.outstanding_after,
            official_receipt: receiptPaymentMeta.official_receipt,
            stage_field: receiptPaymentMeta.stage_field,
            stage_label: receiptPaymentMeta.stage_label,
            stage_amount_before: receiptPaymentMeta.stage_amount_before,
            stage_amount_paid: receiptPaymentMeta.stage_amount_paid,
            stage_amount_remaining: receiptPaymentMeta.stage_amount_remaining,
            payment_type: receiptPaymentMeta.payment_type,
            date_paid: datePaid,
            DatePaid: datePaid,
            downpayment_date: normalizedIncomingStudent.downpayment_date,
            prelim_date: normalizedIncomingStudent.prelim_date,
            midterm_date: normalizedIncomingStudent.midterm_date,
            prefinal_date: normalizedIncomingStudent.prefinal_date,
            final_date: normalizedIncomingStudent.final_date,
            total_balance_date: normalizedIncomingStudent.total_balance_date,
            downpayment_paid_amount: normalizedIncomingStudent.downpayment_paid_amount,
            prelim_paid_amount: normalizedIncomingStudent.prelim_paid_amount,
            midterm_paid_amount: normalizedIncomingStudent.midterm_paid_amount,
            prefinal_paid_amount: normalizedIncomingStudent.prefinal_paid_amount,
            final_paid_amount: normalizedIncomingStudent.final_paid_amount,
            total_balance_paid_amount: normalizedIncomingStudent.total_balance_paid_amount,
            subject: receiptDraft.subject,
            message: receiptDraft.message,
            html: receiptDraft.html,
          });
        } catch (emailError) {
          console.error(emailError);
          alert(
            `Payment was saved, but receipt email failed to send to ${savedStudent.Gmail}. ${emailError?.message || ""}`.trim()
          );
        }
      }
    } catch (error) {
      console.error(error);
      alert("Payment could not be saved. Please try again.");
    }
  };

  const handleSendRemindersAtOnce = async (selectedStudents) => {
    if (sendingReminder) {
      return;
    }

    const eligibleStudents = (selectedStudents || [])
      .map((student) => normalizeStudentFinancials(student))
      .filter(
        (student) =>
          Boolean(student.StudentID) &&
          Boolean(student.Name) &&
          Boolean(student.Gmail) &&
          student.TotalBalance > 0 &&
          student.CanRemind
      );

    if (eligibleStudents.length === 0) {
      alert("No eligible selected students to remind. Save payment first, then select students with Gmail and outstanding balance.");
      return;
    }

    const proceed = window.confirm(
      `Send reminder email${eligibleStudents.length === 1 ? "" : "s"} to ${eligibleStudents.length} selected student${eligibleStudents.length === 1 ? "" : "s"} now?`
    );

    if (!proceed) {
      return;
    }

    setSendingReminder(true);

    let successCount = 0;
    const failures = [];
    const successfullyRemindedIds = [];

    try {
      for (const student of eligibleStudents) {
        const { reminderStudent, payload } = buildReminderPayload(student);

        try {
          await sendPaymentReminder(payload);
          successCount += 1;
          successfullyRemindedIds.push(reminderStudent.StudentID);
        } catch (error) {
          failures.push({
            name: reminderStudent.Name || reminderStudent.StudentID,
            message: error?.message || "Send failed",
          });
        }
      }

      if (failures.length === 0) {
        return;
      }

      const failedPreview = failures
        .slice(0, 5)
        .map((item) => `${item.name}: ${item.message}`)
        .join("\n");
      const extraFailed = failures.length - 5;

      showReminderToast(
        `Reminders sent: ${successCount}/${eligibleStudents.length}. ${failures.length} failed.`,
        "error"
      );
      console.warn(`Reminder failures:\n${failedPreview}${extraFailed > 0 ? `\n...and ${extraFailed} more.` : ""}`);
    } finally {
      if (successfullyRemindedIds.length > 0) {
        setStudents((prev) =>
          prev.map((item) =>
            successfullyRemindedIds.includes(item.StudentID)
              ? normalizeStudentFinancials({
                  ...item,
                  CanRemind: false,
                  reminder_sent_token: getLatestPaymentReminderToken(item),
                })
              : item
          )
        );
      }
      setSendingReminder(false);
    }
  };

  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
    setNewStudent(INITIAL_STUDENT);
    setAddStudentError("");
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
      {reminderNotice.visible ? (
        <div className={`inline-toast inline-toast-${reminderNotice.tone}`} role="status" aria-live="polite">
          {reminderNotice.message}
        </div>
      ) : null}
      <Header
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        viewTitle={activeView.title}
        viewDescription={activeView.description}
        userName={authUser?.name}
        studentCount={students.length}
      />
      <div className={`dashboard-container${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onRequestLogout={() => setShowLogoutConfirm(true)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
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
            panelVariant="student-actions"
            sectionTitle="Student Fee"
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
            yearFilter={yearFilter}
            onYearFilterChange={setYearFilter}
            noteText="Upload records, search by student, and process collections with fewer clicks."
          />
          <StudentFeeTable 
            students={students}
            filteredStudents={filteredStudents}
            onPaid={handlePaid}
            onRemind={handleRemind}
            onRemindSelected={handleSendRemindersAtOnce}
            sendingReminder={sendingReminder}
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
            panelVariant="student-actions"
            sectionTitle="Student Actions"
            onAddStudent={() => setShowAddStudentModal(true)}
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
            yearFilter={yearFilter}
            onYearFilterChange={setYearFilter}
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
            sectionTitle="Fee Controls"
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
            yearFilter={yearFilter}
            onYearFilterChange={setYearFilter}
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
            sectionTitle="Directory"
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
            yearFilter={yearFilter}
            onYearFilterChange={setYearFilter}
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

      <AddStudentModal 
        showAddStudentModal={showAddStudentModal}
        newStudent={newStudent}
        addStudentError={addStudentError}
        onClose={closeAddStudentModal}
        onSubmit={(e) =>
          handleAddStudent(
            e,
            newStudent,
            students,
            setStudents,
            setShowAddStudentModal,
            setNewStudent,
            setAddStudentError
          )
        }
        onInputChange={(e) => {
          if (addStudentError) {
            setAddStudentError("");
          }
          handleInputChange(e, newStudent, setNewStudent);
        }}
the      />

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

      <ConfirmModal
        show={showLogoutConfirm}
        message="Are you sure you want to log out?"
        confirmLabel="Yes"
        cancelLabel="Cancel"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
        </main>
      </div>
    </div>
  );
}

export default App;
