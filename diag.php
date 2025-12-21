<?php
$host = '127.0.0.1';
$dbname = 'hr_evaluation_pro';
$username = 'root';
$password = 'kt%8156982'; 

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    echo "SCHEMAS:\n";
    $stmt = $pdo->query("SHOW TABLES");
    while($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $table = $row[0];
        echo "Table: $table\n";
        $columns = $pdo->query("SHOW COLUMNS FROM $table")->fetchAll(PDO::FETCH_ASSOC);
        foreach($columns as $col) {
            echo "  - {$col['Field']} ({$col['Type']})\n";
        }
    }
    
    echo "\nSYSTEM CONFIG DATA:\n";
    $stmt = $pdo->query("SELECT * FROM system_config");
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
