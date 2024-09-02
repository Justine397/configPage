<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = $_GET['database'];
$tableName = $_GET['table'];

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sqlColumns = "SELECT COLUMN_NAME FROM information_schema.columns WHERE TABLE_SCHEMA = '$dbname' AND TABLE_NAME = '$tableName'";

$resultColumns = $conn->query($sqlColumns);

$columns = array();
    
if ($resultColumns->num_rows > 0) {
    while($row = $resultColumns->fetch_assoc()) {
        $columns[] = $row['COLUMN_NAME'];
    }
}

$conn->close();

header('Content-Type: application/json');
echo json_encode($columns);
?>