<?php

// Get the JSON data sent via POST
$jsonData = file_get_contents('php://input');

// Decode the JSON data into an associative array
$data = json_decode($jsonData, true);

// Check if JSON decoding was successful
if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(array('error' => 'Invalid JSON data'));
    exit;
}

$filePath = '../saveData.json';

// Check if the file exists
if (file_exists($filePath)) {
    $existingData = file_get_contents($filePath);
    $existingDataArray = json_decode($existingData, true);

    // Check if JSON decoding of the existing data was successful
    if ($existingDataArray === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(500);
        echo json_encode(array('error' => 'Failed to read existing data'));
        exit;
    }
} else {
    $existingDataArray = array();
}

// Flag to check if we found a matching entry
$foundMatch = false;

// Loop through the existing data to check for a match
foreach ($existingDataArray as &$entry) {
    if ($entry['database'] === $data['database'] &&
        $entry['table'] === $data['table'] &&
        $entry['equipment'] === $data['equipment']) {
        
        // Overwrite the existing entry with new data
        $entry['parameter'] = $data['parameter'];
        $entry['ucl'] = $data['ucl'];
        $entry['lcl'] = $data['lcl'];
        
        // Mark that we found a match
        $foundMatch = true;
        break;
    }
}

// If no matching entry was found, add the new data as a new entry
if (!$foundMatch) {
    $existingDataArray[] = $data;
}

// Encode the updated data back to JSON
$updatedData = json_encode($existingDataArray, JSON_PRETTY_PRINT);

// Save the updated data back to the file
if (file_put_contents($filePath, $updatedData) !== false) {
    http_response_code(200);
    echo json_encode(array('message' => 'Data successfully saved or updated'));
} else {
    http_response_code(500);
    echo json_encode(array('error' => 'Failed to save data'));
}

?>
