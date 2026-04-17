const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');
const signinBtn = document.getElementById('signin-btn');
const emailInput = document.querySelector('.sign-in input[type="email"]');
const passwordInput = document.querySelector('.sign-in input[type="password"]');

const signupBtn = document.querySelector('.sign-up button');
const signupName = document.querySelector('.sign-up input[type="text"]');
const signupEmail = document.querySelector('.sign-up input[type="email"]');
const signupPassword = document.querySelector('.sign-up input[type="password"]');

const errorDiv = document.createElement('div');
errorDiv.className = 'error-message';
errorDiv.style.cssText = `
    color: #e74c3c;
    font-size: 14px;
    margin-top: 5px;
    text-align: center;
    font-weight: 500;
`;

// Translation Data
const translations = {
    vi: {
        signInTitle: "Đăng nhập",
        signInSubtitle: "Để giữ kết nối với chúng tôi, vui lòng đăng nhập bằng thông tin cá nhân của bạn",
        signUpTitle: "Tạo tài khoản",
        signUpSubtitle: "Đăng ký với thông tin cá nhân của bạn để sử dụng tất cả các tính năng của trang web",
        emailPlaceholder: "Email",
        passwordPlaceholder: "Mật khẩu",
        namePlaceholder: "Họ và tên",
        signInBtn: "Đăng nhập",
        signUpBtn: "Đăng ký",
        errorInvalid: "Thông tin không chính xác. Thử demo/demo1",
        fillAll: "Vui lòng điền đầy đủ thông tin để đăng ký.",
        welcomeBack: "Chào mừng trở lại!",
        helloFriend: "Chào bạn!"
    },
    en: {
        signInTitle: "Sign In",
        signInSubtitle: "To keep connected with us please login with your personal info",
        signUpTitle: "Create Account",
        signUpSubtitle: "Register with your personal details to use all of site features",
        emailPlaceholder: "Email",
        passwordPlaceholder: "Password",
        namePlaceholder: "Name",
        signInBtn: "Sign In",
        signUpBtn: "Sign Up",
        errorInvalid: "Invalid credentials. Try demo/demo1",
        fillAll: "Please fill in all information to register.",
        welcomeBack: "Welcome Back!",
        helloFriend: "Hello, Friend!"
    }
    // Add fr, de, zh as needed...
};

function initTranslations() {
    const lang = localStorage.getItem('mindscan_language') || 'vi';
    const t = translations[lang] || translations.vi;

    // Update Sign In Form
    document.querySelector('.sign-in h1').textContent = t.signInTitle;
    emailInput.placeholder = t.emailPlaceholder;
    passwordInput.placeholder = t.passwordPlaceholder;
    signinBtn.textContent = t.signInBtn;

    // Update Sign Up Form
    document.querySelector('.sign-up h1').textContent = t.signUpTitle;
    signupName.placeholder = t.namePlaceholder;
    signupEmail.placeholder = t.emailPlaceholder;
    signupPassword.placeholder = t.passwordPlaceholder;
    signupBtn.textContent = t.signUpBtn;

    // Update Toggle Panels (Frosted glass area)
    const toggleLeftH1 = document.querySelector('.toggle-left h1');
    const toggleLeftP = document.querySelector('.toggle-left p');
    const toggleRightH1 = document.querySelector('.toggle-right h1');
    const toggleRightP = document.querySelector('.toggle-right p');

    if (toggleLeftH1) toggleLeftH1.textContent = t.welcomeBack;
    if (toggleLeftP) toggleLeftP.textContent = t.signInSubtitle;
    if (toggleRightH1) toggleRightH1.textContent = t.helloFriend;
    if (toggleRightP) toggleRightP.textContent = t.signUpSubtitle;
    
    registerBtn.textContent = t.signUpBtn;
    loginBtn.textContent = t.signInBtn;
}

document.addEventListener('DOMContentLoaded', initTranslations);

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
        const lang = localStorage.getItem('mindscan_language') || 'vi';
        localStorage.setItem('mindscan_currentUser', JSON.stringify({
            name: 'Demo User',
            email: 'demo@example.com'
        }));
        window.location.href = '/';
    } else {
        // Error
        const lang = localStorage.getItem('mindscan_language') || 'vi';
        const t = translations[lang] || translations.vi;
        passwordInput.parentNode.insertBefore(errorDiv.cloneNode(true), passwordInput.nextSibling);
        errorDiv.textContent = t.errorInvalid;
        passwordInput.parentNode.appendChild(errorDiv.cloneNode(true));
        passwordInput.value = '';
        passwordInput.focus();
    }
});

signupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();
    
    if (name && email && password) {
        localStorage.setItem('mindscan_currentUser', JSON.stringify({
            name: name,
            email: email
        }));
        window.location.href = '/';
    } else {
        const lang = localStorage.getItem('mindscan_language') || 'vi';
        const t = translations[lang] || translations.vi;
        alert(t.fillAll);
    }
});
