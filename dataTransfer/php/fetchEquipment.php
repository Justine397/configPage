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

$sqlEquipment = "SELECT DISTINCT EquipmentNo FROM $tableName";  

$resultEquipment = $conn->query($sqlEquipment);

$equipment = array();

if ($resultEquipment->num_rows > 0) {
    while($row = $resultEquipment->fetch_assoc()) {
        $equipment[] = $row['EquipmentNo'];  
    }
}

$conn->close();

header('Content-Type: application/json');
echo json_encode($equipment);
?>