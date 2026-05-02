$remindersPath = 'C:\xampp\htdocs\aclcapi\api\reminders.php'
$receiptsPath = 'C:\xampp\htdocs\aclcapi\api\payment_receipts.php'

$reminders = Get-Content -Raw $remindersPath
$receipts = Get-Content -Raw $receiptsPath

$reminders = $reminders.Replace(
@'
$program_hint = trim((string)($data["Program"] ?? ""));
'@,
@'
$program_hint = trim((string)($data["Program"] ?? ""));
$school_year_id = (int)($data["SchoolYearID"] ?? $data["school_year_id"] ?? 0);
$semester = trim((string)($data["Semester"] ?? $data["semester"] ?? "1st Semester"));
'@
)

$reminders = $reminders.Replace(
    '$resolved_student = find_student_for_mail_reminder($db, $student_id, $program_hint);',
    '$resolved_student = find_student_for_mail_reminder($db, $student_id, $program_hint, $school_year_id, $semester);'
)

$reminders = [regex]::Replace(
    $reminders,
    'function find_student_for_mail_reminder\([\s\S]*?return \$rows\[0\];\r?\n}',
@'
function find_student_for_mail_reminder($db, $student_id, $program_hint = "", $school_year_id = 0, $semester = "1st Semester")
{
    $semesterFilter = " AND semester = ?";
    $schoolYearFilter = $school_year_id > 0 ? " AND school_year_id = ?" : "";

    $stmt = $db->prepare(
        "SELECT 'bse_students' AS source_table, bse_students.student_id, bse_students.name, bse_students.program, bse_students.gmail, COALESCE(bse_students.can_remind, 0) AS can_remind, bse_students.school_year_id, bse_students.semester
         FROM bse_students
         WHERE bse_students.student_id = ?{$semesterFilter}{$schoolYearFilter}
         UNION ALL
         SELECT 'bsis_students' AS source_table, bsis_students.student_id, bsis_students.name, bsis_students.program, bsis_students.gmail, COALESCE(bsis_students.can_remind, 0) AS can_remind, bsis_students.school_year_id, bsis_students.semester
         FROM bsis_students
         WHERE bsis_students.student_id = ?{$semesterFilter}{$schoolYearFilter}"
    );

    if (!$stmt) {
        return null;
    }

    if ($school_year_id > 0) {
        $stmt->bind_param("sisisi", $student_id, $semester, $school_year_id, $student_id, $semester, $school_year_id);
    } else {
        $stmt->bind_param("ssss", $student_id, $semester, $student_id, $semester);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $rows = [];
    while ($result && ($row = $result->fetch_assoc())) {
        $rows[] = $row;
    }
    $stmt->close();

    if (count($rows) === 0) {
        return null;
    }

    if ($program_hint !== "") {
        $normalized_hint = strtolower($program_hint);
        foreach ($rows as $row) {
            if (strpos(strtolower((string)$row["program"]), $normalized_hint) !== false) {
                return $row;
            }
        }
    }

    return $rows[0];
}
'@
)

$reminders = [regex]::Replace(
    $reminders,
    'function set_can_remind_flag_after_send\([\s\S]*?return \$ok;\r?\n}',
@'
function set_can_remind_flag_after_send($db, $source_table, $student_id, $school_year_id, $semester, $value)
{
    $flag = (int)$value;
    $safeTable = $source_table === "bse_students" ? "bse_students" : ($source_table === "bsis_students" ? "bsis_students" : "");
    if ($safeTable === "") {
        return false;
    }

    $stmt = $db->prepare("UPDATE {$safeTable} SET can_remind = ? WHERE student_id = ? AND school_year_id = ? AND semester = ?");
    if (!$stmt) {
        return false;
    }

    $stmt->bind_param("isis", $flag, $student_id, $school_year_id, $semester);
    $ok = $stmt->execute();
    $stmt->close();
    return $ok;
}
'@
)

$reminders = $reminders.Replace(
@'
        "SELECT student_id, name, program, gmail FROM bse_students WHERE LOWER(TRIM(gmail)) = LOWER(TRIM(?))
         UNION ALL
         SELECT student_id, name, program, gmail FROM bsis_students WHERE LOWER(TRIM(gmail)) = LOWER(TRIM(?))"
'@,
@'
        "SELECT student_id, name, program, gmail, school_year_id, semester FROM bse_students WHERE LOWER(TRIM(gmail)) = LOWER(TRIM(?))
         UNION ALL
         SELECT student_id, name, program, gmail, school_year_id, semester FROM bsis_students WHERE LOWER(TRIM(gmail)) = LOWER(TRIM(?))"
'@
)

$reminders = [regex]::Replace(
    $reminders,
    'function gmail_reminder_is_shared_with_other_students\([\s\S]*?\r?\n}\r?\n\r?\nfunction build_reminder_html',
@'
function gmail_reminder_is_shared_with_other_students($rows, $current_student_id)
{
    $normalizedCurrentStudentId = trim((string)$current_student_id);
    $resolvedNames = [];
    $resolvedRows = [];
    $unresolvedRows = [];

    foreach ($rows as $row) {
        $studentId = trim((string)($row["student_id"] ?? ""));
        if ($studentId === "") {
            continue;
        }

        if (is_unresolved_student_identifier_reminder($studentId)) {
            $unresolvedRows[] = $row;
            continue;
        }

        if ($studentId !== $normalizedCurrentStudentId) {
            $resolvedNames[] = strtolower(trim((string)($row["name"] ?? "")));
        }

        $resolvedNames[] = strtolower(trim((string)($row["name"] ?? "")));
        $resolvedRows[] = $row;
    }

    if (count($resolvedRows) === 0) {
        return false;
    }

    $reference = $resolvedRows[0];
    $referenceName = strtolower(trim((string)($reference["name"] ?? "")));

    foreach ($resolvedRows as $row) {
        $rowName = strtolower(trim((string)($row["name"] ?? "")));
        if ($rowName !== $referenceName) {
            return true;
        }
    }

    foreach ($unresolvedRows as $row) {
        $rowName = strtolower(trim((string)($row["name"] ?? "")));
        if ($rowName !== $referenceName) {
            return true;
        }
    }

    return false;
}

function build_reminder_html
'@
)

$reminders = $reminders.Replace(
    '    set_can_remind_flag_after_send($db, $source_table, $student_id, 0);',
    '    set_can_remind_flag_after_send($db, $source_table, $student_id, $school_year_id, $semester, 0);'
)

$receipts = $receipts.Replace(
@'
$program_hint = trim((string)($data["Program"] ?? ""));
'@,
@'
$program_hint = trim((string)($data["Program"] ?? ""));
$school_year_id = (int)($data["SchoolYearID"] ?? $data["school_year_id"] ?? 0);
$semester = trim((string)($data["Semester"] ?? $data["semester"] ?? "1st Semester"));
'@
)

$receipts = $receipts.Replace(
    '$resolved_student = find_student_for_mail_receipt($db, $student_id, $program_hint);',
    '$resolved_student = find_student_for_mail_receipt($db, $student_id, $program_hint, $school_year_id, $semester);'
)

$receipts = [regex]::Replace(
    $receipts,
    'function find_student_for_mail_receipt\([\s\S]*?return \$rows\[0\];\r?\n}',
@'
function find_student_for_mail_receipt($db, $student_id, $program_hint = "", $school_year_id = 0, $semester = "1st Semester")
{
    $semesterFilter = " AND semester = ?";
    $schoolYearFilter = $school_year_id > 0 ? " AND school_year_id = ?" : "";

    $stmt = $db->prepare(
        "SELECT student_id, name, program, gmail, school_year_id, semester FROM bse_students WHERE student_id = ?{$semesterFilter}{$schoolYearFilter}
         UNION ALL
         SELECT student_id, name, program, gmail, school_year_id, semester FROM bsis_students WHERE student_id = ?{$semesterFilter}{$schoolYearFilter}"
    );

    if (!$stmt) {
        return null;
    }

    if ($school_year_id > 0) {
        $stmt->bind_param("sisisi", $student_id, $semester, $school_year_id, $student_id, $semester, $school_year_id);
    } else {
        $stmt->bind_param("ssss", $student_id, $semester, $student_id, $semester);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $rows = [];
    while ($result && ($row = $result->fetch_assoc())) {
        $rows[] = $row;
    }
    $stmt->close();

    if (count($rows) === 0) {
        return null;
    }

    if ($program_hint !== "") {
        $normalized_hint = strtolower($program_hint);
        foreach ($rows as $row) {
            if (strpos(strtolower((string)$row["program"]), $normalized_hint) !== false) {
                return $row;
            }
        }
    }

    return $rows[0];
}
'@
)

$receipts = $receipts.Replace(
@'
        "SELECT student_id, name, program, gmail FROM bse_students WHERE LOWER(TRIM(gmail)) = LOWER(TRIM(?))
         UNION ALL
         SELECT student_id, name, program, gmail FROM bsis_students WHERE LOWER(TRIM(gmail)) = LOWER(TRIM(?))"
'@,
@'
        "SELECT student_id, name, program, gmail, school_year_id, semester FROM bse_students WHERE LOWER(TRIM(gmail)) = LOWER(TRIM(?))
         UNION ALL
         SELECT student_id, name, program, gmail, school_year_id, semester FROM bsis_students WHERE LOWER(TRIM(gmail)) = LOWER(TRIM(?))"
'@
)

$receipts = [regex]::Replace(
    $receipts,
    'function gmail_receipt_is_shared_with_other_students\([\s\S]*?\r?\n}\r?\n\r?\nfunction build_payment_receipt_html',
@'
function gmail_receipt_is_shared_with_other_students($rows, $current_student_id)
{
    $normalizedCurrentStudentId = trim((string)$current_student_id);
    $resolvedRows = [];
    $unresolvedRows = [];

    foreach ($rows as $row) {
        $studentId = trim((string)($row["student_id"] ?? ""));
        if ($studentId === "") {
            continue;
        }

        if (is_unresolved_student_identifier_receipt($studentId)) {
            $unresolvedRows[] = $row;
            continue;
        }

        $resolvedRows[] = $row;
    }

    if (count($resolvedRows) === 0) {
        return false;
    }

    $reference = $resolvedRows[0];
    $referenceName = strtolower(trim((string)($reference["name"] ?? "")));

    foreach ($resolvedRows as $row) {
        $rowName = strtolower(trim((string)($row["name"] ?? "")));
        if ($rowName !== $referenceName) {
            return true;
        }
    }

    foreach ($unresolvedRows as $row) {
        $rowName = strtolower(trim((string)($row["name"] ?? "")));
        if ($rowName !== $referenceName) {
            return true;
        }
    }

    return false;
}

function build_payment_receipt_html
'@
)

Set-Content -Path $remindersPath -Value $reminders -NoNewline
Set-Content -Path $receiptsPath -Value $receipts -NoNewline
