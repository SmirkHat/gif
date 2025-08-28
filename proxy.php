<?php
// ZMEN TOHLE, VELICE DULEZITE
$apiKey = 'IMGBB_API_KEY';

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

function respond($data, $httpStatus = 200)
{
	http_response_code($httpStatus);
	echo json_encode($data);
	exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond(['error' => 'Method not allowed. Use POST.'], 405);
}

if (!isset($_FILES['image'])) {
	respond(['error' => 'No file uploaded'], 400);
}

$image = $_FILES['image']['tmp_name'];

if (!is_readable($image)) {
	respond(['error' => 'Uploaded file is not readable'], 400);
}

$postData = [
	'key' => $apiKey,
	'image' => base64_encode(file_get_contents($image))
];

$ch = curl_init('https://api.imgbb.com/1/upload');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
	respond(['error' => 'cURL error: ' . $curlError], 500);
}

$json = json_decode($response, true);
if ($json === null) {
	respond(['error' => 'Invalid response from ImgBB'], 502);
}

if (isset($json['success']) && !$json['success']) {
	$status = $json['status'] ?? 500;
	$errorMsg = $json['error']['message'] ?? 'Unknown error from ImgBB';
	respond(['error' => $errorMsg], $status);
}

respond([
	'success' => true,
	'data' => $json['data']
], 200);
