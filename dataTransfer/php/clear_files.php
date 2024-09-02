<?php
header('Content-Type: application/json');

$saveDataPath = '../saveData.json';
$rowDataPath =  '../rowData.json';

function clearJsonFile($filePath) {
    if (file_put_contents($filePath, json_encode([])) === false) {
        error_log("Failed to write to file: $filePath");
        return false;
    }
    return true;
}

$saveDataCleared = clearJsonFile($saveDataPath);
$rowDataCleared = clearJsonFile($rowDataPath);

if ($saveDataCleared && $rowDataCleared) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to clear one or both files']);
}
?> 