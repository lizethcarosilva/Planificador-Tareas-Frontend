

(() => {
  "use strict";

  const STORAGE_THEME = "planificador.theme";
  const STORAGE_STATS = "planificador.stats";

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

  async function fillStats() {
    const statCompleted = document.getElementById("statCompleted");
    const statPending = document.getElementById("statPending");
    if (!statCompleted || !statPending) return;

    if (!window.Api) return;

    try {
      const tasks = await window.Api.getTasks();
      const completed = tasks.filter(
        (t) => t.status === "DONE" || t.status === "HECHO"
      ).length;
      const pending = tasks.length - completed;
      statCompleted.textContent = completed;
      statPending.textContent = pending;
      localStorage.setItem(STORAGE_STATS, JSON.stringify({ completed, pending }));
    } catch (e) {
      console.warn("No se pudieron cargar las estadísticas del backend:", e);
      statCompleted.textContent = "-";
      statPending.textContent = "-";
    }
  }

  function initNavbar(active) {
    if (!document.getElementById("mainNav")) return;
    setActiveLink(active);
    fillUser();
    fillStats();
    initTheme();
    initLogout();
  }

  window.Components = window.Components || {};
  window.Components.initNavbar = initNavbar;
  window.Components.fillStats = fillStats;
})();
