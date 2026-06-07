<?php
/**
 * DoAble India - Robust Unified Authentication (SECURE VERSION + EMAIL-FIRST FLOW)
 * Path: doableindia.com/app-sys/app_auth.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'auth_errors.log');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$conn = new mysqli("localhost", "u568476563_Leads", "Leads@786123", "u568476563_Leads");
if ($conn->connect_error) { 
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed'])); 
}

$json = file_get_contents('php://input');
$data = json_decode($json, true) ?: $_POST;

$action   = $data['action'] ?? '';
$email    = $conn->real_escape_string(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';
$userType = $conn->real_escape_string($data['userType'] ?? 'teacher');

/**
 * HELPER: Check email in users table and legacy CRM table
 */
function getEmailStatus($email) {
    global $conn;
    
    // 1. Check registered users
    $userRes = $conn->query("SELECT userType FROM users WHERE email = '$email' LIMIT 1");
    if ($userRes && $userRes->num_rows > 0) {
        $row = $userRes->fetch_assoc();
        return [
            'exists' => true,
            'is_registered' => true,
            'user_type' => $row['userType']
        ];
    }
    
    // 2. Check legacy CRM profiles (Tutors)
    $crmRes = $conn->query("SELECT tutor_id FROM CRM_Leads WHERE email = '$email' LIMIT 1");
    if ($crmRes && $crmRes->num_rows > 0) {
        return [
            'exists' => true,
            'is_registered' => false,
            'user_type' => 'teacher'
        ];
    }
    
    return [
        'exists' => false,
        'is_registered' => false,
        'user_type' => null
    ];
}

// --- EMAIL CHECK (GET) ---
if ($action === 'get') {
    if (empty($email)) {
        die(json_encode(['status' => 'error', 'message' => 'Email required']));
    }
    
    $status = getEmailStatus($email);
    echo json_encode([
        'status' => 'success',
        'data' => $status
    ]);
}

// --- SIGN UP ---
else if ($action === 'signup') {
    if (empty($email) || empty($password)) {
        die(json_encode(['status' => 'error', 'message' => 'Email and Password required']));
    }

    $status = getEmailStatus($email);
    if ($status && $status['is_registered']) {
        die(json_encode(['status' => 'error', 'message' => 'Email already registered. Please Sign In.']));
    }

    if ($status && !$status['is_registered']) {
        die(json_encode(['status' => 'error', 'message' => 'An existing profile was found for this email. Please use "Forgot Password" to verify your identity and set a password.']));
    }
    
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $sql = "INSERT INTO users (email, password, userType, created_at) VALUES ('$email', '$hashedPassword', '$userType', NOW())";
    
    if ($conn->query($sql)) {
        echo json_encode(['status' => 'success', 'userId' => $conn->insert_id, 'message' => 'Account created!']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Signup failed: ' . $conn->error]);
    }
}

// --- SIGN IN ---
else if ($action === 'signin') {
    if (empty($email) || empty($password)) {
        die(json_encode(['status' => 'error', 'message' => 'Email and Password required']));
    }

    $result = $conn->query("SELECT * FROM users WHERE email = '$email'");
    if ($result && $result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if (password_verify($password, $user['password'])) {
            unset($user['password']);
            echo json_encode(['status' => 'success', 'user' => $user]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Incorrect password.']);
        }
    } else {
        $status = getEmailStatus($email);
        if ($status && !$status['is_registered']) {
            echo json_encode(['status' => 'error', 'message' => 'Profile found but no password set. Please use "Forgot Password" to verify your email.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Email not registered. Please Sign Up first.']);
        }
    }
}

// --- FORGOT PASSWORD ---
else if ($action === 'forgot_password') {
    $status = getEmailStatus($email);
    if ($status && $status['exists']) {
         $pin = rand(100000, 999999);
         
         $conn->query("CREATE TABLE IF NOT EXISTS `password_resets` (
            `email` varchar(255) NOT NULL,
            `pin` int(6) NOT NULL,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`email`)
         )");
         $conn->query("REPLACE INTO password_resets (email, pin) VALUES ('$email', '$pin')");

         // Minimalist HTML Email Template
         $subject = "PIN: $pin - DoAble India App";
         
         $message = "
         <div style='font-family: sans-serif; padding: 20px; color: #334155;'>
            <h2 style='color: #0ea5e9; margin: 0; font-size: 20px;'>DoAble India App</h2>
            <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;'>
            
            <p style='font-size: 14px;'>Hello,</p>
            
            <p style='font-size: 14px;'>Your 6-digit security PIN for password reset is:</p>

            <p style='font-size: 32px; font-weight: 900; color: #0f172a; margin: 20px 0; letter-spacing: 5px;'>$pin</p>

            <p style='font-size: 12px; color: #64748b;'>This is a one-time verification code. If you did not request this, please ignore this email.</p>
            
            <p style='font-size: 12px; color: #94a3b8; margin-top: 30px;'>
                Regards,<br>
                <strong>DoAble India App Team</strong>
            </p>
         </div>
         ";
         
         // Secure headers for Inbox deliverability
         $headers = "MIME-Version: 1.0" . "\r\n";
         $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
         $headers .= "From: DoAble India <info@doableindia.com>" . "\r\n";
         $headers .= "Reply-To: info@doableindia.com" . "\r\n";
         $headers .= "X-Priority: 1 (Highest)" . "\r\n";
         $headers .= "X-Mailer: PHP/" . phpversion();

         if (mail($email, $subject, $message, $headers)) {
            echo json_encode(['status' => 'success', 'message' => 'Verification PIN sent to your email.']);
         } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to send email. Please check server mail settings.']);
         }
    } else {
         echo json_encode(['status' => 'error', 'message' => 'No profile found with this email.']);
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
