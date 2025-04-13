<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "safety_hub";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$user = $_POST['username'];
$pass = $_POST['password'];

$sql = "INSERT INTO users (username, password) VALUES ('$user', '$pass')";
$conn->query($sql);

echo "Login successful!";
$conn->close();
?>
