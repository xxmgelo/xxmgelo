const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost/aclcapi/api";

function toStudentPayload(student = {}) {
  return {
    StudentID: student.StudentID ?? student.student_id ?? "",
    Name: student.Name ?? student.name ?? "",
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
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
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

export async function getStudents() {
  return request("/students.php?view=full");
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

export async function deleteStudent(studentId) {
  return request(`/students.php?student_id=${encodeURIComponent(studentId)}&view=full`, {
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
