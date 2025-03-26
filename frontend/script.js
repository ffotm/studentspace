const loginContainer = document.getElementById('container');
if (loginContainer) {
    const registerBtn = document.getElementById('register');
    const loginBtn = document.getElementById('login');
    const signupForm = document.getElementById('signup-form');

    // Switch form
    if (registerBtn) {
        registerBtn.addEventListener('click', () => loginContainer.classList.add("active"));
    }
    if (loginBtn) {
        loginBtn.addEventListener('click', () => loginContainer.classList.remove("active"));
    }

    // Signup validation
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const inputs = signupForm.querySelectorAll('input');
            const [name, email, password] = [inputs[0].value, inputs[1].value, inputs[2].value];
            if (!name || !email || !password) return alert("Please fill in all fields.");
            if (!/\S+@\S+\.\S+/.test(email)) return alert("Please enter a valid email address.");
            alert("Sign up successful!");
        });
    }

    // Password toggle
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', () => {
            const input = document.getElementById(icon.getAttribute('data-target'));
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.replace('fa-eye', 'fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.replace('fa-eye-slash', 'fa-eye');
                }
            }
        });
    });

    // Theme setup
    const role = localStorage.getItem('userRole');
    if (role === 'teacher') {
        document.body.classList.add('theme-teacher');

        // Text content for teacher
        const toggleLeftTitle = document.getElementById('toggle-left-title');
        const toggleLeftText = document.getElementById('toggle-left-text');
        const toggleRightTitle = document.getElementById('toggle-right-title');
        const toggleRightText = document.getElementById('toggle-right-text');
        const signinTitle = document.getElementById('signin-title');
        const signinSubtitle = document.getElementById('signin-subtitle');
        const signupTitle = document.getElementById('signup-title');
        const signupSubtitle = document.getElementById('signup-subtitle');

        if (toggleLeftTitle) toggleLeftTitle.textContent = "Hello, Teacher!";
        if (toggleLeftText) toggleLeftText.textContent = "Register to manage your courses and students.";
        if (toggleRightTitle) toggleRightTitle.textContent = "Welcome Back, Teacher!";
        if (toggleRightText) toggleRightText.textContent = "Enter your credentials to access the teacher portal.";
        if (signinTitle) signinTitle.textContent = "Teacher Sign In";
        if (signinSubtitle) signinSubtitle.textContent = "Use your email and password to continue";
        if (signupTitle) signupTitle.textContent = "Create Account";
        if (signupSubtitle) signupSubtitle.textContent = "Use your institutional email to register";
    } else if (role === 'student') {
        document.body.classList.add('theme-student');
    }
}

// PRELOGIN PAGE LOGIC
const preloginLeft = document.querySelector('.split.left');
const preloginRight = document.querySelector('.split.right');

if (preloginLeft && preloginRight) {
    preloginLeft.addEventListener("mouseenter", () =>
        document.body.classList.add("hover-left")
    );
    preloginLeft.addEventListener("mouseleave", () =>
        document.body.classList.remove("hover-left")
    );
    preloginRight.addEventListener("mouseenter", () =>
        document.body.classList.add("hover-right")
    );
    preloginRight.addEventListener("mouseleave", () =>
        document.body.classList.remove("hover-right")
    );

    preloginLeft.addEventListener('click', () => {
        localStorage.setItem('userRole', 'student');
        window.location.href = "login.html";
    });

    preloginRight.addEventListener('click', () => {
        localStorage.setItem('userRole', 'teacher');
        window.location.href = "login.html";
    });
}