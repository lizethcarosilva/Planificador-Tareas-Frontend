(() => {
  "use strict";

  const STORAGE_THEME = "planificador.theme";

  // Si ya hay una sesión activa, no tiene sentido mostrar el login.
  if (Auth.getUser()) {
    window.location.replace("../tareas/tareas.html");
    return;
  }

  // ===== Tema claro/oscuro =====
  const themeToggle = document.getElementById("themeToggle");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-bs-theme", theme);
    themeToggle.checked = theme === "light";
    localStorage.setItem(STORAGE_THEME, theme);
  }

  themeToggle.addEventListener("change", () => {
    applyTheme(themeToggle.checked ? "light" : "dark");
  });

  applyTheme(localStorage.getItem(STORAGE_THEME) || "dark");

  // ===== Mostrar/ocultar contraseña =====
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");
  togglePassword.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    togglePassword.querySelector("i").className = isHidden ? "bi bi-eye" : "bi bi-eye-slash";
  });

  // ===== Formulario de acceso =====
  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = passwordInput.value;
    const success = Auth.login(email, password);

    if (success) {
      window.location.href = "../tareas/tareas.html";
    } else {
      errorBox.hidden = false;
    }
  });
})();
