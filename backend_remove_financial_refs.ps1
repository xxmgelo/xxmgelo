$studentsPath = 'C:\xampp\htdocs\aclcapi\api\students.php'
$r = Get-Content -Path $studentsPath -Raw
$r = $r.Replace('LEFT JOIN student_financials f ON f.student_id = s.student_id AND f.school_year_id = s.school_year_id AND f.semester = s.semester' + "`r`n", '')
$r = $r.Replace('    $db->query(' + "`r`n" + '        "INSERT IGNORE INTO student_financials (student_id, school_year_id, semester) VALUES (''" . $db->real_escape_string($student_id) . "'', " . (int)$school_year_id . ", ''" . $db->real_escape_string($semester) . "'')"'+ "`r`n" + '    );' + "`r`n" + "`r`n", '')
$r = $r.Replace('    $financeDelete = $db->prepare("DELETE FROM student_financials WHERE student_id = ? AND school_year_id = ? AND semester = ?");' + "`r`n" + '    if ($financeDelete) {' + "`r`n" + '        $financeDelete->bind_param("sis", $row["student_id"], $row["school_year_id"], $semester);' + "`r`n" + '        $financeDelete->execute();' + "`r`n" + '        $financeDelete->close();' + "`r`n" + '    }' + "`r`n" + "`r`n", '')
Set-Content -Path $studentsPath -Value $r

$remindersPath = 'C:\xampp\htdocs\aclcapi\api\reminders.php'
$r = Get-Content -Path $remindersPath -Raw
$r = $r.Replace("COALESCE(student_financials.can_remind, 0) AS can_remind", "COALESCE(bse_students.can_remind, 0) AS can_remind")
$r = $r.Replace("LEFT JOIN student_financials ON student_financials.student_id = bse_students.student_id`r`n         WHERE bse_students.student_id = ?", "WHERE bse_students.student_id = ?")
$r = $r.Replace("COALESCE(student_financials.can_remind, 0) AS can_remind", "COALESCE(bsis_students.can_remind, 0) AS can_remind")
$r = $r.Replace("LEFT JOIN student_financials ON student_financials.student_id = bsis_students.student_id`r`n         WHERE bsis_students.student_id = ?", "WHERE bsis_students.student_id = ?")
$oldFn = @'
function set_can_remind_flag_after_send($db, $source_table, $student_id, $value)
{
    $stmt = $db->prepare(
        "INSERT INTO student_financials (student_id, can_remind)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE can_remind = VALUES(can_remind)"
    );
    if (!$stmt) {
        return false;
    }

    $flag = (int)$value;
    $stmt->bind_param("si", $student_id, $flag);
    $ok = $stmt->execute();
    $stmt->close();
    return $ok;
}
'@
$newFn = @'
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
'@
$r = $r.Replace($oldFn, $newFn)
Set-Content -Path $remindersPath -Value $r

$schoolYearsPath = 'C:\xampp\htdocs\aclcapi\api\school_years.php'
$r = Get-Content -Path $schoolYearsPath -Raw
$r = $r.Replace('        if (!$db->query("DELETE FROM student_financials WHERE school_year_id IN ({$idList})")) {' + "`r`n" + '            throw new Exception($db->error);' + "`r`n" + '        }' + "`r`n" + "`r`n", '')
$r = $r.Replace('["bse_students", "bsis_students", "student_financials"]', '["bse_students", "bsis_students"]')
$oldImport = @'
            $financeStmt = $db->prepare(
                "INSERT IGNORE INTO student_financials (student_id, school_year_id, semester)
                 VALUES (?, ?, ?)"
            );
            if (!$financeStmt) {
                $insertStmt->close();
                $selectStmt->close();
                throw new Exception("Failed to prepare financial import for {$table}");
            }

'@
$r = $r.Replace($oldImport, '')
$oldImport2 = @'
                    $financeStmt->bind_param(
                        "sis",
                        $resolvedStudentId,
                        $targetSchoolYearId,
                        $semester
                    );
                    $financeStmt->execute();
'@
$r = $r.Replace($oldImport2, '')
$r = $r.Replace('            $financeStmt->close();' + "`r`n", '')
Set-Content -Path $schoolYearsPath -Value $r

$dbPath = 'C:\xampp\htdocs\aclcapi\api\db.php'
$r = Get-Content -Path $dbPath -Raw
$r = $r.Replace('    $mysqli->query("UPDATE student_financials SET semester = ''1st Semester'' WHERE semester IS NULL OR TRIM(semester) = ''''");' + "`r`n", '')
$r = $r.Replace('    $mysqli->query("UPDATE student_financials SET carry_over_amount = 0.00 WHERE carry_over_amount IS NULL");' + "`r`n", '')
$r = $r.Replace('        ensure_school_year_mirror_table($mysqli, "student_financials", "school_year_{$suffix}_student_financials", $schoolYearId);' + "`r`n", '')
$r = $r.Replace('    ensure_student_financials_table($mysqli);' + "`r`n", '')
$r = $r.Replace('    migrate_legacy_student_financials($mysqli, $config["name"], "bse_students");' + "`r`n", '')
$r = $r.Replace('    migrate_legacy_student_financials($mysqli, $config["name"], "bsis_students");' + "`r`n", '')
$r = $r.Replace('    ensure_student_financials_primary_key($mysqli, $config["name"]);' + "`r`n", '')
Set-Content -Path $dbPath -Value $r
