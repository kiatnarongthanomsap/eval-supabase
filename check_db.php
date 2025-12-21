<?php
$host = '127.0.0.1';
$dbname = 'hr_evaluation_pro';
$username = 'root';
$password = 'kt%8156982';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $stmt = $pdo->query("SELECT * FROM evaluations WHERE evaluator_internal_id = 'U_22' AND target_internal_id = 'U_25'");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
