const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost/aclcapi/api";

const isPendingUsnDisplay = (value) => String(value ?? "").trim().toUpperCase() === "N/A";

const resolveStudentId = (student = {}) =>
  (isPendingUsnDisplay(student.StudentID) ? student.OriginalStudentID : student.StudentID) ??
  student.OriginalStudentID ??
  student.student_id ??
  student.studentId ??
  student.id_number ??
  student.IDNumber ??
  student.IdNumber ??
  student.usn ??
  student.USN ??
  student.student_no ??
  student.StudentNo ??
  student.student_number ??
  student.StudentNumber ??
  "";

function toStudentPayload(student = {}) {
  const resolvedStudentId = resolveStudentId(student);
  const visibleStudentId = String(student.StudentID ?? "").trim();

  return {
    StudentID: isPendingUsnDisplay(visibleStudentId) ? "" : resolvedStudentId,
    OriginalStudentID: student.OriginalStudentID ?? student.original_student_id ?? resolvedStudentId,
    Name: student.Name ?? student.name ?? "",
    Surname: student.Surname ?? student.surname ?? "",
    GivenName: student.GivenName ?? student.given_name ?? student.givenName ?? "",
    Initial: student.Initial ?? student.initial ?? "",
    SchoolYearID: student.SchoolYearID ?? student.school_year_id ?? 0,
    Semester: student.Semester ?? student.semester ?? "",
    Program: student.Program ?? student.program ?? "",
    YearLevel: student.YearLevel ?? student.year_level ?? "",
    Gmail: student.Gmail ?? student.gmail ?? "",
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const normalizedText = text.replace(/^\uFEFF/, "");
  let data = null;
  if (normalizedText) {
    try {
      data = JSON.parse(normalizedText);
    } catch (error) {
      data = null;
    }
  }

  if (!response.ok) {
    const baseMessage = (data && data.error) || response.statusText;
    const detailMessage = data && data.details ? ` ${String(data.details)}` : "";
    const message = `${baseMessage}${detailMessage}`.trim();
    throw new Error(message);
  }

  return data;
}

export async function getSchoolYears() {
  return request("/school_years.php");
}

export async function importSchoolYearStudents(targetSchoolYearId) {
  return request("/school_years.php", {
    method: "POST",
    body: JSON.stringify({
      action: "import_students",
      target_school_year_id: targetSchoolYearId,
    }),
  });
}

export async function createSchoolYear(importPreviousStudents = false, startYear = 0) {
  return request("/school_years.php", {
    method: "POST",
    body: JSON.stringify({
      action: "create_school_year",
      import_previous_students: importPreviousStudents,
      start_year: startYear,
    }),
  });
}

export async function deleteSchoolYears(schoolYearIds) {
  return request("/school_years.php", {
    method: "POST",
    body: JSON.stringify({
      action: "delete_school_years",
      school_year_ids: schoolYearIds,
    }),
  });
}

export async function getStudents(schoolYearId, semester = "") {
  const schoolYearQuery = schoolYearId ? `&school_year_id=${encodeURIComponent(schoolYearId)}` : "";
  const semesterQuery = semester ? `&semester=${encodeURIComponent(semester)}` : "";
  return request(`/students.php?view=full${schoolYearQuery}${semesterQuery}`);
}

export async function createStudent(student) {
  const payload = toStudentPayload(student);

  const result = await request("/students.php?view=full", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return result && result.student ? result.student : student;
}

export async function updateStudent(student) {
  const result = await request("/students.php?view=full", {
    method: "PUT",
    body: JSON.stringify(student),
  });

  return result && result.student ? result.student : student;
}

export async function deleteStudent(student) {
  const rowId = typeof student === "object" ? student.id ?? student.ID ?? 0 : 0;
  const studentId = typeof student === "object" ? resolveStudentId(student) : student;
  const schoolYearId =
    typeof student === "object" ? student.SchoolYearID ?? student.school_year_id ?? 0 : 0;
  const semester =
    typeof student === "object" ? student.Semester ?? student.semester ?? "" : "";
  const queryParts = [];

  if (rowId) {
    queryParts.push(`id=${encodeURIComponent(rowId)}`);
  }
  if (studentId) {
    queryParts.push(`student_id=${encodeURIComponent(studentId)}`);
  }
  if (schoolYearId) {
    queryParts.push(`school_year_id=${encodeURIComponent(schoolYearId)}`);
  }
  if (semester) {
    queryParts.push(`semester=${encodeURIComponent(semester)}`);
  }

  const query = queryParts.join("&");

  return request(`/students.php?${query}&view=full`, {
    method: "DELETE",
  });
}

export async function upsertStudents(students) {
  return request("/students_bulk.php?view=full", {
    method: "POST",
    body: JSON.stringify(students),
  });
}

export async function adminLogin(identifier, password) {
  return request("/admin_login.php", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export async function getAdmins() {
  return request("/admins.php");
}

export async function createAdmin(admin) {
  return request("/admins.php", {
    method: "POST",
    body: JSON.stringify(admin),
  });
}

export async function updateAdminProfile(profile) {
  return request("/admins.php", {
    method: "PUT",
    body: JSON.stringify({
      action: "update_profile",
      ...profile,
    }),
  });
}

export async function updateAdminPassword(payload) {
  return request("/admins.php", {
    method: "PUT",
    body: JSON.stringify({
      action: "update_password",
      ...payload,
    }),
  });
}

export async function sendPaymentReminder(payload) {
  return request("/reminders.php", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendPaymentReceipt(payload) {
  return request("/payment_receipts.php", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
