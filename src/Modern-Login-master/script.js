const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');
const signinBtn = document.getElementById('signin-btn');
const emailInput = document.querySelector('.sign-in input[type="email"]');
const passwordInput = document.querySelector('.sign-in input[type="password"]');
const errorDiv = document.createElement('div');
errorDiv.className = 'error-message';
errorDiv.style.cssText = `
    color: #e74c3c;
    font-size: 14px;
    margin-top: 5px;
    text-align: center;
    font-weight: 500;
`;

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

signinBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    if (email === 'demo' && password === 'demo1') {
        // Success: set localStorage and close popup
        localStorage.setItem('mindscan_currentUser', JSON.stringify({
            name: 'Demo User',
            email: 'demo@example.com'
        }));
        window.location.href = '/';
    } else {
        // Error
        passwordInput.parentNode.insertBefore(errorDiv.cloneNode(true), passwordInput.nextSibling);
        errorDiv.textContent = 'Invalid credentials. Try demo/demo1';
        passwordInput.parentNode.appendChild(errorDiv.cloneNode(true));
        passwordInput.value = '';
        passwordInput.focus();
    }
});
