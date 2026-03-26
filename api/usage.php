<?php
// api/usage.php — Shared multi-user persistence for Benefits26 tracker
// GET  /api/usage → returns current JSON state
// POST /api/usage → saves new JSON state (full replace)
//
// Deploy rule: NEVER overwrite api/data.json or api/snapshots/ on deploy.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$dataFile      = __DIR__ . '/data.json';
$snapshotsDir  = __DIR__ . '/snapshots';

// ── GET ──────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($dataFile)) {
        echo '{}';
        exit;
    }
    echo file_get_contents($dataFile);
    exit;
}

// ── POST ─────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
        exit;
    }

    // Snapshot before overwriting (keep last 20)
    if (is_dir($snapshotsDir) && file_exists($dataFile)) {
        $snap = $snapshotsDir . '/' . date('Y-m-d_H-i-s') . '_' . substr(md5(microtime()), 0, 6) . '.json';
        @copy($dataFile, $snap);
        // Prune old snapshots beyond 20
        $snaps = glob($snapshotsDir . '/*.json');
        if ($snaps && count($snaps) > 20) {
            usort($snaps, fn($a, $b) => filemtime($a) - filemtime($b));
            array_splice($snaps, 20);
            foreach ($snaps as $old) @unlink($old);
        }
    }

    $written = file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    if ($written === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write data file']);
        exit;
    }

    echo json_encode(['ok' => true, 'bytes' => $written, 'ts' => time()]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
