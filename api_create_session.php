<?php
/**
 * DoAble India - Zoho Payments Session Creator (OAuth Version)
 * Path: doableindia.com/app-sys/api_create_session.php
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// Zoho OAuth Credentials
define('ZOHO_CLIENT_ID',     '1000.VNNYQAYAKOUP2TNO97FIGD4RI41K1C');
define('ZOHO_CLIENT_SECRET', 'f6e379a5534faa80cc9f3294ee84d6860d31858886');
define('ZOHO_REFRESH_TOKEN', '1000.e05bd5af941dd508caef640d1e06d573.f64cee4d447f4e2a5843377e64ce2076');
define('ZOHO_ACCOUNT_ID',    '60036233618');

$json = file_get_contents('php://input');
$data = json_decode($json, true) ?: $_POST;

$amount        = $data['amount'] ?? null;
$description   = $data['description'] ?? 'Premium Support';
$customer_name = $data['customer_name'] ?? 'Customer';
$customer_email= $data['customer_email'] ?? '';
$customer_phone= preg_replace('/\D/', '', $data['customer_phone'] ?? '');

if (!$amount) {
    die(json_encode(['status' => 'error', 'message' => 'Amount is required']));
}

// 1. Get Access Token via Refresh Token
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
$authResponse = curl_exec($ch);
curl_close($ch);

$authData = json_decode($authResponse, true);
$accessToken = $authData['access_token'] ?? null;

if (!$accessToken) {
    die(json_encode(['status' => 'error', 'message' => 'Zoho Auth Failed', 'debug' => $authData]));
}

// 2. Create Payment Session Payload (Structure verified via test)
$sessionData = [
    'amount'      => floatval($amount),
    'currency'    => 'INR',
    'description' => substr(preg_replace('/[^a-zA-Z0-9 ]/', '', $description), 0, 100),
    'customer_id' => '5387000000750027', // Verified customer_id
    'configurations' => [
        'hosted_checkout_parameters' => [
            'name'               => substr($customer_name, 0, 50),
            'email'              => $customer_email,
            'phone'              => substr($customer_phone, -10),
            'phone_country_code' => 'IN',
            'description'        => substr($description, 0, 50),
            'success_url'        => 'https://doableindia.com/payment-success',
            'failure_url'        => 'https://doableindia.com/payment-failure'
        ]
    ]
];

// Log request
file_put_contents('zoho_pay.log', date('[Y-m-d H:i:s] ') . "Request: " . json_encode($sessionData) . "\n", FILE_APPEND);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://payments.zoho.in/api/v1/paymentsessions?account_id=" . ZOHO_ACCOUNT_ID);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Zoho-oauthtoken $accessToken",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($sessionData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Log response
file_put_contents('zoho_pay.log', date('[Y-m-d H:i:s] ') . "HTTP: $httpCode | Body: $response\n", FILE_APPEND);

$sessionRes = json_decode($response, true);

if (isset($sessionRes['payments_session']['payments_session_id'])) {
    echo json_encode([
        'status'             => 'success',
        'payment_session_id' => $sessionRes['payments_session']['payments_session_id']
    ]);
} else {
    echo json_encode([
        'status'  => 'error',
        'message' => $sessionRes['message'] ?? 'Failed to create payment session',
        'debug'   => $sessionRes
    ]);
}
?>
