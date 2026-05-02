$studentsPath = 'C:\xampp\htdocs\aclcapi\api\students.php'
$lines = Get-Content -Path $studentsPath

# Remove student_financials joins/selects in students.php
$raw = [string]::Join("`r`n", $lines)
$raw = $raw.Replace(@"
SELECT s.*, sy.label AS school_year_label,
                   f.total_fee, f.base_total_fee, f.discount_percent, f.downpayment, f.prelim, f.midterm,
                   f.pre_final, f.finals, f.total_balance, f.payment_mode, f.full_payment_amount, f.can_remind,
                   f.downpayment_date, f.prelim_date, f.midterm_date, f.prefinal_date, f.final_date, f.total_balance_date,
                   f.downpayment_paid_amount, f.prelim_paid_amount, f.midterm_paid_amount, f.prefinal_paid_amount,
                   f.final_paid_amount, f.total_balance_paid_amount
            FROM (
                SELECT * FROM bse_students
                UNION ALL
                SELECT * FROM bsis_students
            ) AS s
            LEFT JOIN school_years sy ON sy.id = s.school_year_id
            LEFT JOIN student_financials f ON f.student_id = s.student_id AND f.school_year_id = s.school_year_id AND f.semester = s.semester
"@, @"
SELECT s.*, sy.label AS school_year_label
            FROM (
                SELECT * FROM bse_students
                UNION ALL
                SELECT * FROM bsis_students
            ) AS s
            LEFT JOIN school_years sy ON sy.id = s.school_year_id
"@)
$raw = $raw.Replace(@"
    $db->query(
        "INSERT IGNORE INTO student_financials (student_id, school_year_id, semester) VALUES ('" . $db->real_escape_string($student_id) . "', " . (int)$school_year_id . ", '" . $db->real_escape_string($semester) . "')"
    );

    $result = $db->query(
        "SELECT s.*, sy.label AS school_year_label,
                f.total_fee, f.base_total_fee, f.discount_percent, f.downpayment, f.prelim, f.midterm,
                f.pre_final, f.finals, f.total_balance, f.payment_mode, f.full_payment_amount, f.can_remind,
                f.downpayment_date, f.prelim_date, f.midterm_date, f.prefinal_date, f.final_date, f.total_balance_date,
                f.downpayment_paid_amount, f.prelim_paid_amount, f.midterm_paid_amount, f.prefinal_paid_amount,
                f.final_paid_amount, f.total_balance_paid_amount, f.carry_over_amount, f.carry_over_from_semester
         FROM {$target} s
         LEFT JOIN school_years sy ON sy.id = s.school_year_id
         LEFT JOIN student_financials f ON f.student_id = s.student_id AND f.school_year_id = s.school_year_id AND f.semester = s.semester
         WHERE s.id = " . (int)$new_id
    );
"@, @"
    $result = $db->query(
        "SELECT s.*, sy.label AS school_year_label
         FROM {$target} s
         LEFT JOIN school_years sy ON sy.id = s.school_year_id
         WHERE s.id = " . (int)$new_id
    );
"@)
$raw = $raw.Replace(@"
    $financeDelete = $db->prepare("DELETE FROM student_financials WHERE student_id = ? AND school_year_id = ? AND semester = ?");
    if ($financeDelete) {
        $financeDelete->bind_param("sis", $row["student_id"], $row["school_year_id"], $semester);
        $financeDelete->execute();
        $financeDelete->close();
    }

"@, "")
$raw = $raw.Replace(@"
SELECT s.*, sy.label AS school_year_label,
                f.total_fee, f.base_total_fee, f.discount_percent, f.downpayment, f.prelim, f.midterm,
                f.pre_final, f.finals, f.total_balance, f.payment_mode, f.full_payment_amount, f.can_remind,
                f.downpayment_date, f.prelim_date, f.midterm_date, f.prefinal_date, f.final_date, f.total_balance_date,
                f.downpayment_paid_amount, f.prelim_paid_amount, f.midterm_paid_amount, f.prefinal_paid_amount,
                f.final_paid_amount, f.total_balance_paid_amount, f.carry_over_amount, f.carry_over_from_semester
         FROM {$table} s
         LEFT JOIN school_years sy ON sy.id = s.school_year_id
         LEFT JOIN student_financials f ON f.student_id = s.student_id AND f.school_year_id = s.school_year_id AND f.semester = s.semester
"@, @"
SELECT s.*, sy.label AS school_year_label
         FROM {$table} s
         LEFT JOIN school_years sy ON sy.id = s.school_year_id
"@)
$raw = $raw.Replace(@"
"SELECT s.*, sy.label AS school_year_label,
                f.total_fee, f.base_total_fee, f.discount_percent, f.downpayment, f.prelim, f.midterm,
                f.pre_final, f.finals, f.total_balance, f.payment_mode, f.full_payment_amount, f.can_remind,
                f.downpayment_date, f.prelim_date, f.midterm_date, f.prefinal_date, f.final_date, f.total_balance_date,
                f.downpayment_paid_amount, f.prelim_paid_amount, f.midterm_paid_amount, f.prefinal_paid_amount,
                f.final_paid_amount, f.total_balance_paid_amount, f.carry_over_amount, f.carry_over_from_semester
         FROM {$record["table"]} s
         LEFT JOIN school_years sy ON sy.id = s.school_year_id
         LEFT JOIN student_financials f ON f.student_id = s.student_id AND f.school_year_id = s.school_year_id AND f.semester = s.semester
         WHERE s.student_id = '" . $db->real_escape_string($student_id) . "'
           AND s.school_year_id = " . (int)$school_year_id . "
           AND s.semester = '" . $db->real_escape_string($semester) . "'
         LIMIT 1"
"@, @"
"SELECT s.*, sy.label AS school_year_label
         FROM {$record["table"]} s
         LEFT JOIN school_years sy ON sy.id = s.school_year_id
         WHERE s.student_id = '" . $db->real_escape_string($student_id) . "'
           AND s.school_year_id = " . (int)$school_year_id . "
           AND s.semester = '" . $db->real_escape_string($semester) . "'
         LIMIT 1"
"@)
$lines = $raw -split "`r?`n"

$startLine = ($lines | Select-String -Pattern '^\s*if \(\$currentTable !== \$target\) \{$').LineNumber
$endCandidates = ($lines | Select-String -Pattern '^\s*\$record = find_student_by_student_id\(\$db, \$student_id, \$school_year_id, \$semester\);$').LineNumber
$endLine = ($endCandidates | Where-Object { $_ -gt $startLine } | Select-Object -First 1)
if (-not $startLine -or -not $endLine) { throw 'Could not locate update block boundaries in students.php' }

$newBlock = @'
    if ($currentTable !== $target) {
        $deleteStmt = $db->prepare("DELETE FROM {$currentTable} WHERE student_id = ? AND school_year_id = ? AND semester = ?");
        if ($deleteStmt) {
            $currentSchoolYearId = (int)($existingRow["school_year_id"] ?? 0);
            $currentSemester = trim((string)($existingRow["semester"] ?? "1st Semester"));
            $deleteStmt->bind_param("sis", $current_student_id, $currentSchoolYearId, $currentSemester);
            $deleteStmt->execute();
            $deleteStmt->close();
        }

        $insertStmt = $db->prepare(
            "INSERT INTO {$target}
            (student_id, name, program, year_level, gmail, school_year_id, semester, total_fee, base_total_fee, discount_percent, downpayment, prelim, midterm, pre_final, finals, total_balance, payment_mode, full_payment_amount, carry_over_amount, carry_over_from_semester, can_remind,
             downpayment_date, prelim_date, midterm_date, prefinal_date, final_date, total_balance_date,
             downpayment_paid_amount, prelim_paid_amount, midterm_paid_amount, prefinal_paid_amount, final_paid_amount, total_balance_paid_amount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        if (!$insertStmt) {
            respond(["error" => "Failed to move student"], 500);
        }
        $insertStmt->bind_param(
            "sssssisdddddddddsdissssssssssss",
            $student_id,
            $name,
            $program,
            $year_level,
            $gmail,
            $school_year_id,
            $semester,
            $financials["total_fee"],
            $financials["base_total_fee"],
            $financials["discount_percent"],
            $financials["downpayment"],
            $financials["prelim"],
            $financials["midterm"],
            $financials["pre_final"],
            $financials["finals"],
            $financials["total_balance"],
            $financials["payment_mode"],
            $financials["full_payment_amount"],
            $financials["carry_over_amount"],
            $financials["carry_over_from_semester"],
            $can_remind,
            $downpayment_date,
            $prelim_date,
            $midterm_date,
            $prefinal_date,
            $final_date,
            $total_balance_date,
            $downpayment_paid_amount,
            $prelim_paid_amount,
            $midterm_paid_amount,
            $prefinal_paid_amount,
            $final_paid_amount,
            $total_balance_paid_amount
        );
        if (!$insertStmt->execute()) {
            error_log("students.php move insert failed: " . $insertStmt->error);
            respond(["error" => "Failed to move student", "details" => $insertStmt->error], 500);
        }
        $insertStmt->close();
    } else {
        $stmt = $db->prepare(
            "UPDATE {$currentTable}
             SET student_id = ?, name = ?, program = ?, year_level = ?, gmail = ?, school_year_id = ?, semester = ?,
                 total_fee = ?, base_total_fee = ?, discount_percent = ?,
                 downpayment = ?, prelim = ?, midterm = ?, pre_final = ?, finals = ?,
                 total_balance = ?, payment_mode = ?, full_payment_amount = ?, carry_over_amount = ?, carry_over_from_semester = ?, can_remind = ?,
                 downpayment_date = ?, prelim_date = ?, midterm_date = ?, prefinal_date = ?, final_date = ?, total_balance_date = ?,
                 downpayment_paid_amount = ?, prelim_paid_amount = ?, midterm_paid_amount = ?, prefinal_paid_amount = ?, final_paid_amount = ?, total_balance_paid_amount = ?
             WHERE student_id = ? AND school_year_id = ? AND semester = ?"
        );

        if (!$stmt) {
            respond(["error" => "Failed to prepare update"], 500);
        }

        $currentSchoolYearId = (int)($existingRow["school_year_id"] ?? 0);
        $currentSemester = trim((string)($existingRow["semester"] ?? "1st Semester"));
        $stmt->bind_param(
            "sssssisdddddddddsdisssssssssssssis",
            $student_id,
            $name,
            $program,
            $year_level,
            $gmail,
            $school_year_id,
            $semester,
            $financials["total_fee"],
            $financials["base_total_fee"],
            $financials["discount_percent"],
            $financials["downpayment"],
            $financials["prelim"],
            $financials["midterm"],
            $financials["pre_final"],
            $financials["finals"],
            $financials["total_balance"],
            $financials["payment_mode"],
            $financials["full_payment_amount"],
            $financials["carry_over_amount"],
            $financials["carry_over_from_semester"],
            $can_remind,
            $downpayment_date,
            $prelim_date,
            $midterm_date,
            $prefinal_date,
            $final_date,
            $total_balance_date,
            $downpayment_paid_amount,
            $prelim_paid_amount,
            $midterm_paid_amount,
            $prefinal_paid_amount,
            $final_paid_amount,
            $total_balance_paid_amount,
            $current_student_id,
            $currentSchoolYearId,
            $currentSemester
        );

        if (!$stmt->execute()) {
            error_log("students.php update failed: " . $stmt->error);
            respond(["error" => "Failed to update student", "details" => $stmt->error], 500);
        }

        $stmt->close();
    }
'@ -split "`r?`n"

$prefix = if ($startLine -gt 1) { $lines[0..($startLine - 2)] } else { @() }
$suffix = $lines[($endLine - 1)..($lines.Length - 1)]
$updatedStudents = @($prefix + $newBlock + $suffix)
Set-Content -Path $studentsPath -Value $updatedStudents

$studentsBulk = @'
<?php

require __DIR__ . "/cors.php";
require __DIR__ . "/db.php";
require __DIR__ . "/helpers.php";

$db = db();
$method = $_SERVER["REQUEST_METHOD"];

function resolve_bulk_school_year_id($db, $row)
{
    $value = (int)($row["SchoolYearID"] ?? $row["school_year_id"] ?? 0);
    if ($value > 0) {
        return $value;
    }

    $active_school_year_id = get_active_school_year_id($db);
    return $active_school_year_id > 0 ? $active_school_year_id : 0;
}

function resolve_bulk_semester($row)
{
    $value = trim((string)($row["Semester"] ?? $row["semester"] ?? "1st Semester"));
    return $value !== "" ? $value : "1st Semester";
}

if ($method !== "POST") {
    respond(["error" => "Method not allowed"], 405);
}

$data = read_json();
if (!is_array($data)) {
    respond(["error" => "Array payload required"], 400);
}

$studentSql = "INSERT INTO %s
    (student_id, name, program, year_level, gmail, school_year_id, semester, total_fee, base_total_fee, discount_percent, downpayment, prelim, midterm, pre_final, finals, total_balance, payment_mode, full_payment_amount, carry_over_amount, carry_over_from_semester, can_remind,
     downpayment_date, prelim_date, midterm_date, prefinal_date, final_date, total_balance_date,
     downpayment_paid_amount, prelim_paid_amount, midterm_paid_amount, prefinal_paid_amount, final_paid_amount, total_balance_paid_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        program = VALUES(program),
        year_level = VALUES(year_level),
        gmail = VALUES(gmail),
        school_year_id = VALUES(school_year_id),
        semester = VALUES(semester),
        total_fee = VALUES(total_fee),
        base_total_fee = VALUES(base_total_fee),
        discount_percent = VALUES(discount_percent),
        downpayment = VALUES(downpayment),
        prelim = VALUES(prelim),
        midterm = VALUES(midterm),
        pre_final = VALUES(pre_final),
        finals = VALUES(finals),
        total_balance = VALUES(total_balance),
        payment_mode = VALUES(payment_mode),
        full_payment_amount = VALUES(full_payment_amount),
        carry_over_amount = VALUES(carry_over_amount),
        carry_over_from_semester = VALUES(carry_over_from_semester),
        can_remind = VALUES(can_remind),
        downpayment_date = VALUES(downpayment_date),
        prelim_date = VALUES(prelim_date),
        midterm_date = VALUES(midterm_date),
        prefinal_date = VALUES(prefinal_date),
        final_date = VALUES(final_date),
        total_balance_date = VALUES(total_balance_date),
        downpayment_paid_amount = VALUES(downpayment_paid_amount),
        prelim_paid_amount = VALUES(prelim_paid_amount),
        midterm_paid_amount = VALUES(midterm_paid_amount),
        prefinal_paid_amount = VALUES(prefinal_paid_amount),
        final_paid_amount = VALUES(final_paid_amount),
        total_balance_paid_amount = VALUES(total_balance_paid_amount)";

$bseStmt = $db->prepare(sprintf($studentSql, "bse_students"));
$bsisStmt = $db->prepare(sprintf($studentSql, "bsis_students"));

foreach ($data as $row) {
    if (!is_array($row)) {
        continue;
    }

    $student_id = trim((string)($row["StudentID"] ?? ""));
    $name = trim((string)($row["Name"] ?? ""));

    if ($student_id === "" || $name === "") {
        continue;
    }

    $program = trim((string)($row["Program"] ?? ""));
    $year_level = trim((string)($row["YearLevel"] ?? ""));
    $gmail = trim((string)($row["Gmail"] ?? ""));
    $school_year_id = resolve_bulk_school_year_id($db, $row);
    $semester = resolve_bulk_semester($row);
    $financials = normalized_student_financials(array_merge($row, ["Semester" => $semester]));
    $canRemind = isset($row["CanRemind"]) ? ((int)(bool)$row["CanRemind"]) : ((isset($row["can_remind"]) && (int)$row["can_remind"] === 1) ? 1 : 0);

    $programLower = strtolower($program);
    $stmt = null;
    if (strpos($programLower, "bse") !== false) {
        $stmt = $bseStmt;
    } else if (strpos($programLower, "bsis") !== false) {
        $stmt = $bsisStmt;
    }

    if (!$stmt) {
        continue;
    }

    $stmt->bind_param(
        "sssssisdddddddddsdissssssssssss",
        $student_id,
        $name,
        $program,
        $year_level,
        $gmail,
        $school_year_id,
        $semester,
        $financials["total_fee"],
        $financials["base_total_fee"],
        $financials["discount_percent"],
        $financials["downpayment"],
        $financials["prelim"],
        $financials["midterm"],
        $financials["pre_final"],
        $financials["finals"],
        $financials["total_balance"],
        $financials["payment_mode"],
        $financials["full_payment_amount"],
        $financials["carry_over_amount"],
        $financials["carry_over_from_semester"],
        $canRemind,
        $row["downpayment_date"] ?? null,
        $row["prelim_date"] ?? null,
        $row["midterm_date"] ?? null,
        $row["prefinal_date"] ?? null,
        $row["final_date"] ?? null,
        $row["total_balance_date"] ?? null,
        $row["downpayment_paid_amount"] ?? null,
        $row["prelim_paid_amount"] ?? null,
        $row["midterm_paid_amount"] ?? null,
        $row["prefinal_paid_amount"] ?? null,
        $row["final_paid_amount"] ?? null,
        $row["total_balance_paid_amount"] ?? null
    );
    $stmt->execute();
}

if ($bseStmt) { $bseStmt->close(); }
if ($bsisStmt) { $bsisStmt->close(); }

$view = trim((string)($_GET["view"] ?? ""));
$result = $db->query(
    "SELECT s.*, sy.label AS school_year_label FROM (SELECT * FROM bse_students UNION ALL SELECT * FROM bsis_students) s
     LEFT JOIN school_years sy ON sy.id = s.school_year_id
     ORDER BY s.id DESC"
);
if (!$result) {
    respond(["message" => "Bulk upsert completed"], 200);
}

$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $view === "full" ? map_student_row($row) : map_basic_student_row($row);
}

respond($rows, 200);
'@
Set-Content -Path 'C:\xampp\htdocs\aclcapi\api\students_bulk.php' -Value $studentsBulk

$remindersPath='C:\xampp\htdocs\aclcapi\api\reminders.php'
$r = Get-Content -Path $remindersPath -Raw
$r = $r.Replace("COALESCE(student_financials.can_remind, 0) AS can_remind", "COALESCE(bse_students.can_remind, 0) AS can_remind")
$r = $r.Replace("LEFT JOIN student_financials ON student_financials.student_id = bse_students.student_id`r`n         WHERE bse_students.student_id = ?", "WHERE bse_students.student_id = ?")
$r = $r.Replace("COALESCE(student_financials.can_remind, 0) AS can_remind", "COALESCE(bsis_students.can_remind, 0) AS can_remind")
$r = $r.Replace("LEFT JOIN student_financials ON student_financials.student_id = bsis_students.student_id`r`n         WHERE bsis_students.student_id = ?", "WHERE bsis_students.student_id = ?")
$r = [regex]::Replace($r, 'function set_can_remind_flag_after_send\([\s\S]*?function find_students_by_gmail_reminder', @"
function set_can_remind_flag_after_send($db, $source_table, $student_id, $value)
{
    $flag = (int)$value;
    $safeTable = $source_table === "bse_students" ? "bse_students" : ($source_table === "bsis_students" ? "bsis_students" : "");
    if ($safeTable === "") {
        return false;
    }

    $stmt = $db->prepare("UPDATE {$safeTable} SET can_remind = ? WHERE student_id = ?");
    if (!$stmt) {
        return false;
    }

    $stmt->bind_param("is", $flag, $student_id);
    $ok = $stmt->execute();
    $stmt->close();
    return $ok;
}

function find_students_by_gmail_reminder
"@)
Set-Content -Path $remindersPath -Value $r

$schoolYearsPath='C:\xampp\htdocs\aclcapi\api\school_years.php'
$s = Get-Content -Path $schoolYearsPath -Raw
$s = $s.Replace(@"
        if (!$db->query("DELETE FROM student_financials WHERE school_year_id IN ({$idList})")) {
            throw new Exception($db->error);
        }
"@, "")
$s = $s.Replace('["bse_students", "bsis_students", "student_financials"]', '["bse_students", "bsis_students"]')
$s = [regex]::Replace($s, '\$financeStmt = \$db->prepare\([\s\S]*?\$seenStudents = \[\];', '$seenStudents = [];')
$s = [regex]::Replace($s, '\s+\$financeStmt->bind_param\([\s\S]*?\$financeStmt->execute\(\);\r?\n', "`r`n")
$s = $s.Replace('            $financeStmt->close();' + "`r`n", "")
Set-Content -Path $schoolYearsPath -Value $s

$dbPath='C:\xampp\htdocs\aclcapi\api\db.php'
$d = Get-Content -Path $dbPath -Raw
$d = $d.Replace('    ensure_student_column($mysqli, $database_name, "student_financials", "school_year_id", "INT UNSIGNED NULL AFTER student_id");' + "`r`n", "")
$d = $d.Replace('    ensure_student_column($mysqli, $database_name, "student_financials", "semester", "VARCHAR(20) NULL AFTER school_year_id");' + "`r`n", "")
$d = $d.Replace('    ensure_student_column($mysqli, $database_name, "student_financials", "carry_over_amount", "DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER full_payment_amount");' + "`r`n", "")
$d = $d.Replace('    ensure_student_column($mysqli, $database_name, "student_financials", "carry_over_from_semester", "VARCHAR(20) NULL AFTER carry_over_amount");' + "`r`n", "")
$d = $d.Replace('    $mysqli->query("UPDATE student_financials SET semester = ''1st Semester'' WHERE semester IS NULL OR TRIM(semester) = ''''");' + "`r`n", "")
$d = $d.Replace('    $mysqli->query("UPDATE student_financials SET carry_over_amount = 0.00 WHERE carry_over_amount IS NULL");' + "`r`n", "")
$d = $d.Replace('        ensure_school_year_mirror_table($mysqli, "student_financials", "school_year_{$suffix}_student_financials", $schoolYearId);' + "`r`n", "")
$d = $d.Replace('    ensure_student_financials_table($mysqli);' + "`r`n", "")
$d = $d.Replace('    migrate_legacy_student_financials($mysqli, $config["name"], "bse_students");' + "`r`n", "")
$d = $d.Replace('    migrate_legacy_student_financials($mysqli, $config["name"], "bsis_students");' + "`r`n", "")
$d = $d.Replace('    ensure_student_financials_primary_key($mysqli, $config["name"]);' + "`r`n", "")
Set-Content -Path $dbPath -Value $d
