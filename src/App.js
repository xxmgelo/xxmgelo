import React, { useCallback, useEffect, useRef, useState } from "react";
import "./index.css";
import * as XLSX from "xlsx";
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
import SchoolYearsPage from "./components/SchoolYearsPage";
import CreateSchoolYearModal from "./components/CreateSchoolYearModal";
import mainAdminAvatar from "./assets/admin.png";
import assistantAdminAvatar from "./assets/administrator.png";
import { composeStudentName, handleAddStudent, handleInputChange, INITIAL_STUDENT } from "./utils/handlers";
import {
  applyFeeFieldChange,
  CARRY_OVER_FIELD,
  getCarryOverTotals,
  getCurrentInstallmentIndex,
  INSTALLMENT_DATE_FIELDS,
  INSTALLMENT_FIELDS,
  getLatestPaymentReminderToken,
  normalizeStudentFinancials,
  previewPaymentApplication,
} from "./utils/fees";
import { collectExistingOrNumbers, isValidOrNumber, normalizeOrNumber } from "./utils/orNumbers";
import { SEMESTERS, formatActiveContextLabel, getPreviousSemester, isSecondSemester } from "./utils/semester";
import { buildReminderDraft } from "./utils/reminders";
import { buildPaymentReceiptDraft } from "./utils/receipts";
import {
  getSchoolYears,
  importSchoolYearStudents,
  createSchoolYear,
  deleteSchoolYears,
  getStudents,
  createStudent,
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
const ACTIVE_CONTEXT_STORAGE_KEY = "aclc_active_school_context";
const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;
const CARRY_OVER_STATUS = {
  NOT_CARRIED: "not_carried",
  CARRIED_OVER: "carried_over",
  PAID: "paid",
};

const DEFAULT_THEME = {
  start: "#007877",
  end: "#007877",
};

const VIEW_META = {
  home: {
    title: "Dashboard",
    description: "Choose the school year that should drive the records shown across the existing modules.",
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

const STUDENT_UPLOAD_HEADER_ALIASES = {
  studentid: "StudentID",
  usn: "StudentID",
  usnnumber: "StudentID",
  usnno: "StudentID",
  studentnumber: "StudentID",
  studentno: "StudentID",
  originalstudentid: "OriginalStudentID",
  name: "Name",
  surname: "Surname",
  lastname: "Surname",
  givenname: "GivenName",
  firstname: "GivenName",
  middlename: "Initial",
  middleinitial: "Initial",
  initial: "Initial",
  program: "Program",
  programcourse: "Program",
  course: "Program",
  yearlevel: "YearLevel",
  year: "YearLevel",
  gmail: "Gmail",
  email: "Gmail",
};

const normalizeUploadHeaderKey = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const readUploadCell = (row, keys) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
};

const normalizeUploadRow = (row, context = {}) => {
  const mapped = {};

  Object.entries(row || {}).forEach(([rawKey, rawValue]) => {
    const mappedKey = STUDENT_UPLOAD_HEADER_ALIASES[normalizeUploadHeaderKey(rawKey)];
    if (!mappedKey) {
      return;
    }

    mapped[mappedKey] = rawValue;
  });

  const surname = readUploadCell(mapped, ["Surname"]);
  const givenName = readUploadCell(mapped, ["GivenName"]);
  const initial = readUploadCell(mapped, ["Initial"]).replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase();
  const composedName =
    surname && givenName ? composeStudentName({ Surname: surname, GivenName: givenName, Initial: initial }) : "";
  const studentId = readUploadCell(mapped, ["StudentID", "OriginalStudentID"]);
  const name = readUploadCell(mapped, ["Name"]) || composedName;

  return normalizeStudentFinancials({
    ...INITIAL_STUDENT,
    StudentID: studentId,
    OriginalStudentID: readUploadCell(mapped, ["OriginalStudentID"]) || studentId,
    Name: name,
    Surname: surname,
    GivenName: givenName,
    Initial: initial,
    Program: readUploadCell(mapped, ["Program"]),
    YearLevel: readUploadCell(mapped, ["YearLevel"]),
    Gmail: readUploadCell(mapped, ["Gmail"]),
    SchoolYearID: context.schoolYearId || 0,
    Semester: context.semester || "",
  });
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

const getContextStudentKeyCandidates = (schoolYearId, semester, student = {}) => {
  const candidates = [
    student.id,
    student.OriginalStudentID,
    student.original_student_id,
    student.student_id,
    student.StudentID,
    student.studentId,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  const uniqueCandidates = Array.from(new Set(candidates));
  return uniqueCandidates.map((value) => `${schoolYearId || 0}::${semester || ""}::${value}`);
};

const buildContextStudentKey = (schoolYearId, semester, student) =>
  getContextStudentKeyCandidates(schoolYearId, semester, student)[0] || `${schoolYearId || 0}::${semester || ""}::`;

const extractSemesterSnapshot = (student = {}) => ({
  ...extractPersistedPaymentDetails(student),
  PaymentMode: student.PaymentMode,
  TotalFee: student.TotalFee,
  BaseTotalFee: student.BaseTotalFee,
  Discount: student.Discount,
  Downpayment: student.Downpayment,
  Prelim: student.Prelim,
  Midterm: student.Midterm,
  PreFinal: student.PreFinal,
  Finals: student.Finals,
  FullPaymentAmount: student.FullPaymentAmount,
  TotalBalance: student.TotalBalance,
  carried_over_amount: student.carried_over_amount ?? 0,
  carried_over_paid_amount: student.carried_over_paid_amount ?? 0,
  carried_over_remaining: student.carried_over_remaining ?? 0,
  carried_over_from_semester: student.carried_over_from_semester ?? "",
  carry_over_confirmed: Boolean(student.carry_over_confirmed),
  carry_over_confirmed_at: student.carry_over_confirmed_at ?? null,
  carried_over_to_semester: student.carried_over_to_semester ?? "",
  stage_or_numbers: student.stage_or_numbers ?? {},
  payment_history: Array.isArray(student.payment_history) ? student.payment_history : [],
});

const getContextCacheEntry = (cache, schoolYearId, semester, student) => {
  const keyCandidates = getContextStudentKeyCandidates(schoolYearId, semester, student);
  for (const key of keyCandidates) {
    if (cache[key]) {
      return cache[key];
    }
  }
  return null;
};

const writeContextCacheEntry = (cache, schoolYearId, semester, student, value) => {
  const keyCandidates = getContextStudentKeyCandidates(schoolYearId, semester, student);
  keyCandidates.forEach((key) => {
    cache[key] = value;
  });
};

const mergePaymentDetailsIntoStudent = (student, cache = {}, context = {}) => {
  if (!student || !student.StudentID) {
    return student;
  }

  const cached = getContextCacheEntry(cache, context.schoolYearId, context.semester, student);
  if (!cached || typeof cached !== "object") {
    if (!isSecondSemester(context.semester)) {
      return student;
    }
  }

  const merged = {
    ...student,
    ...Object.fromEntries(
      Object.entries(cached || {}).filter(([, value]) => value !== undefined && value !== null && value !== "")
    ),
  };

  if (isSecondSemester(context.semester)) {
    const firstSemesterSnapshot = getContextCacheEntry(
      cache,
      context.schoolYearId,
      getPreviousSemester(context.semester),
      student
    );

    if (firstSemesterSnapshot && typeof firstSemesterSnapshot === "object") {
      const firstSemesterStudent = normalizeStudentFinancials({
        ...student,
        ...firstSemesterSnapshot,
      });
      const remainingCarry = Math.max(firstSemesterStudent.TotalBalance || 0, 0);
      const currentCarryPaid = Number(merged.carried_over_paid_amount ?? 0);

      Object.assign(merged, {
        carried_over_amount: remainingCarry + currentCarryPaid,
        carried_over_paid_amount: currentCarryPaid,
        carried_over_remaining: remainingCarry,
        carried_over_from_semester: SEMESTERS.FIRST,
      });
    }
  }

  return merged;
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
  official_receipt: student.official_receipt ?? null,
});

const splitStudentName = (student = {}) => {
  const surname = String(student.Surname ?? student.surname ?? "").trim();
  const givenName = String(student.GivenName ?? student.given_name ?? student.givenName ?? "").trim();
  const initial = String(student.Initial ?? student.initial ?? "").trim();

  if (surname || givenName || initial) {
    return { Surname: surname, GivenName: givenName, Initial: initial };
  }

  const fullName = String(student.Name ?? student.name ?? "").trim();
  if (!fullName) {
    return { Surname: "", GivenName: "", Initial: "" };
  }

  const [rawSurname = "", rawRemainder = ""] = fullName.split(/,\s*/, 2);
  const remainderParts = rawRemainder.trim().split(/\s+/).filter(Boolean);
  const maybeInitial = remainderParts.length > 1 ? remainderParts[remainderParts.length - 1] : "";
  const isInitial = /^[A-Za-z]\.?$/.test(maybeInitial);

  return {
    Surname: rawSurname.trim(),
    GivenName: isInitial ? remainderParts.slice(0, -1).join(" ") : rawRemainder.trim(),
    Initial: isInitial ? maybeInitial : "",
  };
};

const getStudentRowKey = (student = {}) =>
  student.id || student.OriginalStudentID || student.student_id || student.StudentID || "";

const isDeleteAlreadySatisfiedError = (error) =>
  String(error?.message || "").trim().toLowerCase().includes("student not found");

function App() {
  const [students, setStudents] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState(0);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [importingSchoolYear, setImportingSchoolYear] = useState(false);
  const [creatingSchoolYear, setCreatingSchoolYear] = useState(false);
  const [showCreateSchoolYearModal, setShowCreateSchoolYearModal] = useState(false);
  const [createSchoolYearError, setCreateSchoolYearError] = useState("");
  const [schoolYearSelectionMode, setSchoolYearSelectionMode] = useState(false);
  const [selectedSchoolYearIdsForRemoval, setSelectedSchoolYearIdsForRemoval] = useState([]);
  const [schoolYearDeleteConfirm, setSchoolYearDeleteConfirm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [carryOverModalState, setCarryOverModalState] = useState({
    open: false,
    student: null,
    secondSemesterStudent: null,
    status: CARRY_OVER_STATUS.NOT_CARRIED,
    loading: false,
  });
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
  const [uploadingStudents, setUploadingStudents] = useState(false);
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
    const navigationEntry = performance.getEntriesByType?.("navigation")?.[0];
    const isReload = navigationEntry?.type === "reload";
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!isReload) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

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
    try {
      const stored = localStorage.getItem(ACTIVE_CONTEXT_STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (parsed?.schoolYearId) {
        setSelectedSchoolYearId(parsed.schoolYearId);
      }
      if (parsed?.semester) {
        setSelectedSemester(parsed.semester);
      }
    } catch (error) {
      console.warn("Failed to parse active school context.", error);
    }
  }, []);

  useEffect(() => {
    if (!selectedSchoolYearId || !selectedSemester) {
      localStorage.removeItem(ACTIVE_CONTEXT_STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      ACTIVE_CONTEXT_STORAGE_KEY,
      JSON.stringify({
        schoolYearId: selectedSchoolYearId,
        semester: selectedSemester,
      })
    );
  }, [selectedSchoolYearId, selectedSemester]);

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

    const loadSchoolYears = async () => {
      try {
        const data = await getSchoolYears();
        const nextSchoolYears = Array.isArray(data) ? data : [];
        setSchoolYears(nextSchoolYears);
        setSelectedSchoolYearId((prev) => (
          prev && nextSchoolYears.some((item) => item.id === prev) ? prev : 0
        ));
      } catch (error) {
        console.error(error);
        setSchoolYears([]);
      }
    };

    loadSchoolYears();
  }, [authUser]);

  useEffect(() => {
    if (!authUser || !selectedSchoolYearId) {
      return;
    }

    const loadStudents = async () => {
      try {
        const data = await getStudents(selectedSchoolYearId, selectedSemester);
        if (Array.isArray(data)) {
          const paymentCache = loadPaymentDetailCache();
          setStudents(
            data.map((student) =>
              normalizeStudentFinancials(
                mergePaymentDetailsIntoStudent(student, paymentCache, {
                  schoolYearId: selectedSchoolYearId,
                  semester: selectedSemester,
                })
              )
            )
          );
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadStudents();
  }, [authUser, selectedSchoolYearId, selectedSemester]);

  useEffect(() => {
    if (!selectedSchoolYearId || !selectedSemester) {
      return;
    }

    setNewStudent((prev) => ({ ...prev, SchoolYearID: selectedSchoolYearId, Semester: selectedSemester }));
  }, [selectedSchoolYearId, selectedSemester]);

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
    setSchoolYears([]);
    setSelectedSchoolYearId(0);
    setSelectedSemester("");
    setActiveTab("home");
  };

  const normalizedSchoolYears = Array.isArray(schoolYears) ? schoolYears : [];
  const normalizedQuery = searchQuery.toLowerCase();
  const normalizedProgramFilter = programFilter.toLowerCase();
  const normalizedYearFilter = yearFilter.toLowerCase();
  const selectedSchoolYear =
    normalizedSchoolYears.find((item) => item.id === selectedSchoolYearId) || null;
  const activeContextLabel = formatActiveContextLabel(selectedSchoolYear?.label, selectedSemester);
  const existingOrNumbers = collectExistingOrNumbers(loadPaymentDetailCache());
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

  const getCarryOverEligibility = useCallback((student, secondSemesterStudent = null) => {
    const normalized = normalizeStudentFinancials(student);
    const currentInstallmentIndex = getCurrentInstallmentIndex(normalized);
    const hasCarryEligibleBalance =
      normalized.TotalBalance > 0 &&
      (currentInstallmentIndex === INSTALLMENT_FIELDS.length - 1 || currentInstallmentIndex === -1);
    const isAlreadyConfirmed = Boolean(
      normalized.carry_over_confirmed ||
      normalized.carry_over_confirmed_at ||
      normalized.carried_over_to_semester
    );

    const normalizedSecondSemester = secondSemesterStudent
      ? normalizeStudentFinancials(secondSemesterStudent)
      : null;
    const carryOverTotals = normalizedSecondSemester ? getCarryOverTotals(normalizedSecondSemester) : null;

    let status = CARRY_OVER_STATUS.NOT_CARRIED;
    if (isAlreadyConfirmed || (carryOverTotals && carryOverTotals.total > 0)) {
      status =
        carryOverTotals && carryOverTotals.total > 0 && carryOverTotals.remaining <= 0
          ? CARRY_OVER_STATUS.PAID
          : CARRY_OVER_STATUS.CARRIED_OVER;
    }

    return {
      hasCarryEligibleBalance,
      status,
      isClickable:
        selectedSemester === SEMESTERS.FIRST &&
        hasCarryEligibleBalance &&
        status === CARRY_OVER_STATUS.NOT_CARRIED,
      normalizedSecondSemester,
    };
  }, [selectedSemester]);

  const getMatchingStudentRecord = useCallback((records, targetStudent) => {
    const targetStudentId = String(
      targetStudent?.OriginalStudentID ||
      targetStudent?.StudentID ||
      targetStudent?.student_id ||
      ""
    ).trim();

    return (records || []).find((record) => {
      const recordStudentId = String(
        record?.OriginalStudentID ||
        record?.StudentID ||
        record?.student_id ||
        ""
      ).trim();

      if (targetStudentId && recordStudentId) {
        return recordStudentId === targetStudentId;
      }

      return (
        String(record?.Name || "").trim().toLowerCase() === String(targetStudent?.Name || "").trim().toLowerCase() &&
        String(record?.Program || "").trim().toLowerCase() === String(targetStudent?.Program || "").trim().toLowerCase() &&
        String(record?.Gmail || "").trim().toLowerCase() === String(targetStudent?.Gmail || "").trim().toLowerCase()
      );
    }) || null;
  }, []);

  const handlePaid = (student) => {
    setSelectedStudent(normalizeStudentFinancials(student));
    setShowPaymentModal(true);
  };

  const handleRequestCarryOver = async (student) => {
    const normalizedStudent = normalizeStudentFinancials(student);
    const nextSemester = SEMESTERS.SECOND;

    setCarryOverModalState({
      open: true,
      student: normalizedStudent,
      secondSemesterStudent: null,
      status: CARRY_OVER_STATUS.NOT_CARRIED,
      loading: true,
    });

    try {
      const secondSemesterRecords = await getStudents(selectedSchoolYearId, nextSemester);
      const rawMatchedSecondSemester = getMatchingStudentRecord(secondSemesterRecords, normalizedStudent);
      const paymentCache = loadPaymentDetailCache();
      const matchedSecondSemester = rawMatchedSecondSemester
        ? mergePaymentDetailsIntoStudent(rawMatchedSecondSemester, paymentCache, {
            schoolYearId: selectedSchoolYearId,
            semester: nextSemester,
          })
        : null;
      const eligibility = getCarryOverEligibility(normalizedStudent, matchedSecondSemester);

      setCarryOverModalState({
        open: true,
        student: normalizedStudent,
        secondSemesterStudent: eligibility.normalizedSecondSemester,
        status: eligibility.status,
        loading: false,
      });
    } catch (error) {
      console.error(error);
      setCarryOverModalState({
        open: true,
        student: normalizedStudent,
        secondSemesterStudent: null,
        status: CARRY_OVER_STATUS.NOT_CARRIED,
        loading: false,
      });
      alert(error?.message || "Unable to load the 2nd Semester record for carry-over.");
    }
  };

  const handleConfirmCarryOver = async () => {
    if (!carryOverModalState.student || carryOverModalState.loading) {
      return;
    }

    const normalizedFirstSemester = normalizeStudentFinancials(carryOverModalState.student);
    const firstSemesterCarryAmount = Number(normalizedFirstSemester.TotalBalance || 0);

    if (firstSemesterCarryAmount <= 0) {
      return;
    }

    if (carryOverModalState.status !== CARRY_OVER_STATUS.NOT_CARRIED) {
      return;
    }

    setCarryOverModalState((prev) => ({ ...prev, loading: true }));

    try {
      let secondSemesterStudent = carryOverModalState.secondSemesterStudent;
      const carryConfirmedAt = new Date().toISOString();

      if (!secondSemesterStudent) {
        const preparedSecondSemesterStudent = normalizeStudentFinancials({
          ...normalizedFirstSemester,
          SchoolYearID: selectedSchoolYearId,
          Semester: SEMESTERS.SECOND,
          TotalFee: 0,
          BaseTotalFee: 0,
          Discount: 0,
          Downpayment: 0,
          Prelim: 0,
          Midterm: 0,
          PreFinal: 0,
          Finals: 0,
          FullPaymentAmount: 0,
          TotalBalance: 0,
          carry_over_amount: firstSemesterCarryAmount,
          carried_over_amount: firstSemesterCarryAmount,
          carried_over_paid_amount: 0,
          carried_over_from_semester: SEMESTERS.FIRST,
          carry_over_confirmed: true,
          carry_over_confirmed_at: carryConfirmedAt,
          carried_over_to_semester: SEMESTERS.SECOND,
        });
        const createdSecondSemester = await createStudent(
          preparedSecondSemesterStudent
        );
        secondSemesterStudent = normalizeStudentFinancials({
          ...preparedSecondSemesterStudent,
          ...createdSecondSemester,
        });
      } else {
        const preparedSecondSemesterStudent = normalizeStudentFinancials({
          ...secondSemesterStudent,
          SchoolYearID: selectedSchoolYearId,
          Semester: SEMESTERS.SECOND,
          carry_over_amount: firstSemesterCarryAmount,
          carried_over_amount: firstSemesterCarryAmount,
          carried_over_paid_amount: secondSemesterStudent.carried_over_paid_amount ?? 0,
          carried_over_from_semester: SEMESTERS.FIRST,
          carry_over_confirmed: true,
          carry_over_confirmed_at: carryConfirmedAt,
          carried_over_to_semester: SEMESTERS.SECOND,
        });
        secondSemesterStudent = normalizeStudentFinancials(
          {
            ...preparedSecondSemesterStudent,
            ...(await updateStudent(preparedSecondSemesterStudent)),
          }
        );
      }

      const nextCache = loadPaymentDetailCache();
      const firstSemesterExistingEntry =
        getContextCacheEntry(nextCache, selectedSchoolYearId, selectedSemester, normalizedFirstSemester) || {};
      const secondSemesterExistingEntry =
        getContextCacheEntry(nextCache, selectedSchoolYearId, SEMESTERS.SECOND, secondSemesterStudent) || {};
      writeContextCacheEntry(
        nextCache,
        selectedSchoolYearId,
        selectedSemester,
        normalizedFirstSemester,
        {
          ...firstSemesterExistingEntry,
          ...extractSemesterSnapshot({
            ...normalizedFirstSemester,
            carry_over_confirmed: true,
            carry_over_confirmed_at: carryConfirmedAt,
            carried_over_to_semester: SEMESTERS.SECOND,
          }),
        }
      );
      writeContextCacheEntry(
        nextCache,
        selectedSchoolYearId,
        SEMESTERS.SECOND,
        secondSemesterStudent,
        {
          ...secondSemesterExistingEntry,
          ...extractSemesterSnapshot(secondSemesterStudent),
        }
      );
      savePaymentDetailCache(nextCache);

      setStudents((prev) =>
        prev.map((item) =>
          getStudentRowKey(item) === getStudentRowKey(normalizedFirstSemester)
            ? normalizeStudentFinancials({
                ...item,
                carry_over_confirmed: true,
                carry_over_confirmed_at: carryConfirmedAt,
                carried_over_to_semester: SEMESTERS.SECOND,
              })
            : item
        )
      );

      setCarryOverModalState({
        open: false,
        student: null,
        secondSemesterStudent: null,
        status: CARRY_OVER_STATUS.NOT_CARRIED,
        loading: false,
      });
    } catch (error) {
      console.error(error);
      setCarryOverModalState((prev) => ({ ...prev, loading: false }));
      alert(error?.message || "Carry-over failed. Please try again.");
    }
  };

  const handleEditStudent = (student) => {
    if (!student) return;
    setEditStudent({
      ...student,
      SchoolYearID: student.SchoolYearID || selectedSchoolYearId,
      Semester: student.Semester || selectedSemester,
      ...splitStudentName(student),
      OriginalStudentID: student.OriginalStudentID || student.student_id || student.StudentID || "",
    });
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
      SchoolYearID: reminderStudent.SchoolYearID || selectedSchoolYearId,
      Semester: reminderStudent.Semester || selectedSemester,
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
          getStudentRowKey(item) === getStudentRowKey(normalizedStudent)
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
    if (field !== "PaymentMode") {
      return;
    }

    setStudents((prev) =>
      prev.map((student, index) => {
        const key = getStudentRowKey(student) || `row-${index}`;
        if (key !== rowKey) return student;
        return applyFeeFieldChange(student, field, value);
      })
    );
  };

  const handleFeeFieldCommit = async (rowKey, field = null, value = null) => {
    let studentToSave = null;

    setStudents((prev) =>
      prev.map((student, index) => {
        const key = getStudentRowKey(student) || `row-${index}`;
        if (key !== rowKey) {
          return student;
        }

        const nextStudent = field ? applyFeeFieldChange(student, field, value) : student;
        studentToSave = nextStudent;
        return nextStudent;
      })
    );

    if (!studentToSave || !studentToSave.StudentID) {
      return;
    }

    try {
      const persistedStudent = await updateStudent(studentToSave);
      const updated = normalizeStudentFinancials({
        ...studentToSave,
        ...persistedStudent,
      });
      const nextCache = loadPaymentDetailCache();
      const cacheKey = buildContextStudentKey(selectedSchoolYearId, selectedSemester, updated);
      nextCache[cacheKey] = {
        ...nextCache[cacheKey],
        ...extractSemesterSnapshot(updated),
      };
      savePaymentDetailCache(nextCache);
      setStudents((prev) =>
        prev.map((item) =>
          getStudentRowKey(item) === getStudentRowKey(updated) ? updated : item
        )
      );
    } catch (error) {
      console.error(error);
      alert(error?.message || "Fee update failed. Please try again.");
    }
  };

  const handleEditInputChange = (e) => {
    const { name } = e.target;
    const value =
      name === "Initial"
        ? String(e.target.value || "").replace(/[^a-z]/gi, "").slice(0, 1).toUpperCase()
        : e.target.value;
    setEditStudent((prev) => {
      const nextStudent = { ...prev, [name]: value };
      nextStudent.Name = composeStudentName(nextStudent);
      return nextStudent;
    });
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editStudent || !editStudent.StudentID || !editStudent.Surname || !editStudent.GivenName) {
      return;
    }

    try {
      const updated = normalizeStudentFinancials(
        await updateStudent({
          ...editStudent,
          Name: composeStudentName(editStudent),
        })
      );
      const nextCache = loadPaymentDetailCache();
      const cacheKey = buildContextStudentKey(selectedSchoolYearId, selectedSemester, updated);
      nextCache[cacheKey] = {
        ...nextCache[cacheKey],
        ...extractSemesterSnapshot(updated),
      };
      savePaymentDetailCache(nextCache);
      setStudents((prev) =>
        prev.map((item) =>
          getStudentRowKey(item) === getStudentRowKey(editStudent)
            ? updated
            : item
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

    const deletableStudents = selectedStudents.filter((student) => student?.StudentID || student?.id);

    if (deletableStudents.length === 0) {
      return;
    }

    try {
      const deleteResults = await Promise.allSettled(
        deletableStudents.map((student) => deleteStudent(student))
      );
      const blockingFailures = deleteResults.filter(
        (result) =>
          result.status === "rejected" && !isDeleteAlreadySatisfiedError(result.reason)
      );

      if (blockingFailures.length > 0) {
        throw blockingFailures[0].reason;
      }

      const nextCache = loadPaymentDetailCache();
      deletableStudents.forEach((student) => {
        getContextStudentKeyCandidates(selectedSchoolYearId, selectedSemester, student).forEach((cacheKey) => {
          if (cacheKey) {
            delete nextCache[cacheKey];
          }
        });
      });
      savePaymentDetailCache(nextCache);
      setStudents((prev) =>
        prev.filter(
          (student) =>
            !deletableStudents.some(
              (deleted) =>
                getStudentRowKey(deleted) === getStudentRowKey(student)
            )
        )
      );
    } catch (error) {
      console.error(error);
      alert(error?.message || "Some deletions failed. Please try again.");
    }
  };

  const executeDeleteStudent = async (student) => {
    if (!student || (!student.StudentID && !student.id)) {
      return;
    }

    try {
      try {
        await deleteStudent(student);
      } catch (error) {
        if (!isDeleteAlreadySatisfiedError(error)) {
          throw error;
        }
      }

      const nextCache = loadPaymentDetailCache();
      getContextStudentKeyCandidates(selectedSchoolYearId, selectedSemester, student).forEach((cacheKey) => {
        if (cacheKey) {
          delete nextCache[cacheKey];
        }
      });
      savePaymentDetailCache(nextCache);
      setStudents((prev) =>
        prev.filter((item) => getStudentRowKey(item) !== getStudentRowKey(student))
      );
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
    if (!student || (!student.StudentID && !student.id)) {
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
          stage_label: paymentMeta.stage_label || getStageLabelFromField(paymentMeta.stage_field),
        }
      : null;
    const normalizedIncomingStudent = normalizeStudentFinancials({
      ...incomingStudent,
      CanRemind: true,
      Semester: selectedSemester,
      school_year_label: selectedSchoolYear?.label || "",
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
      const cacheKey = buildContextStudentKey(selectedSchoolYearId, selectedSemester, savedStudent);
      const existingEntry = nextCache[cacheKey] || {};
      const paymentLineItems = Array.isArray(receiptPaymentMeta?.payment_line_items)
        ? receiptPaymentMeta.payment_line_items
        : [];
      const stageOrNumbers = {
        ...(existingEntry.stage_or_numbers || {}),
      };
      paymentLineItems.forEach((item) => {
        if (item?.field && item?.or_number) {
          stageOrNumbers[item.field] = item.or_number;
        }
      });
      if (Number(receiptPaymentMeta?.outstanding_after) <= 0 && receiptPaymentMeta?.official_receipt) {
        stageOrNumbers.TotalBalance = receiptPaymentMeta.official_receipt;
      }
      nextCache[cacheKey] = {
        ...existingEntry,
        ...extractSemesterSnapshot({
          ...savedStudent,
          stage_or_numbers: stageOrNumbers,
          payment_history: [
            ...(Array.isArray(existingEntry.payment_history) ? existingEntry.payment_history : []),
            ...paymentLineItems.map((item) => ({
              ...item,
              student_id: savedStudent.StudentID,
              school_year_id: selectedSchoolYearId,
              school_year_label: selectedSchoolYear?.label || "",
              semester: item.semester || selectedSemester,
              payment_date: datePaid,
            })),
          ],
        }),
      };
      savePaymentDetailCache(nextCache);

      const carryOverLineItem = paymentLineItems.find((item) => item.field === CARRY_OVER_FIELD);
      if (carryOverLineItem && Number(carryOverLineItem.amount_paid) > 0) {
        const firstSemesterKey = buildContextStudentKey(
          selectedSchoolYearId,
          getPreviousSemester(selectedSemester),
          savedStudent
        );
        const firstSemesterEntry = nextCache[firstSemesterKey];

        if (firstSemesterEntry) {
          const firstSemesterStudent = normalizeStudentFinancials({
            ...savedStudent,
            ...firstSemesterEntry,
          });
          const firstSemesterPreview = previewPaymentApplication(firstSemesterStudent, carryOverLineItem.amount_paid);
          nextCache[firstSemesterKey] = {
            ...firstSemesterEntry,
            ...extractSemesterSnapshot({
              ...firstSemesterPreview.nextStudent,
              CanRemind: true,
              date_paid: datePaid,
              DatePaid: datePaid,
              stage_or_numbers: {
                ...(firstSemesterEntry.stage_or_numbers || {}),
                [CARRY_OVER_FIELD]: carryOverLineItem.or_number,
              },
              payment_history: [
                ...(Array.isArray(firstSemesterEntry.payment_history) ? firstSemesterEntry.payment_history : []),
                {
                  ...carryOverLineItem,
                  semester: getPreviousSemester(selectedSemester),
                  payment_date: datePaid,
                  note: `Settled during ${selectedSemester}`,
                },
              ],
            }),
          };
          savePaymentDetailCache(nextCache);
        }
      }

      setStudents((prev) =>
        prev.map((student) =>
          getStudentRowKey(student) === getStudentRowKey(savedStudent)
            ? normalizeStudentFinancials({
                ...savedStudent,
                reminder_sent_token: null,
                stage_or_numbers: stageOrNumbers,
                payment_history: nextCache[cacheKey].payment_history,
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
            SchoolYearID: selectedSchoolYearId,
            school_year_label: selectedSchoolYear?.label || "",
            semester: selectedSemester,
            amount_requested: receiptPaymentMeta.amount_requested,
            amount_applied: receiptPaymentMeta.amount_applied,
            outstanding_before: receiptPaymentMeta.outstanding_before,
            outstanding_after: receiptPaymentMeta.outstanding_after,
            official_receipt: receiptPaymentMeta.official_receipt,
            payment_line_items: receiptPaymentMeta.payment_line_items,
            stage_field: receiptPaymentMeta.stage_field,
            stage_label: receiptPaymentMeta.stage_label,
            stage_amount_before: receiptPaymentMeta.stage_amount_before,
            stage_amount_paid: receiptPaymentMeta.stage_amount_paid,
            stage_amount_remaining: receiptPaymentMeta.stage_amount_remaining,
            payment_type: receiptPaymentMeta.payment_type,
            carried_over_amount: normalizedIncomingStudent.carried_over_amount ?? 0,
            carried_over_paid_amount: normalizedIncomingStudent.carried_over_paid_amount ?? 0,
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
          successfullyRemindedIds.push(getStudentRowKey(reminderStudent));
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
            successfullyRemindedIds.includes(getStudentRowKey(item))
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

  const handleUpdatePaymentOrNumber = async ({ student, field, orNumber, targetSemester = "" }) => {
    const normalizedOrNumber = normalizeOrNumber(orNumber);

    if (!student || !field) {
      throw new Error("Payment detail is missing.");
    }

    if (!normalizedOrNumber) {
      throw new Error("OR Number is required.");
    }

    if (!isValidOrNumber(normalizedOrNumber)) {
      throw new Error("Invalid OR Number format. Use OR-YYYY-000001.");
    }

    const nextCache = loadPaymentDetailCache();
    const effectiveSemester = targetSemester || selectedSemester;
    const cacheKey = buildContextStudentKey(selectedSchoolYearId, effectiveSemester, student);
    const existingEntry = nextCache[cacheKey];

    if (!existingEntry) {
      throw new Error("Saved payment details were not found for this semester.");
    }

    const priorHistory = Array.isArray(existingEntry.payment_history) ? existingEntry.payment_history : [];
    const existingNumbers = collectExistingOrNumbers(nextCache);
    const matchingItems = priorHistory.filter((item) =>
      field === "TotalBalance"
        ? (item?.semester || effectiveSemester) === effectiveSemester
        : item?.field === field && (item?.semester || effectiveSemester) === effectiveSemester
    );

    matchingItems.forEach((item) => {
      const currentOr = normalizeOrNumber(item?.or_number);
      if (currentOr) {
        existingNumbers.delete(currentOr);
      }
    });

    const priorStageOr = normalizeOrNumber(existingEntry?.stage_or_numbers?.[field]);
    if (priorStageOr) {
      existingNumbers.delete(priorStageOr);
    }

    if (field === "TotalBalance") {
      const priorReceiptOr = normalizeOrNumber(existingEntry?.official_receipt);
      if (priorReceiptOr) {
        existingNumbers.delete(priorReceiptOr);
      }
    }

    if (existingNumbers.has(normalizedOrNumber)) {
      throw new Error(`${normalizedOrNumber} already exists. Enter a unique OR Number.`);
    }

    const nextHistory = priorHistory.map((item) =>
      field === "TotalBalance"
        ? ((item?.semester || effectiveSemester) === effectiveSemester
          ? { ...item, or_number: normalizedOrNumber }
          : item)
        : (item?.field === field && (item?.semester || effectiveSemester) === effectiveSemester
          ? { ...item, or_number: normalizedOrNumber }
          : item)
    );

    const nextStageOrNumbers = {
      ...(existingEntry.stage_or_numbers || {}),
      [field]: normalizedOrNumber,
    };

    nextCache[cacheKey] = {
      ...existingEntry,
      stage_or_numbers: nextStageOrNumbers,
      official_receipt: field === "TotalBalance" ? normalizedOrNumber : existingEntry.official_receipt,
      payment_history: nextHistory,
    };
    savePaymentDetailCache(nextCache);

    setStudents((prev) =>
      prev.map((item) =>
        getStudentRowKey(item) === getStudentRowKey(student)
          ? normalizeStudentFinancials({
              ...item,
              stage_or_numbers: nextStageOrNumbers,
              official_receipt: field === "TotalBalance" ? normalizedOrNumber : item.official_receipt,
              payment_history: nextHistory,
            })
          : item
      )
    );
  };

  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
    setNewStudent({ ...INITIAL_STUDENT, SchoolYearID: selectedSchoolYearId, Semester: selectedSemester });
    setAddStudentError("");
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditStudent(null);
  };

  const closeConfirmModal = () => {
    setConfirmState({ show: false, type: null, payload: null });
  };

  const handleSelectSchoolYear = (schoolYear) => {
    if (!schoolYear?.id) {
      return;
    }

    setSelectedSchoolYearId(schoolYear.id);
    setSelectedSemester("");
    setStudents([]);
    setProgramFilter("");
    setYearFilter("");
    setSearchQuery("");
    setActiveTab("home");
  };

  const handleSelectSemester = (semester) => {
    if (!selectedSchoolYearId || !semester) {
      return;
    }

    setSelectedSemester(semester);
    setProgramFilter("");
    setYearFilter("");
    setSearchQuery("");
    setActiveTab("home");
  };

  const handleImportSchoolYearStudents = async (targetSchoolYear, previousSchoolYear) => {
    if (!targetSchoolYear?.id || !previousSchoolYear?.id) {
      return;
    }

    const confirmed = window.confirm("Import student list from previous school year?");
    if (!confirmed) {
      return;
    }

    setImportingSchoolYear(true);
    try {
      await importSchoolYearStudents(targetSchoolYear.id);
      const refreshedSchoolYears = await getSchoolYears();
      if (Array.isArray(refreshedSchoolYears)) {
        setSchoolYears(refreshedSchoolYears);
      }
      alert(`Student list imported from School Year ${previousSchoolYear.label}.`);
    } catch (error) {
      console.error(error);
      alert(error?.message || "Student import failed. Please try again.");
    } finally {
      setImportingSchoolYear(false);
    }
  };

  const handleUploadStudents = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!selectedSchoolYearId || !selectedSemester) {
      alert("Select a school year and semester before uploading students.");
      return;
    }

    setUploadingStudents(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;

      if (!firstSheet) {
        throw new Error("The uploaded workbook does not contain a readable sheet.");
      }

      const rawRows = XLSX.utils.sheet_to_json(firstSheet, {
        defval: "",
        raw: false,
      });

      const preparedRows = rawRows
        .map((row) =>
          normalizeUploadRow(row, {
            schoolYearId: selectedSchoolYearId,
            semester: selectedSemester,
          })
        )
        .filter((student) => student.StudentID && student.Name && student.Program);

      if (preparedRows.length === 0) {
        throw new Error("No valid student rows were found. Required columns include StudentID/USN, Name or surname/given name, and Program.");
      }

      const existingById = new Map(
        students.map((student) => [
          String(student.OriginalStudentID || student.StudentID || "").trim(),
          student,
        ])
      );

      for (const student of preparedRows) {
        const existing = existingById.get(String(student.OriginalStudentID || student.StudentID).trim());
        if (existing) {
          await updateStudent({
            ...existing,
            ...student,
            id: existing.id,
          });
        } else {
          await createStudent(student);
        }
      }

      const refreshed = await getStudents(selectedSchoolYearId, selectedSemester);
      setStudents(
        Array.isArray(refreshed)
          ? refreshed.map((student) => normalizeStudentFinancials(student))
          : []
      );
      alert(`${preparedRows.length} student record${preparedRows.length === 1 ? "" : "s"} uploaded successfully.`);
    } catch (error) {
      console.error(error);
      alert(error?.message || "Student upload failed. Please try again.");
    } finally {
      setUploadingStudents(false);
    }
  };

  const handleCreateSchoolYear = async ({ importPreviousStudents, startYear }) => {
    setCreatingSchoolYear(true);
    setCreateSchoolYearError("");
    try {
      const result = await createSchoolYear(importPreviousStudents, startYear);
      const nextSchoolYearsResponse = Array.isArray(result?.school_years)
        ? result.school_years
        : await getSchoolYears();
      const nextSchoolYears = Array.isArray(nextSchoolYearsResponse) ? nextSchoolYearsResponse : [];
      setSchoolYears(nextSchoolYears);

      const createdSchoolYear = result?.school_year || null;
      if (createdSchoolYear?.id) {
        setSelectedSchoolYearId(0);
        setSelectedSemester("");
      }

      setShowCreateSchoolYearModal(false);
    } catch (error) {
      console.error(error);
      setCreateSchoolYearError(error?.message || "School year creation failed. Please try again.");
    } finally {
      setCreatingSchoolYear(false);
    }
  };

  const handleBackToSchoolYearSelection = () => {
    setSelectedSchoolYearId(0);
    setSelectedSemester("");
    setStudents([]);
    setSearchQuery("");
    setProgramFilter("");
    setYearFilter("");
    setActiveTab("home");
    setShowAddStudentModal(false);
    setShowEditModal(false);
    setShowPaymentModal(false);
    setSelectedStudent(null);
    setEditStudent(null);
    setAddStudentError("");
    setSchoolYearSelectionMode(false);
    setSelectedSchoolYearIdsForRemoval([]);
    setSchoolYearDeleteConfirm(false);
  };

  const toggleSchoolYearSelectionMode = () => {
    setSchoolYearSelectionMode((prev) => !prev);
    setSelectedSchoolYearIdsForRemoval([]);
  };

  const toggleSchoolYearSelection = (schoolYear) => {
    if (!schoolYear?.id) {
      return;
    }

    setSelectedSchoolYearIdsForRemoval((prev) =>
      prev.includes(schoolYear.id)
        ? prev.filter((item) => item !== schoolYear.id)
        : [...prev, schoolYear.id]
    );
  };

  const selectedSchoolYearsForRemoval = schoolYears.filter((item) =>
    selectedSchoolYearIdsForRemoval.includes(item.id)
  );

  const handleRequestDeleteSchoolYears = () => {
    if (selectedSchoolYearIdsForRemoval.length === 0) {
      return;
    }

    setSchoolYearDeleteConfirm(true);
  };

  const handleDeleteSelectedSchoolYears = async () => {
    if (selectedSchoolYearIdsForRemoval.length === 0) {
      return;
    }

    try {
      await deleteSchoolYears(selectedSchoolYearIdsForRemoval);
      const refreshedSchoolYears = await getSchoolYears();
      const nextSchoolYears = Array.isArray(refreshedSchoolYears) ? refreshedSchoolYears : [];
      setSchoolYears(nextSchoolYears);
      setSchoolYearSelectionMode(false);
      setSelectedSchoolYearIdsForRemoval([]);
      setSchoolYearDeleteConfirm(false);
    } catch (error) {
      console.error(error);
      alert(error?.message || "School year removal failed. Please try again.");
    }
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

  if (!selectedSchoolYearId || !selectedSemester) {
    return (
      <div className={`dashboard ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <Header
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          viewTitle="School Years"
          viewDescription="Select a school year and semester to enter the system."
          userName={authUser?.name}
          studentCount={0}
          schoolYearLabel=""
          showBackButton={false}
        />
        <main className="main-content school-year-gate-main">
          <SchoolYearsPage
            schoolYears={schoolYears}
            selectedSchoolYearId={selectedSchoolYearId}
            onSelectSchoolYear={handleSelectSchoolYear}
            selectedSemester={selectedSemester}
            onSelectSemester={handleSelectSemester}
            onImportStudents={handleImportSchoolYearStudents}
            importLoading={importingSchoolYear}
            onCreateSchoolYear={() => setShowCreateSchoolYearModal(true)}
            selectionMode={schoolYearSelectionMode}
            selectedSchoolYearIds={selectedSchoolYearIdsForRemoval}
            onToggleSelectionMode={toggleSchoolYearSelectionMode}
            onToggleSchoolYearSelection={toggleSchoolYearSelection}
            onRequestDeleteSelected={handleRequestDeleteSchoolYears}
          />
          <CreateSchoolYearModal
            show={showCreateSchoolYearModal}
            onClose={() => {
              setShowCreateSchoolYearModal(false);
              setCreateSchoolYearError("");
            }}
            onSubmit={handleCreateSchoolYear}
            creating={creatingSchoolYear}
            existingSchoolYears={schoolYears}
            errorMessage={createSchoolYearError}
          />
          <ConfirmModal
            show={schoolYearDeleteConfirm}
            title="Delete School Year Records"
            message="Are you sure you want to delete the selected School Year record(s)? This action is sensitive and may remove related student and financial context."
            details={[
              `Selected School Years: ${selectedSchoolYearsForRemoval.map((item) => item.label).join(", ")}`,
              "Review carefully before continuing.",
              "Deleting historical records can affect reporting, imports, and semester access.",
            ]}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={handleDeleteSelectedSchoolYears}
            onCancel={() => setSchoolYearDeleteConfirm(false)}
          />
        </main>
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
        schoolYearLabel={activeContextLabel}
        showBackButton={activeTab === "home"}
        onBack={handleBackToSchoolYearSelection}
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
        <HomeDashboard
          setActiveTab={setActiveTab}
          onBackToSchoolYears={handleBackToSchoolYearSelection}
        />
      )}

      {activeTab === 'studentFee' && (
        <>
          <UploadSection 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isManageTab={false}
            panelVariant="student-actions"
            sectionTitle="Student Fee"
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
            yearFilter={yearFilter}
            onYearFilterChange={setYearFilter}
            noteText="Search by student and process collections with fewer clicks."
          />
          <StudentFeeTable 
            students={students}
            filteredStudents={filteredStudents}
            onPaid={handlePaid}
            onRemind={handleRemind}
            onRemindSelected={handleSendRemindersAtOnce}
            onUpdatePaymentOrNumber={handleUpdatePaymentOrNumber}
            sendingReminder={sendingReminder}
            activeSemester={selectedSemester}
            onRequestCarryOver={handleRequestCarryOver}
            isCarryOverAvailable={(student) => getCarryOverEligibility(student).isClickable}
          />
        </>
      )}

      {activeTab === 'manageStudent' && (
        <>
          <UploadSection 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isManageTab={true}
            panelVariant="student-actions"
            sectionTitle="Student Actions"
            onAddStudent={() => {
              setNewStudent({ ...INITIAL_STUDENT, SchoolYearID: selectedSchoolYearId, Semester: selectedSemester });
              setShowAddStudentModal(true);
            }}
            programFilter={programFilter}
            onProgramFilterChange={setProgramFilter}
            yearFilter={yearFilter}
            onYearFilterChange={setYearFilter}
            noteText="Keep the roster current by adding, editing, or removing records from one workspace."
            onUploadStudents={handleUploadStudents}
            uploadingStudents={uploadingStudents}
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
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isManageTab={true}
            panelVariant="student-actions"
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
        existingOrNumbers={existingOrNumbers}
        activeSchoolYearLabel={selectedSchoolYear?.label || ""}
        activeSemester={selectedSemester}
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

      {carryOverModalState.open ? (
        <div
          className="modal"
          onClick={() =>
            !carryOverModalState.loading &&
            setCarryOverModalState({
              open: false,
              student: null,
              secondSemesterStudent: null,
              status: CARRY_OVER_STATUS.NOT_CARRIED,
              loading: false,
            })
          }
        >
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <h2>Confirm Carry Over</h2>
            <p>
              This remaining balance will be added to the student&apos;s 2nd Semester fee/downpayment.
            </p>
            {carryOverModalState.student ? (
              <div className="confirm-detail-list">
                <p>{`Student Name: ${carryOverModalState.student.Name || "N/A"}`}</p>
                <p>{`School Year: ${selectedSchoolYear?.label || "N/A"}`}</p>
                <p>{`Current Semester: ${selectedSemester || "N/A"}`}</p>
                <p>{`Remaining Balance: PHP ${Number(carryOverModalState.student.TotalBalance || 0).toLocaleString("en-PH")}`}</p>
                <p>Destination: 2nd Semester</p>
                <p>
                  {carryOverModalState.status === CARRY_OVER_STATUS.CARRIED_OVER
                    ? "This balance was already carried over."
                    : carryOverModalState.status === CARRY_OVER_STATUS.PAID
                      ? "This carried-over balance has already been paid."
                      : "The previous semester balance will be locked as a required fee line in 2nd Semester."}
                </p>
              </div>
            ) : null}
            <div className="modal-buttons">
              <button
                className="save-btn"
                type="button"
                onClick={handleConfirmCarryOver}
                disabled={
                  carryOverModalState.loading ||
                  carryOverModalState.status !== CARRY_OVER_STATUS.NOT_CARRIED
                }
              >
                {carryOverModalState.loading
                  ? "Saving..."
                  : carryOverModalState.status === CARRY_OVER_STATUS.NOT_CARRIED
                    ? "Confirm Carry Over"
                    : "Already Carried Over"}
              </button>
              <button
                className="close-btn"
                type="button"
                onClick={() =>
                  setCarryOverModalState({
                    open: false,
                    student: null,
                    secondSemesterStudent: null,
                    status: CARRY_OVER_STATUS.NOT_CARRIED,
                    loading: false,
                  })
                }
                disabled={carryOverModalState.loading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
