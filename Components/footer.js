/*
  Footer transversal: se usa en TODAS las páginas.
  El HTML vive en footer.html (Components/footer.html); este archivo
  solo lo trae con fetch y lo inserta donde encuentre <div id="footer-root">.
*/
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
