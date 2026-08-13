// Usuario de prueba hardcodeado. La sesión se guarda en localStorage.
(() => {
  "use strict";

  const STORAGE_AUTH = "planificador.auth";

  const HARDCODED_USER = {
    email: "lizethcaro@correo.com",
    password: "12345",
    name: "Lizeth Caro",
  };

  function login(email, password) {
    const validEmail = email.trim().toLowerCase() === HARDCODED_USER.email;
    const validPassword = password === HARDCODED_USER.password;
    if (!validEmail || !validPassword) return false;

    localStorage.setItem(STORAGE_AUTH, JSON.stringify({ email: HARDCODED_USER.email, name: HARDCODED_USER.name }));
    return true;
  }

  function logout() {
    localStorage.removeItem(STORAGE_AUTH);
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_AUTH);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  window.Auth = { login, logout, getUser, HARDCODED_USER };
})();
