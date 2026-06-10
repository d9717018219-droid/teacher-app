<?php
/**
 * DoAble India - Robust Unified Authentication (FINAL VERSION)
 * Path: doableindia.com/app-sys/app_auth.php
 * This version handles both Tutor (Leads) and Parent (Contacts) databases.
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// Main connection for Users and Tutor Leads
$conn = new mysqli("localhost", "u568476563_Leads", "Leads@786123", "u568476563_Leads");
if ($conn->connect_error) { 
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed'])); 
}

// Handle both JSON and URL-encoded POST
$json = file_get_contents('php://input');
$data = json_decode($json, true) ?: $_POST;

$action   = $data['action'] ?? '';
$email    = $conn->real_escape_string(trim($data['email'] ?? ''));
$phone    = $conn->real_escape_string(trim($data['phone'] ?? ''));
$password = $data['password'] ?? '';
$userType = $conn->real_escape_string($data['userType'] ?? 'teacher');

/**
 * HELPER: Check profile in users table and legacy CRM tables (Tutors & Parents)
 */
function getProfileStatus($email, $phone = '') {
    global $conn;
    
    // 1. Check registered users table
    $where = [];
    if (!empty($email)) $where[] = "email = '$email'";
    if (!empty($phone)) {
        $cleanPhone = str_replace('+', '', $phone);
        $where[] = "phone = '$phone'";
        $where[] = "phone = '$cleanPhone'";
        $where[] = "phone LIKE '%$cleanPhone%'";
    }
    
    if (!empty($where)) {
        $whereStr = implode(" OR ", $where);
        $userRes = $conn->query("SELECT userType FROM users WHERE $whereStr LIMIT 1");
        if ($userRes && $userRes->num_rows > 0) {
            $row = $userRes->fetch_assoc();
            return [
                'exists' => true,
                'is_registered' => true,
                'user_type' => $row['userType']
            ];
        }
    }
    
    // 2. Check legacy CRM profiles (Tutors - CRM_Leads)
    $whereCRM = [];
    if (!empty($email)) $whereCRM[] = "email = '$email' OR Email = '$email'";
    if (!empty($phone)) {
        $cleanPhone = str_replace('+', '', $phone);
        $whereCRM[] = "phone = '$phone'";
        $whereCRM[] = "Phone = '$phone'";
        $whereCRM[] = "phone LIKE '%$cleanPhone%'";
        $whereCRM[] = "Phone LIKE '%$cleanPhone%'";
    }
    
    if (!empty($whereCRM)) {
        $whereCRMStr = implode(" OR ", $whereCRM);
        $crmRes = $conn->query("SELECT tutor_id FROM CRM_Leads WHERE $whereCRMStr LIMIT 1");
        if ($crmRes && $crmRes->num_rows > 0) {
            return [
                'exists' => true,
                'is_registered' => false,
                'user_type' => 'teacher'
            ];
        }

        // 3. Check legacy CRM profiles (Parents - CRM_Contacts)
        // We use the same $whereCRMStr. We need to check if the table exists in this DB or the other.
        // Assuming cross-DB access or same DB server.
        $crmParentRes = $conn->query("SELECT order_id FROM u568476563_CRM_Contacts.CRM_Contacts WHERE $whereCRMStr LIMIT 1");
        if ($crmParentRes && $crmParentRes->num_rows > 0) {
            return [
                'exists' => true,
                'is_registered' => false,
                'user_type' => 'parent'
            ];
        }
    }
    
    return [
        'exists' => false,
        'is_registered' => false,
        'user_type' => null
    ];
}

// --- PROFILE CHECK (GET) ---
if ($action === 'get') {
    if (empty($email) && empty($phone)) {
        die(json_encode(['status' => 'error', 'message' => 'Email or Phone required']));
    }
    
    $status = getProfileStatus($email, $phone);
    echo json_encode([
        'status' => 'success',
        'data' => $status
    ]);
}

// --- SIGN UP ---
else if ($action === 'signup') {
    if (empty($email) && empty($phone)) {
        die(json_encode(['status' => 'error', 'message' => 'Email or Phone required']));
    }
    if (empty($password)) {
        die(json_encode(['status' => 'error', 'message' => 'Password required']));
    }

    $status = getProfileStatus($email, $phone);
    if ($status && $status['is_registered']) {
        die(json_encode(['status' => 'error', 'message' => 'Email or Phone already registered. Please Sign In.']));
    }

    // Allow signup even if legacy profile exists (they just need to set a password)
    // Actually, if legacy exists, they should use forgot password, but we can also allow signup to merge.
    
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $sql = "INSERT INTO users (email, phone, password, userType, created_at) VALUES ('$email', '$phone', '$hashedPassword', '$userType', NOW())";
    
    if ($conn->query($sql)) {
        echo json_encode(['status' => 'success', 'userId' => $conn->insert_id, 'message' => 'Account created!']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Signup failed: ' . $conn->error]);
    }
}

// --- SIGN IN ---
else if ($action === 'signin') {
    if ((empty($email) && empty($phone)) || empty($password)) {
        die(json_encode(['status' => 'error', 'message' => 'Email/Phone and Password required']));
    }

    $where = $email ? "email = '$email'" : "phone = '$phone'";
    $result = $conn->query("SELECT * FROM users WHERE $where");
    if ($result && $result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if (password_verify($password, $user['password'])) {
            unset($user['password']);
            echo json_encode(['status' => 'success', 'user' => $user]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Incorrect password.']);
        }
    } else {
        $status = getProfileStatus($email, $phone);
        if ($status && !$status['is_registered']) {
            echo json_encode(['status' => 'error', 'message' => 'Profile found but no password set. Please use "Forgot Password" to verify your identity.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Account not registered. Please Sign Up first.']);
        }
    }
}

// --- FORGOT PASSWORD ---
else if ($action === 'forgot_password') {
    $status = getProfileStatus($email, $phone);
    if ($status && $status['exists']) {
         $pin = rand(100000, 999999);
         
         $conn->query("CREATE TABLE IF NOT EXISTS `password_resets` (
            `email` varchar(255) NOT NULL,
            `phone` varchar(20) DEFAULT NULL,
            `pin` int(6) NOT NULL,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`email`)
         )");
         
         $emailKey = $email ? $email : "phone_reset_$phone@doableindia.com";
         $conn->query("REPLACE INTO password_resets (email, phone, pin) VALUES ('$emailKey', '$phone', '$pin')");

         if ($email && strpos($email, '@') !== false) {
             // Send Email logic
             $subject = "PIN: $pin - DoAble India App";
             $message = "Your 6-digit security PIN is: $pin";
             $headers = "From: info@doableindia.com";
             mail($email, $subject, $message, $headers);
             echo json_encode(['status' => 'success', 'message' => 'Verification PIN sent to your email.']);
         } else {
             // For Phone-only, they might need WhatsApp OTP (handled by frontend usually, but we confirm existence here)
             echo json_encode(['status' => 'success', 'message' => 'Profile verified. Use the OTP sent to your WhatsApp.', 'pin' => $pin]);
         }
    } else {
         echo json_encode(['status' => 'error', 'message' => 'No profile found with this identity.']);
    }
}

// --- RESET PASSWORD ---
else if ($action === 'reset_password') {
    $pin = (int)($data['pin'] ?? 0);
    $checkPin = $conn->query("SELECT pin FROM password_resets WHERE email = '$email'");
    if ($checkPin && $checkPin->num_rows > 0) {
        $stored = $checkPin->fetch_assoc()['pin'];
        if ($pin === (int)$stored) {
            $newPass = password_hash($password, PASSWORD_DEFAULT);
            $conn->query("REPLACE INTO users (email, password, userType) VALUES ('$email', '$newPass', '$userType')");
            $conn->query("DELETE FROM password_resets WHERE email = '$email'");
            echo json_encode(['status' => 'success', 'message' => 'Password updated. Please Sign In.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid Security PIN.']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No reset request found or PIN expired.']);
    }
}

else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action: ' . $action]);
}

$conn->close();
?>
