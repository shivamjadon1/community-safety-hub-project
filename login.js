
document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    
    if (email === "user@example.com" && password === "password123") {
        alert("Login Successful!");
        window.location.href = "index.html";
    } else {
        alert("Invalid Credentials");
    }
    
});
