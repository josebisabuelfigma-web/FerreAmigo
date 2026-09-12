document.addEventListener('DOMContentLoaded', function () {
  // Si ya hay sesión activa, saltar directo a los módulos.
  if (AUTH.isAuthenticated()) {
    window.location.href = 'modulos.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (AUTH.login(username, password)) {
      errorBox.classList.remove('show');
      window.location.href = 'modulos.html';
    } else {
      errorBox.classList.add('show');
    }
  });
});
