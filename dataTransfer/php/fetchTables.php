<?php

$servername = "localhost"; 
$username = "root";
$password = ""; 
$database = $_GET['database']; 

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}    
        
$sql = "SHOW TABLES";
$result = $conn->query($sql);

$tables = array();
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $tables[] = $row['Tables_in_' . $database];
    }
}

$conn->close();

header('Content-Type: application/json');
echo json_encode($tables);
?>