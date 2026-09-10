// Navbar compartida por todas las páginas. Carga navbar.html y le da comportamiento.
(() => {
  "use strict";

  const STORAGE_THEME = "planificador.theme";

  function setActiveLink(active) {
    document.querySelectorAll("#mainNav .nav-link[data-nav-key]").forEach((link) => {
      const isActive = link.dataset.navKey === active;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function fillUser() {
    const user = window.Auth ? window.Auth.getUser() : null;
    const name = user ? user.name : "Invitado";

    document.getElementById("navUserName").textContent = name;
    document.getElementById("navUserInitial").textContent = name.charAt(0).toUpperCase();
    document.getElementById("navUserEmail").textContent = user ? user.email : "";
  }

  function initTheme() {
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
  }

  function initLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;
    logoutBtn.addEventListener("click", () => {
      window.Auth.logout();
      window.location.href = "../inicio-sesion/inicio-sesion.html";
    });
  }

  function fillStats() {
    const statCompleted = document.getElementById("statCompleted");
    const statPending = document.getElementById("statPending");
    if (!statCompleted || !statPending) return;

    try {
      const rawTasks = localStorage.getItem("tasks");
      if (rawTasks) {
        const tasks = JSON.parse(rawTasks);
        if (Array.isArray(tasks) && tasks.length > 0) {
          const completed = tasks.filter(
            (t) => t.status === "DONE" || t.status === "HECHO"
          ).length;
          const pending = tasks.length - completed;
          statCompleted.textContent = completed;
          statPending.textContent = pending;
          return;
        }
      }
    } catch (e) {
      console.warn(e);
    }

    statCompleted.textContent = "2";
    statPending.textContent = "6";
  }

  function mountNavbar(active) {
    const mountPoint = document.getElementById("navbar-root");
    if (!mountPoint) return Promise.resolve();

    return fetch("../../Components/navbar.html")
      .then((res) => res.text())
      .then((html) => {
        mountPoint.outerHTML = html;
        setActiveLink(active);
        fillUser();
        fillStats();
        initTheme();
        initLogout();
      });
  }

  window.Components = window.Components || {};
  window.Components.mountNavbar = mountNavbar;
  window.Components.fillStats = fillStats;
})();
