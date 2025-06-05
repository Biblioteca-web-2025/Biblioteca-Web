// Auto-login script for testing
async function autoLogin() {
    const email = 'biblioteca.web.2025@gmail.com';
    const password = 'Y&V4Hy@msvomZ:xQ';
    
    // Fill the form fields
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const form = document.querySelector('form');
    
    if (emailInput && passwordInput && form) {
        emailInput.value = email;
        passwordInput.value = password;
        
        // Trigger form submission
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
}

// Auto-execute when page loads (for testing only)
if (window.location.search.includes('auto=true')) {
    setTimeout(autoLogin, 1000);
}
