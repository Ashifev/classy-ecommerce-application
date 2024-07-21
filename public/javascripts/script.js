function validateForm() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pwd').value;
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let isValid = true;

    // Clear previous error messages
    emailError.textContent = '';
    passwordError.textContent = '';

    // Email validation
    if (!emailPattern.test(email)) {
        emailError.textContent = 'Please enter a valid email address.';
        isValid = false;
    }

    // Password validation
    if (password.length < 8) {
        passwordError.textContent = 'Password must be at least 8 characters long.';
        isValid = false;
    }

    return isValid;
}