<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  echo json_encode(array('ok' => true));
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(array('error' => 'Method not allowed'));
  exit;
}

$gasUrl = 'https://script.google.com/macros/s/AKfycbxD8OLEF3nyDUQ4hO2V1yTEoRRlz0qV2DbGt38-LqRjqj0oUqZne90C6wIiIdfpc19L6g/exec';
$body = file_get_contents('php://input');

$ch = curl_init($gasUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json', 'Accept: application/json'));
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false) {
  http_response_code(502);
  echo json_encode(array('error' => 'proxy_error', 'message' => $curlError ?: 'Unknown proxy error'));
  exit;
}

$decoded = json_decode($response, true);
if (json_last_error() === JSON_ERROR_NONE) {
  if (is_array($decoded)) {
    $decoded['upstream_status'] = $httpCode;
    echo json_encode($decoded);
  } else {
    echo json_encode(array('success' => true, 'upstream_status' => $httpCode, 'data' => $decoded));
  }
  exit;
}

echo json_encode(array('success' => false, 'upstream_status' => $httpCode, 'raw' => $response));