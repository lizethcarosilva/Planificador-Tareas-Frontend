// Sesión respaldada por el backend (Spring Boot). El usuario autenticado
// se guarda en localStorage solo para no pedir login en cada página.
(() => {
  "use strict";

  const STORAGE_AUTH = "planificador.auth";

  function setUser(user) {
    localStorage.setItem(STORAGE_AUTH, JSON.stringify(user));
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_AUTH);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async function login(email, password) {
    const user = await window.Api.login({ email: email.trim().toLowerCase(), password });
    setUser(user);
    return user;
  }

  async function register(payload) {
    return window.Api.register(payload);
  }

  function logout() {
    localStorage.removeItem(STORAGE_AUTH);
  }

  async function updateProfile(payload) {
    const current = getUser();
    const updated = await window.Api.updateProfile(current.id, payload);
    setUser(updated);
    return updated;
  }

  window.Auth = { login, register, logout, getUser, setUser, updateProfile };
})();
