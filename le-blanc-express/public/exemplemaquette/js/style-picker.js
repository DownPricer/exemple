/**
 * Molette de choix de style : Maquette (index) ↔ Refonte
 */
(function () {
  "use strict";

  var STORAGE_KEY = "tnature-style";
  var STYLES = {
    classique: { file: "index.html", label: "Maquette" },
    refonte: { file: "refonte.html", label: "Refonte" },
  };

  function currentStyle() {
    var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (path === "refonte.html") return "refonte";
    return "classique";
  }

  function save(style) {
    try {
      localStorage.setItem(STORAGE_KEY, style);
    } catch (e) {}
  }

  function go(style) {
    if (!STYLES[style] || style === currentStyle()) return;
    save(style);
    var base = location.pathname.replace(/[^/]*$/, "");
    var url = base + STYLES[style].file + location.search + location.hash;
    location.assign(url);
  }

  function mount() {
    var style = currentStyle();
    save(style);

    var root = document.createElement("aside");
    root.className = "style-picker";
    root.dataset.style = style;
    root.setAttribute("aria-label", "Choisir le style du site");
    root.innerHTML =
      '<span class="style-picker__label">Style</span>' +
      '<div class="style-picker__dial" aria-hidden="true">' +
      '  <div class="style-picker__ring"></div>' +
      '  <div class="style-picker__knob"><span class="style-picker__needle"></span></div>' +
      "</div>" +
      '<div class="style-picker__options" role="group" aria-label="Styles disponibles">' +
      '  <button type="button" class="style-picker__btn" data-style="classique">Maquette</button>' +
      '  <button type="button" class="style-picker__btn" data-style="refonte">Refonte</button>' +
      "</div>" +
      '<p class="style-picker__hint">Tourne la molette pour comparer</p>';

    document.body.appendChild(root);

    function sync() {
      var active = currentStyle();
      root.dataset.style = active;
      root.querySelectorAll(".style-picker__btn").forEach(function (btn) {
        var on = btn.getAttribute("data-style") === active;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    sync();

    root.querySelectorAll(".style-picker__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        go(btn.getAttribute("data-style"));
      });
    });

    root.querySelector(".style-picker__dial").addEventListener("click", function () {
      go(currentStyle() === "classique" ? "refonte" : "classique");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
