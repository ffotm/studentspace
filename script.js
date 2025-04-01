

//LOGIN PAGE LOGIC
const loginContainer = document.getElementById('container');

if (loginContainer) {
  const registerBtn = document.getElementById('register');
  const loginBtn = document.getElementById('login');
  const signupForm = document.getElementById('signup-form');


  registerBtn?.addEventListener('click', () => loginContainer.classList.add("active"));
  loginBtn?.addEventListener('click', () => loginContainer.classList.remove("active"));


  signupForm?.addEventListener('submit', function (e) {
    e.preventDefault();

    const inputs = signupForm.querySelectorAll('input');
    const [name, email, password] = [inputs[0].value, inputs[1].value, inputs[2].value];

    const yearSelect = document.getElementById('signup-year');
    const cycleSelect = signupForm.querySelector('select:nth-of-type(2)');

    const year = yearSelect.value;
    const cycle = cycleSelect.value;

    if (!name || !email || !password || !year || !cycle) {
      return alert("Please fill in all fields.");
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return alert("Please enter a valid email address.");
    }

    console.log("Year:", year);
    console.log("Cycle:", cycle);

    alert("Sign up successful!");
  });


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