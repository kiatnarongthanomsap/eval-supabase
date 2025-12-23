<?php
ob_start(); // Buffer output to prevent accidental whitespace/errors from breaking JSON headers

if (isset($_GET['debug'])) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Ensure CORS is handled for both local and production environments
header('Content-Type: application/json; charset=utf-8');

// Safe requirement for SmtpMailer
$smtpMailerPath = __DIR__ . '/SmtpMailer.php';
if (file_exists($smtpMailerPath)) {
    require_once $smtpMailerPath;
}

// Handle OPTIONS request for CORS
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    exit(0);
}

// Database Configuration
$host = 'localhost';
$dbname = 'hr_evaluation_pro';
$username = 'root';
$password = 'kt%8156982'; 

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    ob_end_clean();
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$action = isset($_GET['action']) ? trim($_GET['action']) : '';

try {
    switch ($action) {
        case 'health_check':
            $result = [
                'status' => 'ok',
                'version' => '1.9.7',
                'php_version' => PHP_VERSION,
                'db_connection' => 'connected',
                'smtp_mailer' => file_exists($smtpMailerPath) ? 'available' : 'missing'
            ];
            break;
        case 'get_init_data':
            $result = getInitData($pdo);
            break;
        case 'login':
            $input = json_decode(file_get_contents('php://input'), true);
            $result = login($pdo, $input['org_id'] ?? null);
            break;
        case 'update_score':
            $input = json_decode(file_get_contents('php://input'), true);
            $result = updateScore($pdo, $input);
            break;
        case 'update_comment':
            $input = json_decode(file_get_contents('php://input'), true);
            $result = updateComment($pdo, $input);
            break;
        case 'reset_data':
             $result = resetData($pdo);
             break;
        case 'update_config':
             $input = json_decode(file_get_contents('php://input'), true);
             $result = updateConfig($pdo, $input);
             break;
        case 'fix_permissions':
             $result = fixPermissions($pdo);
             break;
        case 'add_exclusion':
             $input = json_decode(file_get_contents('php://input'), true);
             $result = addExclusion($pdo, $input);
             break;
        case 'delete_exclusion':
             $input = json_decode(file_get_contents('php://input'), true);
             $result = deleteExclusion($pdo, $input);
             break;
        case 'save_user':
             $input = json_decode(file_get_contents('php://input'), true);
             $result = saveUser($pdo, $input);
             break;
        case 'delete_user':
             $input = json_decode(file_get_contents('php://input'), true);
             $result = deleteUser($pdo, $input);
             break;
        case 'import_users':
             $input = json_decode(file_get_contents('php://input'), true);
             $result = importUsers($pdo, $input);
             break;
        case 'save_criteria':
             $input = json_decode(file_get_contents('php://input'), true);
             $result = saveCriteria($pdo, $input);
             break;
        case 'delete_criteria':
             $input = json_decode(file_get_contents('php://input'), true);
             $result = deleteCriteria($pdo, $input);
             break;
        case 'send_evaluation_summary':
             $input = json_decode(file_get_contents('php://input'), true);
             $result = sendEvaluationSummary($pdo, $input);
             break;
        case 'test_smtp':
             $input = json_decode(file_get_contents('php://input'), true);
             $result = testSmtpConnection($input);
             break;
        default:
            $result = ['error' => 'Invalid action: ' . $action];
            break;
    }
    
    // Clear any accidental output before sending JSON
    $output = ob_get_clean();
    if (!empty($output) && isset($_GET['debug'])) {
        // In debug mode, we might want to see stray output, but for now let's keep it clean
    }
    
    echo json_encode($result);

} catch (Throwable $e) {
    if (ob_get_level() > 0) ob_end_clean();
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode([
        'error' => 'Application Error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit;
}

function getInitData($pdo) {
    $data = [
        'users' => [],
        'criteria' => [],
        'exclusions' => [],
        'scores' => [],
        'comments' => [],
        'systemConfig' => null
    ];

    // 1. Users
    try {
        // Get existing columns in the users table to avoid 500 errors if mobile/email is missing
        $stmt = $pdo->query("SHOW COLUMNS FROM users");
        $rawColumns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $dbColumns = array_map(function($col) { return strtolower($col['Field']); }, $rawColumns);

        $stmt = $pdo->query("SELECT * FROM users ORDER BY position ASC");
        $users = $stmt->fetchAll();
        
        foreach ($users as $u) {
            $imgUrl = "https://picsum.photos/seed/{$u['org_id']}/100/100";
            if (!empty($u['member_id'])) {
                $imgUrl = "https://apps2.coop.ku.ac.th/asset/staff/2568/crop/{$u['member_id']}.jpg";
            } elseif (!empty($u['img'])) {
                $imgUrl = $u['img'];
            }

            $data['users'][] = [
                'internalId' => $u['internal_id'],
                'memberId' => $u['member_id'] ?? null,
                'orgId' => (int)$u['org_id'],
                'name' => $u['name'],
                'position' => $u['position'],
                'salary' => isset($u['salary']) ? ($u['salary'] ? (int)$u['salary'] : null) : null,
                'salaryGroup' => $u['salary_group'] ?? null,
                'role' => $u['role'],
                'dept' => $u['dept'],
                'parentInternalId' => $u['parent_internal_id'] ?? null,
                'img' => $imgUrl, 
                'isAdmin' => isset($u['is_admin']) ? (bool)$u['is_admin'] : false,
                'canViewReport' => isset($u['can_view_report']) ? (bool)$u['can_view_report'] : false,
                'isActive' => isset($u['is_active']) ? (bool)$u['is_active'] : true,
                'mobile' => $u['mobile'] ?? null,
                'email' => $u['email'] ?? null,
            ];
        }
    } catch (PDOException $e) { $data['error_users'] = $e->getMessage(); }

    // 2. Criteria
    try {
        $stmt = $pdo->query("SELECT * FROM criteria");
        $data['criteria'] = $stmt->fetchAll();
    } catch (PDOException $e) { $data['error_criteria'] = $e->getMessage(); }

    // 3. Exclusions
    try {
        $stmt = $pdo->query("SELECT * FROM exclusions");
        $rawExclusions = $stmt->fetchAll();
        foreach ($rawExclusions as $ex) {
            $data['exclusions'][] = [
                'id' => (int)($ex['id'] ?? 0),
                'evaluatorId' => (int)($ex['evaluator_org_id'] ?? 0),
                'targetId' => (int)($ex['target_org_id'] ?? 0),
                'reason' => $ex['reason'] ?? ''
            ];
        }
    } catch (PDOException $e) { $data['error_exclusions'] = $e->getMessage(); }

    // 4. Scores
    try {
        $evaluatorId = $_GET['evaluator_id'] ?? null;
        
        if ($evaluatorId) {
            // Specific Evaluator View: Get exact scores
            $stmt = $pdo->prepare("SELECT * FROM evaluations WHERE evaluator_internal_id = ?");
            $stmt->execute([$evaluatorId]);
            $rawScores = $stmt->fetchAll();
            foreach ($rawScores as $s) {
                if (!isset($data['scores'][$s['target_internal_id']])) {
                    $data['scores'][$s['target_internal_id']] = [];
                }
                $data['scores'][$s['target_internal_id']][$s['criteria_id']] = (int)$s['score'];
            }
        } elseif (isset($_GET['raw']) && $_GET['raw'] === 'true') {
            // Raw Global View: Get ALL scores mapped by Evaluator -> Target -> Criteria
            // We return a new key 'all_scores' for this to avoid breaking existing logic depending on 'scores'
            $data['all_scores'] = [];
            $stmt = $pdo->query("SELECT * FROM evaluations");
            $rawScores = $stmt->fetchAll();
            foreach ($rawScores as $s) {
                $eid = $s['evaluator_internal_id'];
                $tid = $s['target_internal_id'];
                $cid = $s['criteria_id'];
                
                if (!isset($data['all_scores'][$eid])) {
                    $data['all_scores'][$eid] = [];
                }
                if (!isset($data['all_scores'][$eid][$tid])) {
                     $data['all_scores'][$eid][$tid] = [];
                }
                $data['all_scores'][$eid][$tid][$cid] = (int)$s['score'];
            }
        } else {
            // Global/Report View: Get Average Scores
            // We calculate the average score for each criteria for each target
            $stmt = $pdo->query("SELECT target_internal_id, criteria_id, AVG(score) as avg_score FROM evaluations GROUP BY target_internal_id, criteria_id");
            $rawScores = $stmt->fetchAll();
            foreach ($rawScores as $s) {
                if (!isset($data['scores'][$s['target_internal_id']])) {
                    $data['scores'][$s['target_internal_id']] = [];
                }
                // Round to 2 decimal places or keep as float, frontend handles display?
                // Frontend calculateTotal expects numbers. Let's keep precision.
                $data['scores'][$s['target_internal_id']][$s['criteria_id']] = (float)$s['avg_score'];
            }
        }
    } catch (PDOException $e) { $data['error_scores'] = $e->getMessage(); }

    // 4.5 Evaluator Counts (New)
    try {
        if (!isset($_GET['evaluator_id']) && (!isset($_GET['raw']) || $_GET['raw'] !== 'true')) {
            $stmt = $pdo->query("SELECT target_internal_id, COUNT(DISTINCT evaluator_internal_id) as count FROM evaluations GROUP BY target_internal_id");
            $counts = $stmt->fetchAll();
            $data['evaluator_counts'] = [];
            foreach ($counts as $c) {
                $data['evaluator_counts'][$c['target_internal_id']] = (int)$c['count'];
            }
        }
    } catch (PDOException $e) { $data['error_counts'] = $e->getMessage(); }

    // 5. Comments
    try {
        $evaluatorId = $_GET['evaluator_id'] ?? null;
        $commentParams = [];
        if ($evaluatorId) {
            // Specific Evaluator: Only fetch their comments
            $commentSql = "SELECT * FROM comments WHERE evaluator_internal_id = ?";
            $commentParams[] = $evaluatorId;
        } else {
            // Report View: Fetch all comments with evaluator names
            $commentSql = "SELECT c.*, u.name as evaluator_name FROM comments c LEFT JOIN users u ON c.evaluator_internal_id = u.internal_id";
        }

        $stmt = $pdo->prepare($commentSql);
        $stmt->execute($commentParams);
        $rawComments = $stmt->fetchAll();
        
        foreach ($rawComments as $c) {
            if ($evaluatorId) {
                // Singular view: just the comment string
                $data['comments'][$c['target_internal_id']] = $c['comment'];
            } else {
                // Report view: Return array of comment objects
                if (!isset($data['comments'][$c['target_internal_id']])) {
                    $data['comments'][$c['target_internal_id']] = [];
                }
                $data['comments'][$c['target_internal_id']][] = [
                    'evaluator' => $c['evaluator_name'] ?? 'Unknown',
                    'comment' => $c['comment']
                ];
            }
        }
    } catch (PDOException $e) { $data['error_comments'] = $e->getMessage(); }
    
    // 6. Config
    try {
        $stmt = $pdo->query("SELECT * FROM system_config");
        $data['systemConfig'] = [];
        while ($row = $stmt->fetch()) {
            // Security: Don't send SMTP password to anyone via init data
            if ($row['key'] === 'smtp_pass') continue; 
            
            $val = $row['value'];
            // Auto-decode JSON fields (including deptAdjustment)
            if (!empty($val) && (isset($val[0]) && ($val[0] === '{' || $val[0] === '['))) {
                $decoded = json_decode($val, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $val = $decoded;
                }
            }
            $data['systemConfig'][$row['key']] = $val;
        }
    } catch (PDOException $e) { $data['error_config'] = $e->getMessage(); }

    return $data;
}

function login($pdo, $orgId) {
    if (!$orgId) return ['error' => 'Missing org_id'];
    $stmt = $pdo->prepare("SELECT * FROM users WHERE org_id = ?");
    $stmt->execute([$orgId]);
    $user = $stmt->fetch();
    if ($user) {
         return [
            'internalId' => $user['internal_id'],
            'memberId' => $user['member_id'],
            'orgId' => (int)$user['org_id'],
            'name' => $user['name'],
            'role' => $user['role'],
            'isAdmin' => (bool)$user['is_admin']
        ];
    }
    return ['error' => 'User not found'];
}

function updateScore($pdo, $input) {
    $evaluatorId = $input['evaluatorId'];
    $targetId = $input['targetId'];
    $criteriaId = $input['criteriaId'];
    $score = $input['score'];

    $stmt = $pdo->prepare("INSERT INTO evaluations (evaluator_internal_id, target_internal_id, criteria_id, score) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE score = ?");
    if ($stmt->execute([$evaluatorId, $targetId, $criteriaId, $score, $score])) {
        return ['success' => true];
    }
    return ['error' => 'Failed to update score'];
}

function updateComment($pdo, $input) {
    $evaluatorId = $input['evaluatorId'];
    $targetId = $input['targetId'];
    $comment = $input['comment'];

    $stmt = $pdo->prepare("INSERT INTO comments (evaluator_internal_id, target_internal_id, comment) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE comment = ?");
    if ($stmt->execute([$evaluatorId, $targetId, $comment, $comment])) {
        return ['success' => true];
    }
    return ['error' => 'Failed to update comment'];
}

function resetData($pdo) {
     $pdo->exec("TRUNCATE TABLE evaluations");
     $pdo->exec("TRUNCATE TABLE comments");
     return ['success' => true, 'message' => 'All scores and comments reset.'];
}

function fixPermissions($pdo) {
    try {
        // Fix Kiatnarong (19) and Piyatida (21)
        $sql = "UPDATE users SET is_admin = 1 WHERE org_id IN (19, 21)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $count = $stmt->rowCount();
        return ['success' => true, 'message' => "Updated permissions for $count users."];
    } catch (PDOException $e) {
        return ['error' => 'Database update failed: ' . $e->getMessage()];
    }
}
function updateConfig($pdo, $input) {
    try {
        $stmt = $pdo->prepare("INSERT INTO system_config (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?");
        
        $pdo->beginTransaction();
        foreach ($input as $key => $value) {
             $dbKey = $key;
             $dbValue = $value;

             if ($key === 'startDate') $dbKey = 'start_date';
             if ($key === 'endDate') $dbKey = 'end_date';
             if ($key === 'smtpHost') $dbKey = 'smtp_host';
             if ($key === 'smtpPort') $dbKey = 'smtp_port';
             if ($key === 'smtpUser') $dbKey = 'smtp_user';
             if ($key === 'smtpPass') {
                 $dbKey = 'smtp_pass';
                 // If value is placeholder or empty and we already have a pass, skip updating it
                 // This depends on how front-end handles placeholders. 
                 // For now, let's assume if it's not empty, we update it.
                 if (empty($value) || $value === '••••••••') continue;
             }
             if ($key === 'smtpEncryption') $dbKey = 'smtp_encryption';
             
             if ($key === 'sendEmailCopy') {
                 $dbKey = 'send_email_copy';
                 if ($value === true || $value === 'true' || $value === 1 || $value === '1') {
                     $dbValue = 'true';
                 } else {
                     $dbValue = 'false';
                 }
             }
             
             if ($key === 'deptAdjustment') {
                 $dbKey = 'dept_adjustments';
                 $dbValue = json_encode($value, JSON_UNESCAPED_UNICODE);
             }
             
             // Ensure data is string if not already
             $stmt->execute([$dbKey, (string)$dbValue, (string)$dbValue]);
        }
        $pdo->commit();
        return ['success' => true];
    } catch (PDOException $e) {
        $pdo->rollBack();
        return ['error' => 'Failed to update config: ' . $e->getMessage()];
    }
}

function addExclusion($pdo, $input) {
    try {
        $stmt = $pdo->prepare("INSERT INTO exclusions (evaluator_org_id, target_org_id, reason) VALUES (?, ?, ?)");
        $stmt->execute([$input['evaluatorId'], $input['targetId'], $input['reason'] ?? '']);
        return ['success' => true, 'id' => $pdo->lastInsertId()];
    } catch (PDOException $e) {
        return ['error' => 'Failed to add exclusion: ' . $e->getMessage()];
    }
}

function deleteExclusion($pdo, $input) {
    try {
        $stmt = $pdo->prepare("DELETE FROM exclusions WHERE id = ?");
        $stmt->execute([$input['id']]);
        return ['success' => true];
    } catch (PDOException $e) {
         return ['error' => 'Failed to delete exclusion: ' . $e->getMessage()];
    }
}

function saveUser($pdo, $input) {
    $debugInfo = [];
    try {
        // 1. Get existing columns (case-insensitive)
        $stmt = $pdo->query("SHOW COLUMNS FROM users");
        $rawColumns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $dbColumns = array_map(function($col) { return strtolower($col['Field']); }, $rawColumns);
        $debugInfo['db_columns'] = $dbColumns;
        
        // 2. Map frontend fields to DB columns
        $fieldMap = [
            'internalId' => 'internal_id',
            'memberId' => 'member_id',
            'orgId' => 'org_id',
            'name' => 'name',
            'position' => 'position',
            'dept' => 'dept',
            'salary' => 'salary',
            'salaryGroup' => 'salary_group',
            'role' => 'role',
            'parentInternalId' => 'parent_internal_id',
            'img' => 'img',
            'isAdmin' => 'is_admin',
            'canViewReport' => 'can_view_report',
            'isActive' => 'is_active',
            'mobile' => 'mobile',
            'email' => 'email'
        ];

        $data = [];
        $columns = [];
        $placeholders = [];
        $updates = [];

        foreach ($fieldMap as $frontendKey => $dbColumn) {
            if (in_array(strtolower($dbColumn), $dbColumns)) {
                $val = isset($input[$frontendKey]) ? $input[$frontendKey] : null;
                
                // Handle booleans (Frontend might send true/false or string "true"/"false")
                if (in_array($frontendKey, ['isAdmin', 'canViewReport', 'isActive'])) {
                    $val = filter_var($val, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
                }

                $columns[] = $dbColumn;
                $placeholders[] = "?";
                if ($dbColumn !== 'internal_id') {
                    $updates[] = "$dbColumn = VALUES($dbColumn)";
                }
                $data[] = $val;
            }
        }

        if (empty($columns)) {
            return ['error' => 'No matching database columns found', 'debug' => $debugInfo];
        }

        $sql = "INSERT INTO users (" . implode(', ', $columns) . ") 
                VALUES (" . implode(', ', $placeholders) . ")
                ON DUPLICATE KEY UPDATE " . implode(', ', $updates);
        
        $debugInfo['sql'] = $sql;
        $debugInfo['input_keys'] = array_keys($input);

        $stmt = $pdo->prepare($sql);
        $stmt->execute($data);
        
        return ['success' => true, 'debug' => $debugInfo];
    } catch (PDOException $e) {
        return [
            'error' => 'Database Error: ' . $e->getMessage(),
            'debug' => $debugInfo
        ];
    } catch (Exception $e) {
        return [
            'error' => 'System Error: ' . $e->getMessage(),
            'debug' => $debugInfo
        ];
    }
}

function deleteUser($pdo, $input) {
    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE internal_id = ?");
        $stmt->execute([$input['internalId']]);
        return ['success' => true];
    } catch (PDOException $e) {
        return ['error' => 'Failed to delete user: ' . $e->getMessage()];
    }
}

function importUsers($pdo, $input) {
    try {
        $pdo->beginTransaction();
        foreach ($input as $u) {
            $u['isAdmin'] = isset($u['isAdmin']) ? $u['isAdmin'] : false;
            $u['canViewReport'] = isset($u['canViewReport']) ? $u['canViewReport'] : false;
            $u['isActive'] = isset($u['isActive']) ? $u['isActive'] : true;
            $res = saveUser($pdo, $u);
            if (isset($res['error'])) {
                throw new Exception("Error importing user {$u['name']}: " . $res['error']);
            }
        }
        $pdo->commit();
        return ['success' => true, 'count' => count($input)];
    } catch (Exception $e) {
        $pdo->rollBack();
        return ['error' => $e->getMessage()];
    }
}

function saveCriteria($pdo, $input) {
    try {
        $stmt = $pdo->prepare("INSERT INTO criteria (id, text, category, weight, description) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE text = ?, category = ?, weight = ?, description = ?");
        $stmt->execute([
            $input['id'],
            $input['text'],
            $input['category'],
            $input['weight'],
            $input['description'] ?? '',
            $input['text'],
            $input['category'],
            $input['weight'],
            $input['description'] ?? ''
        ]);
        return ['success' => true];
    } catch (PDOException $e) {
        return ['error' => 'Failed to save criteria: ' . $e->getMessage()];
    }
}

function deleteCriteria($pdo, $input) {
    try {
        $stmt = $pdo->prepare("DELETE FROM criteria WHERE id = ?");
        $stmt->execute([$input['id']]);
        return ['success' => true];
    } catch (PDOException $e) {
        $pdo->rollBack();
        return ['error' => 'Failed to delete criteria: ' . $e->getMessage()];
    }
}

function sendEvaluationSummary($pdo, $input) {
    if (!isset($input['evaluator_id']) || !isset($input['evaluation_data'])) {
        return ['error' => 'Missing evaluator_id or evaluation_data'];
    }

    $evaluatorId = $input['evaluator_id'];
    $data = $input['evaluation_data'];
    $summary = $data['summary'] ?? [];

    try {
        // Find evaluator email
        $stmt = $pdo->prepare("SELECT email, name FROM users WHERE internal_id = ?");
        $stmt->execute([$evaluatorId]);
        $user = $stmt->fetch();

        if (!$user || empty($user['email'])) {
            return ['error' => 'Evaluator email not found'];
        }

        $to = $user['email'];
        $subject = "สรุปผลการประเมิน - " . $user['name'];

        // Construct HTML Body
        $htmlBody = "
        <div style='font-family: sans-serif; line-height: 1.6; color: #333;'>
            <h2 style='color: #4f46e5;'>สรุปรายงานผลการประเมิน</h2>
            <p><strong>ผู้ประเมิน:</strong> {$user['name']}<br>
            <strong>ตำแหน่ง:</strong> {$data['evaluatorPosition']}<br>
            <strong>วันที่:</strong> {$data['date']}</p>
            
            <table style='width: 100%; border-collapse: collapse; margin-top: 20px;'>
                <thead>
                    <tr style='background-color: #f3f4f6;'>
                        <th style='border: 1px solid #ddd; padding: 12px; text-align: left;'>ชื่อ-นามสกุล</th>
                        <th style='border: 1px solid #ddd; padding: 12px; text-align: left;'>ตำแหน่ง/แผนก</th>
                        <th style='border: 1px solid #ddd; padding: 12px; text-align: center;'>คะแนน (เต็ม)</th>
                        <th style='border: 1px solid #ddd; padding: 12px; text-align: center;'>ระดับ</th>
                        <th style='border: 1px solid #ddd; padding: 12px; text-align: left;'>ความคิดเห็น</th>
                    </tr>
                </thead>
                <tbody>";

        foreach ($summary as $row) {
            $htmlBody .= "
                    <tr style='background-color: #f9fafb;'>
                        <td style='border: 1px solid #ddd; padding: 10px; font-weight: bold;'>{$row['name']}</td>
                        <td style='border: 1px solid #ddd; padding: 10px;'>{$row['position']}<br><small style='color: #666;'>{$row['dept']}</small></td>
                        <td style='border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;'>{$row['score']} ({$row['maxScore']})</td>
                        <td style='border: 1px solid #ddd; padding: 10px; text-align: center;'>{$row['level']}</td>
                        <td style='border: 1px solid #ddd; padding: 10px;'>{$row['comment']}</td>
                    </tr>";
            
            // Sub-rows for details (Individual Criteria Scores)
            if (!empty($row['details'])) {
                $htmlBody .= "<tr><td colspan='5' style='padding: 0;'><table style='width: 100%; border-collapse: collapse; margin: 0; font-size: 13px;'>";
                foreach ($row['details'] as $detail) {
                    $scoreColor = ($detail['score'] >= 3) ? '#059669' : (($detail['score'] >= 2) ? '#d97706' : '#dc2626');
                    $htmlBody .= "
                        <tr style='border-bottom: 1px solid #f3f4f6;'>
                            <td style='padding: 6px 15px; color: #4b5563; text-align: left;'>• {$detail['text']}</td>
                            <td style='padding: 6px 15px; text-align: right; width: 80px; color: {$scoreColor}; font-weight: bold;'>{$detail['score']} คะแนน</td>
                        </tr>";
                }
                $htmlBody .= "</table></td></tr>";
            }
        }

        $htmlBody .= "
                </tbody>
            </table>
            <p style='margin-top: 30px; font-size: 12px; color: #999;'>ระบบประเมินผลการปฏิบัติงาน - อัตโนมัติ</p>
        </div>";

        // Get SMTP Config
        $stmt = $pdo->query("SELECT * FROM system_config WHERE `key` LIKE 'smtp_%'");
        $config = [];
        while ($row = $stmt->fetch()) {
            $config[$row['key']] = $row['value'];
        }

        if (!empty($config['smtp_host'])) {
            $mailer = new SmtpMailer(
                $config['smtp_host'],
                $config['smtp_port'],
                $config['smtp_user'],
                $config['smtp_pass'],
                $config['smtp_encryption']
            );
            
            // For HTML email, we need to set the Content-Type header
            $mailer->send($to, $subject, $htmlBody, [
                'From' => $config['smtp_user'] ?: 'hr-evaluation@system.coop',
                'MIME-Version' => '1.0',
                'Content-Type' => 'text/html; charset=UTF-8'
            ]);
            return ['success' => true];
        }

        // Fallback to mail() with HTML headers
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= 'From: <hr-evaluation@system.coop>' . "\r\n";

        if (mail($to, $subject, $htmlBody, $headers)) {
            return ['success' => true];
        } else {
            return ['error' => 'Failed to send email'];
        }
    } catch (PDOException $e) {
        return ['error' => 'Database error: ' . $e->getMessage()];
    } catch (Exception $e) {
        return ['error' => 'SMTP error: ' . $e->getMessage()];
    }
}

function testSmtpConnection($input) {
    $host = $input['smtpHost'] ?? '';
    $port = $input['smtpPort'] ?? 587;
    $user = $input['smtpUser'] ?? '';
    $pass = $input['smtpPass'] ?? '';
    $encryption = $input['smtpEncryption'] ?? 'tls';

    if (empty($host)) return ['error' => 'Host is required'];

    // Basic socket check as a proxy for SMTP connection test
    // Real SMTP test requires a full handshake which is complex without a library
    $timeout = 5;
    $errno = 0;
    $errstr = '';
    
    $prefix = '';
    if ($encryption === 'ssl') $prefix = 'ssl://';
    
    $mailer = new SmtpMailer($host, $port, $user, $pass, $encryption);
    try {
        $mailer->testConnection();
        return [
            'success' => true, 
            'message' => 'Connection and Authentication successful!',
            'logs' => $mailer->getLogs()
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'SMTP Test Failed: ' . $e->getMessage(),
            'logs' => $mailer->getLogs()
        ];
    }
}
