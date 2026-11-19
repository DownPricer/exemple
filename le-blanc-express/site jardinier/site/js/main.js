/**
 * T'Nature & Jardin — interactions
 *
 * Formulaire : Web3Forms (https://web3forms.com)
 * 1. Créez une clé gratuite sur web3forms.com
 * 2. Remplacez YOUR_WEB3FORMS_ACCESS_KEY ci-dessous
 * Sans clé valide, l'envoi affiche une erreur (aucun faux succès).
 */
(function () {
  "use strict";

  var WEB3FORMS_ACCESS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY";

  /* ——— Menu burger ——— */
  var toggle = document.getElementById("menu-toggle");
  var nav = document.getElementById("nav-mobile");

  function setMenu(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle("is-open", open);
    nav.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  }

  if (toggle && nav) {
    setMenu(false);
    toggle.addEventListener("click", function () {
      setMenu(!nav.classList.contains("is-open"));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ——— Smooth scroll avec offset header ——— */
  function headerOffset() {
    var header = document.querySelector(".site-header");
    return header ? header.offsetHeight + 8 : 80;
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset();
      window.scrollTo({ top: top, behavior: "smooth" });
      if (history.pushState) history.pushState(null, "", id);
    });
  });

  /* ——— Formulaire Web3Forms ——— */
  var form = document.getElementById("contact-form");
  var statusEl = document.getElementById("form-status");
  var submitBtn = document.getElementById("form-submit");

  function showStatus(type, message) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = "form-status is-visible is-" + type;
  }

  function clearStatus() {
    if (!statusEl) return;
    statusEl.textContent = "";
    statusEl.className = "form-status";
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearStatus();

      if (!form.checkValidity()) {
        form.reportValidity();
        showStatus("error", "Merci de remplir tous les champs obligatoires.");
        return;
      }

      if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY") {
        showStatus(
          "error",
          "Le formulaire n'est pas encore configuré. Appelez le 06 78 50 33 89, ou configurez votre clé Web3Forms dans js/main.js (voir README)."
        );
        return;
      }

      var data = new FormData(form);
      data.append("access_key", WEB3FORMS_ACCESS_KEY);
      data.append("subject", "Demande T'Nature & Jardin — " + (data.get("service") || "Contact"));
      data.append("from_name", "Site T'Nature & Jardin");

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Envoi en cours…";
      }

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: data,
      })
        .then(function (res) {
          return res.json().then(function (json) {
            return { ok: res.ok, json: json };
          });
        })
        .then(function (result) {
          if (result.json && result.json.success) {
            showStatus(
              "success",
              "Merci ! Votre demande a bien été envoyée. Thomas vous recontactera rapidement."
            );
            form.reset();
          } else {
            var msg =
              (result.json && result.json.message) ||
              "L'envoi a échoué. Réessayez ou appelez le 06 78 50 33 89.";
            showStatus("error", msg);
          }
        })
        .catch(function () {
          showStatus(
            "error",
            "Impossible d'envoyer le message (réseau ou service indisponible). Appelez le 06 78 50 33 89."
          );
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Envoyer ma demande";
          }
        });
    });
  }
})();
