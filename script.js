  // Get the forms
  const signupForm = document.querySelector('.sign-up form');
  const signinForm = document.querySelector('.sign-in form');
  const loginContainer = document.getElementById('container');

  // SIGNUP FORM HANDLING
  if (signupForm) {
      signupForm.addEventListener('submit', function(e) {
          e.preventDefault();

          const name = document.getElementById('signup-name').value;
          const email = document.getElementById('signup-email').value;
          const password = document.getElementById('signup-password').value;
          const major = document.getElementById('signup-major').value;
          const year = document.getElementById('signup-year').value;
          const cycle = document.getElementById('signup-cycle').value;

          // Form validation
          if (!name || !email || !password || !major || !year || !cycle) {
              return alert("Please fill in all fields.");
          }

          if (!/\S+@\S+\.\S+/.test(email)) {
              return alert("Please enter a valid email address.");
          }

          // Validate university email
          if (!email.endsWith('@univ-blida.dz')) {
              return alert("Please use a university email (@univ-blida.dz)");
          }

          // Create user data object
          const userData = {
              fullName: name,
              email: email,
              password: password,
              major: major,
              year: year,
              cycle: cycle
          };

          // Send data to server
          fetch('/register', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(userData)
              })
              .then(response => response.json())
              .then(data => {
                  alert(data.message || "Registration successful!");
                  if (data.success) {
                      // Switch to login form
                      document.getElementById('container').classList.remove("active");
                  }
              })
              .catch(error => {
                  console.error('Error:', error);
                  alert("An error occurred during registration");
              });
      });
  }

  // SIGNIN FORM HANDLING
  if (signinForm) {
      signinForm.addEventListener('submit', function(e) {
          e.preventDefault();

          const email = signinForm.querySelector('input[placeholder="Email"]').value;
          const password = signinForm.querySelector('input[placeholder="Password"]').value;

          // Create login data object
          const loginData = {
              email: email,
              password: password
          };

          // Send data to server
          fetch('/login', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams(loginData)
              })
              .then(response => response.json())
              .then(data => {
                  if (data.success) {
                      // Redirect to homepage
                      window.location.href = "/homepage";
                  } else {
                      alert(data.message || "Login failed");
                  }
              })
              .catch(error => {
                  console.error('Error:', error);
                  alert("An error occurred during login");
              });
      });
  }

  // LOGIN PAGE UI LOGIC
  if (loginContainer) {
      const registerBtn = document.getElementById('register');
      const loginBtn = document.getElementById('login');

      // Handle register button click
      if (registerBtn) {
          registerBtn.addEventListener('click', () => loginContainer.classList.add("active"));
      }

      // Handle login button click
      if (loginBtn) {
          loginBtn.addEventListener('click', () => loginContainer.classList.remove("active"));
      }

      // Password toggle functionality
      document.querySelectorAll('.toggle-password').forEach(icon => {
          icon.addEventListener('click', () => {
              const input = document.getElementById(icon.getAttribute('data-target'));
              if (input.type === 'password') {
                  input.type = 'text';
                  icon.classList.replace('fa-eye', 'fa-eye-slash');
              } else {
                  input.type = 'password';
                  icon.classList.replace('fa-eye-slash', 'fa-eye');
              }
          });
      });
  }

  // PRELOGIN PAGE LOGIC
  window.addEventListener("DOMContentLoaded", () => {
      const preloginLeft = document.querySelector('.split.left');
      const preloginRight = document.querySelector('.split.right');

      if (!preloginLeft || !preloginRight) return;

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
  });