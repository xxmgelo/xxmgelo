const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost/aclcapi/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = (data && data.error) || response.statusText;
    throw new Error(message);
  }

  return data;
}

export async function getStudents() {
  return request("/students.php");
}

export async function createStudent(student) {
  const result = await request("/students.php", {
    method: "POST",
    body: JSON.stringify(student),
  });

  return result && result.student ? result.student : student;
}

export async function updateStudent(student) {
  const result = await request("/student.php", {
    method: "PUT",
    body: JSON.stringify(student),
  });

  return result && result.student ? result.student : student;
}

export async function deleteStudent(studentId) {
  return request(`/student.php?student_id=${encodeURIComponent(studentId)}`, {
    method: "DELETE",
  });
}

export async function upsertStudents(students) {
  return request("/students_bulk.php", {
    method: "POST",
    body: JSON.stringify(students),
  });
}
