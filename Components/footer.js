// Footer compartido por todas las páginas. Carga footer.html y lo inserta en la página.
(() => {
  "use strict";

  function mountFooter() {
    const mountPoint = document.getElementById("footer-root");
    if (!mountPoint) return Promise.resolve();

    return fetch("../../Components/footer.html")
      .then((res) => res.text())
      .then((html) => {
        mountPoint.outerHTML = html;
      });
  }

  window.Components = window.Components || {};
  window.Components.mountFooter = mountFooter;
})();
