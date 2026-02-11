function validateForm() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMessage = document.getElementById("error-message");

  // safely remove server message
  document.getElementById("msg")?.remove();

  const namePattern = /^[a-zA-Z\s]{3,}$/;
  const phonePattern = /^[6-9]\d{9}$/;

  if (!name || !email || !phone || !password) {
    errorMessage.textContent = "All fields are required.";
    return false;
  }

  if (!namePattern.test(name)) {
    errorMessage.textContent =
      "Name must be at least 3 characters and contain only letters and spaces.";
    return false;
  }

  if (!validateEmail(email)) {
    errorMessage.textContent = "Please enter a valid email address.";
    return false;
  }

  if (!phonePattern.test(phone)) {
    errorMessage.textContent = "Invalid phone number.";
    return false;
  }

  if (password.length < 6) {
    errorMessage.textContent = "Password must be at least 6 characters long.";
    return false;
  }

  errorMessage.textContent = "";
  return true;
}

function validateEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}
