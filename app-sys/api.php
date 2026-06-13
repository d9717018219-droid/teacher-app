<?php
/**
 * DoAble India - Final Robust Parent Sync API (ULTIMATE SYNC FIX)
 * Path: doableindia.com/app-sys/api.php
 */
ob_start(); 
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'api_parent_errors.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

date_default_timezone_set('Asia/Kolkata');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { ob_end_clean(); exit; }

function log_debug($msg) {
    $date = date('Y-m-d H:i:s');
    file_put_contents('api_parent_debug.log', "[$date] $msg\n", FILE_APPEND);
}

// Zoho Credentials
define('ZOHO_CLIENT_ID',     '1000.VNNYQAYAKOUP2TNO97FIGD4RI41K1C');
define('ZOHO_CLIENT_SECRET', 'f6e379a5534faa80cc9f3294ee84d6860d31858886');
define('ZOHO_REFRESH_TOKEN', '1000.19f6842a0833112342fe593d19f214a1.4d2efa10a1290154d54b0763be468053');

function getZohoAccessToken() {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://accounts.zoho.in/oauth/v2/token");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'refresh_token' => ZOHO_REFRESH_TOKEN,
        'client_id'     => ZOHO_CLIENT_ID,
        'client_secret' => ZOHO_CLIENT_SECRET,
        'grant_type'    => 'refresh_token'
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res['access_token'] ?? null;
}

function pushToZohoCRM($token, $data) {
    if (!$token) {
        log_debug("ZOHO PUSH FAILED: No auth token");
        return false;
    }

    // Helper to convert comma-separated string to array
    $toArray = function($val) {
        if (empty($val)) return [];
        if (is_array($val)) return $val;
        return array_filter(array_map('trim', explode(',', $val)));
    };

    // Helper to clean phone number
    $cleanPhone = function($phone) {
        if (empty($phone)) return '';
        $phone = (string)$phone;
        // Remove duplicate +91, spaces, hyphens
        $phone = str_replace(['+91+91', '+91+', ' ', '-'], ['+91', '+', '', ''], $phone);
        // If starts with +91, keep it; if 10 digits, add +91
        if (strlen($phone) === 10 && is_numeric($phone)) {
            $phone = '+91' . $phone;
        }
        return $phone;
    };

    $payload = [
        'data' => [[
            'Order_ID'       => $data['order_id'] ?? '',
            'First_Name'     => explode(' ', $data['name'] ?? 'Parent')[0],
            'Last_Name'      => implode(' ', array_slice(explode(' ', $data['name'] ?? 'Parent'), 1)),
            'Email'          => $data['email'] ?? '',
            'Phone'          => $cleanPhone($data['phone'] ?? ''),
            'Mailing_City'   => $data['city'] ?? '',
            'Mailing_Street' => $data['address'] ?? '',
            'Board'          => $data['board'] ?? '',
            'classes'        => $toArray($data['class_group'] ?? ''),
            'Mode'           => $data['mode'] ?? '',
            'fee'            => $data['fee'] ?? '',
            'duration'       => $data['duration'] ?? '',
            'Gender'         => $data['gender'] ?? '',
            'Residency'      => $data['residency'] ?? '',
            'days'           => $toArray($data['days'] ?? ''),
            'times'          => $toArray($data['time'] ?? ''),
            'subjects'       => $toArray($data['subjects'] ?? ''),
            'Locations'      => $toArray($data['location'] ?? ''),
            'Campaign_Status'=> $data['status'] ?? 'Searching',
            'Internal_Remark'=> $data['follow_up'] ?? '',
            'Assign_Tutor'   => $data['assign_tutor'] ?? 'N/A'
        ]]
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://www.zohoapis.in/crm/v2/Contacts/upsert");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Zoho-oauthtoken $token",
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $result = json_decode($response, true);
    if ($httpCode == 200 && !empty($result['data'][0]['status']) && $result['data'][0]['status'] == 'success') {
        log_debug("ZOHO PUSH SUCCESS: Order ID " . $data['order_id']);
        return true;
    } else {
        log_debug("ZOHO PUSH FAILED: " . json_encode($result));
        return false;
    }
}

function pushToZohoAsync($data) {
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }

    $token = getZohoAccessToken();
    pushToZohoCRM($token, $data);
}

try {
    // Database credentials
    $db_user = "u568476563_Contacts";
    $db_pass = "Leads@786123";
    $db_name = "u568476563_CRM_Contacts";

    $conn = new mysqli("localhost", $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        $conn = new mysqli("localhost", "u568476563_Leads", "Leads@786123", "u568476563_CRM_Contacts");
    }
    if ($conn->connect_error) throw new Exception("Database connection failed.");

    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?: $_POST;
    log_debug("SYNC REQUEST: " . json_encode($data));

    // Helper for mapping
    $s = function($keys, $default = '') use ($data, $conn) {
        if (is_string($keys)) $keys = [$keys];
        foreach ($keys as $key) {
            if (isset($data[$key]) && $data[$key] !== '') {
                $val = $data[$key];
                if (is_array($val)) $val = implode(', ', $val);
                return $conn->real_escape_string(trim((string)$val));
            }
        }
        return $default;
    };

    $order_id = $s(['order_id', 'Order_ID', 'id', 'Order ID']);
    $phone    = $s(['phone', 'Phone', 'Mobile']);
    $email    = $s(['email', 'Email']); // Still captured but not used as identifier

    if (empty($order_id) && empty($phone)) {
        throw new Exception("Phone number or Order ID is required.");
    }

    // Map all 23 Schema Columns
    $name         = $s(['name', 'Name']);
    $class_group  = $s(['class', 'Class', 'class_group']);
    $board        = $s(['board', 'Board']);
    $mode         = $s(['mode', 'Mode']);
    $city         = $s(['city', 'City']);
    $status       = $s(['status', 'Status'], 'Searching');
    $fee          = $s(['fee', 'Fee']);
    $gender       = $s(['gender', 'Gender']);
    $address      = $s(['address', 'Address']);
    $days         = $s(['days', 'Days', 'Available_Day_s']);
    $duration     = $s(['duration', 'Duration']);
    $time         = $s(['time', 'Time', 'Available_Time_s']);
    $residency    = $s(['residency', 'Residency', 'society']);
    $notes        = $s(['notes', 'Notes', 'about']);
    $subjects     = $s(['subjects', 'Subjects']);
    $location     = $s(['location', 'Locality', 'Locations']);
    $assign_tutor = $s(['Assign_Tutor', 'assign_tutor'], 'N/A');
    $follow_up    = $s(['follow_up', 'Internal Remark'], 'Pending');

    // ROBUST MATCHING: Find existing record by ID or Phone (Last 10 digits)
    $existing_id = null;
    $cleanPhone = preg_replace('/[^0-9]/', '', str_replace('+91', '', $phone));
    $phoneMatch = (strlen($cleanPhone) >= 10) ? substr($cleanPhone, -10) : 'NOMATCH';

    $check_stmt = $conn->prepare("SELECT order_id FROM `CRM_Contacts` WHERE (order_id = ? AND order_id != '') OR (phone LIKE ? AND phone != '') LIMIT 1");
    $phoneParam = "%$phoneMatch%";
    $check_stmt->bind_param("ss", $order_id, $phoneParam);
    $check_stmt->execute();
    $res = $check_stmt->get_result();
    if ($res->num_rows > 0) {
        $existing_id = $res->fetch_assoc()['order_id'];
    }
    $check_stmt->close();

    if ($existing_id) {
        log_debug("UPDATING RECORD: $existing_id");
        $sql = "UPDATE `CRM_Contacts` SET 
                name=?, class_group=?, board=?, mode=?, city=?, status=?, fee=?, gender=?, address=?, 
                days=?, duration=?, time=?, residency=?, notes=?, subjects=?, location=?, 
                Assign_Tutor=?, email=?, phone=?, follow_up=? 
                WHERE order_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssssssssssssssssssss", 
            $name, $class_group, $board, $mode, $city, $status, $fee, $gender, $address, 
            $days, $duration, $time, $residency, $notes, $subjects, $location, 
            $assign_tutor, $email, $phone, $follow_up, $existing_id);
    } else {
        if (empty($order_id)) {
            $res_id = $conn->query("SELECT MAX(CAST(order_id AS UNSIGNED)) as max_id FROM `CRM_Contacts` WHERE order_id REGEXP '^[0-9]+$'");
            $max_id = ($res_id && $row = $res_id->fetch_assoc()) ? (int)$row['max_id'] : 20000;
            if ($max_id < 20000) $max_id = 20000;
            $order_id = (string)($max_id + 1);
        }
        log_debug("INSERTING NEW RECORD: $order_id");
        $sql = "INSERT INTO `CRM_Contacts` 
                (order_id, name, class_group, board, mode, city, created_time, status, fee, gender, address, 
                days, duration, time, residency, notes, subjects, location, Assign_Tutor, email, phone, follow_up) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $created_time = date('Y-m-d H:i:s');
        $stmt->bind_param("ssssssssssssssssssssss", 
            $order_id, $name, $class_group, $board, $mode, $city, $created_time, $status, $fee, $gender, $address, 
            $days, $duration, $time, $residency, $notes, $subjects, $location, $assign_tutor, $email, $phone, $follow_up);
    }

    if (!$stmt->execute()) throw new Exception("Execution failed: " . $stmt->error);
    $stmt->close();

    $final_id = $existing_id ?: $order_id;
    $saved_data = [
        'order_id' => $final_id,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'city' => $city,
        'address' => $address,
        'board' => $board,
        'class_group' => $class_group,
        'mode' => $mode,
        'fee' => $fee,
        'gender' => $gender,
        'duration' => $duration,
        'residency' => $residency,
        'days' => $days,
        'time' => $time,
        'subjects' => $subjects,
        'location' => $location,
        'status' => $status,
        'follow_up' => $follow_up,
        'assign_tutor' => $assign_tutor,
        'notes' => $notes
    ];

    ob_end_clean();
    echo json_encode(['status' => 'success', 'message' => 'Profile updated! Syncing to CRM...', 'id' => $final_id]);

    // Push to Zoho in background (non-blocking)
    pushToZohoAsync($saved_data);

} catch (Exception $e) {
    log_debug("FATAL ERROR: " . $e->getMessage());
    ob_end_clean();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
if (isset($conn)) $conn->close();
?>
