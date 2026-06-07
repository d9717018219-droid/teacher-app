<?php
/**
 * DoAble India - Tutors List Fetch (SECURE & ROBUST)
 * Path: doableindia.com/app-sys/api_copy_data.php
 */
error_reporting(0);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$conn = new mysqli("localhost", "u568476563_Leads", "Leads@786123", "u568476563_Leads");
if ($conn->connect_error) { 
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed'])); 
}

// Fetch from 'CRM_Leads' table
$email = isset($_GET['email']) ? $conn->real_escape_string($_GET['email']) : '';
$where = $email ? "WHERE `email` = '$email' OR `Email` = '$email'" : "";

$sql = "SELECT * FROM `CRM_Leads` $where ORDER BY CAST(`tutor_id` AS UNSIGNED) DESC";
$result = $conn->query($sql);

$tutors = [];
if ($result) {
    while($row = $result->fetch_assoc()) { 
        $tutors[] = $row; 
    }
    echo json_encode([
        'status' => 'success', 
        'count' => count($tutors),
        'data' => $tutors
    ]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Fetch failed: ' . $conn->error]);
}

$conn->close();
?>
