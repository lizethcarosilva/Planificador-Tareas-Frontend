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
  const submitBtn = form.querySelector("button[type='submit']");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = passwordInput.value;

    errorBox.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "INGRESANDO...";

    try {
      await Auth.login(email, password);
      window.location.href = "../tareas/tareas.html";
    } catch (error) {
      errorBox.textContent = error.message || "Correo o contraseña incorrectos.";
      errorBox.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "INICIAR SESIÓN";
    }
  });

  // ===== ¿Olvidaste tu contraseña? (diálogo) =====
  const forgotPasswordModalEl = document.getElementById("forgotPasswordModal");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const resetEmailInput = document.getElementById("resetEmail");
  const newPasswordInput = document.getElementById("newPassword");
  const resetSuccess = document.getElementById("resetSuccess");
  const resetError = document.getElementById("resetError");
  const resetBtn = document.getElementById("resetPasswordBtn");

  forgotPasswordModalEl.addEventListener("show.bs.modal", () => {
    resetError.hidden = true;
    resetSuccess.hidden = true;
    forgotPasswordForm.reset();
    resetEmailInput.value = document.getElementById("email").value.trim();
  });

  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = resetEmailInput.value.trim();
    const newPassword = newPasswordInput.value;

    resetError.hidden = true;
    resetSuccess.hidden = true;

    if (newPassword.length < 5) {
      resetError.textContent = "La contraseña debe tener al menos 5 caracteres.";
      resetError.hidden = false;
      return;
    }

    resetBtn.disabled = true;
    resetBtn.textContent = "GUARDANDO...";

    try {
      await window.Api.resetPassword({ email: email.toLowerCase(), newPassword });
      resetSuccess.hidden = false;
      forgotPasswordForm.reset();
    } catch (error) {
      resetError.textContent = error.message || "No se pudo actualizar la contraseña.";
      resetError.hidden = false;
    } finally {
      resetBtn.disabled = false;
      resetBtn.textContent = "RESTABLECER CONTRASEÑA";
    }
  });
})();
