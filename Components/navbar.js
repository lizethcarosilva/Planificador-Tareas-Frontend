/*
  Navbar transversal: se usa en TODAS las páginas.
  El HTML vive en navbar.html (Components/navbar.html); este archivo
  solo lo trae con fetch, lo inserta donde encuentre <div id="navbar-root">
  y conecta el comportamiento: qué enlace queda activo, los datos del
  usuario, el interruptor de tema (data-bs-theme, que es lo que usa
  Bootstrap 5.3 para su modo oscuro nativo) y el botón de cerrar sesión.
*/
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

  function mountNavbar(active) {
    const mountPoint = document.getElementById("navbar-root");
    if (!mountPoint) return Promise.resolve();

    return fetch("../../Components/navbar.html")
      .then((res) => res.text())
      .then((html) => {
        mountPoint.outerHTML = html;
        setActiveLink(active);
        fillUser();
        initTheme();
        initLogout();
      });
  }

  window.Components = window.Components || {};
  window.Components.mountNavbar = mountNavbar;
})();
