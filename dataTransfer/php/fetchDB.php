<?php

$servername = "localhost"; 
$username = "root"; 
$password = ""; 

$conn = new mysqli($servername, $username, $password);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql = "SHOW DATABASES";
$result = $conn->query($sql);

$databases = array();
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $databases[] = $row['Database'];
    }
}

$conn->close();

header('Content-Type: application/json');
echo json_encode($databases);
?>