document.getElementById("signInButton").addEventListener("click", async () => {
  const username = document.getElementById("usernameInput").value;
  const password = document.getElementById("passwordInput").value;

  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      const loginErrorElement = document.getElementById("loginError");
      const loggedInUserElement = document.getElementById("loggedInUser");

      if (data.success) {
        alert("Logged in successfully!");
        loginErrorElement.textContent = ""; // Clear any error messages
        loggedInUserElement.textContent = `User: ${username}`; // Display the username
        // Additional logic for successful login can be added here if needed
      } else {
        loginErrorElement.textContent =
          data.error || "Login failed. Please check your credentials.";
      }
    });
});
