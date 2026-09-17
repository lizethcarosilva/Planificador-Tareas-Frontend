(() => {
  "use strict";

  const STORAGE_THEME = "planificador.theme";

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

  // ===== Formulario de registro =====
  const form = document.getElementById("registerForm");
  const errorBox = document.getElementById("registerError");
  const successBox = document.getElementById("registerSuccess");
  const submitBtn = form.querySelector("button[type='submit']");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = passwordInput.value;
    if (password.length < 5) {
      errorBox.textContent = "La contraseña debe tener al menos 5 caracteres.";
      errorBox.hidden = false;
      successBox.hidden = true;
      return;
    }

    errorBox.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "CREANDO CUENTA...";

    const payload = {
      name: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      password,
      birthDate: document.getElementById("birthDate").value || null,
    };

    try {
      await Auth.register(payload);
      successBox.hidden = false;
      form.reset();

      setTimeout(() => {
        window.location.href = "../inicio-sesion/inicio-sesion.html";
      }, 1800);
    } catch (error) {
      errorBox.textContent = error.message || "No se pudo crear la cuenta.";
      errorBox.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "REGISTRARSE";
    }
  });
})();
