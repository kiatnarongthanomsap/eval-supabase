<?php
header('Content-Type: application/json; charset=utf-8');
$host = '127.0.0.1';
$dbname = 'hr_evaluation_pro';
$username = 'root';
$password = 'kt%8156982';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    $stmt = $pdo->query("SELECT * FROM system_config");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'config' => $data
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
