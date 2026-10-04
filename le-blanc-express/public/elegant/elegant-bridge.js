(function () {
  "use strict";
  const STORAGE_KEY = "siteready-design";
  document.body.dataset.page = "elegant";

  function scrollToSelector() {
    const el = document.getElementById("style-selector");
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  }

  function setActive(design) {
    document.querySelectorAll("[data-theme-active]").forEach((node) => {
      const active = node.getAttribute("data-theme-active") === design;
      node.classList.toggle("is-active", active);
    });
  }

  document.addEventListener("click", (event) => {
    const toDyn = event.target.closest("[data-go-dynamique]");
    if (toDyn) {
      event.preventDefault();
      sessionStorage.setItem(STORAGE_KEY, "dynamique");
      window.location.href = "/#style-selector";
    }
  });

  const saved = sessionStorage.getItem(STORAGE_KEY);
  setActive(saved === "dynamique" ? "dynamique" : "elegant");
  sessionStorage.setItem(STORAGE_KEY, "elegant");

  if (window.location.hash === "#style-selector") {
    window.addEventListener("load", scrollToSelector);
  }

  const form = document.getElementById("contact-form");
  if (!form) return;

  const websiteWrap = document.getElementById("website-url-wrap");
  form.querySelectorAll('[name="hasWebsite"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const show = form.querySelector('[name="hasWebsite"]:checked')?.value === "yes";
      if (websiteWrap) websiteWrap.hidden = !show;
    });
  });

  function showError(name, message) {
    const el = form.querySelector(`[data-error-for="${name}"]`) || document.getElementById(`error-${name}`);
    const input = form.querySelector(`[name="${name}"]`);
    if (el) el.textContent = message || "";
    if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validate() {
    const data = new FormData(form);
    const errors = {};
    if (!String(data.get("name") || "").trim()) errors.name = "Indiquez votre nom.";
    if (!String(data.get("activity") || "").trim()) errors.activity = "Indiquez votre activité.";
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim();
    if (!phone && !email) errors.contact = "Indiquez un téléphone ou un e-mail.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Cette adresse e-mail ne semble pas valide.";
    }
    if (data.get("hasWebsite") === "yes" && !String(data.get("websiteUrl") || "").trim()) {
      errors.websiteUrl = "Indiquez l’adresse de votre site.";
    }
    const consent = form.querySelector('[name="consent"]');
    if (consent && !consent.checked) {
      errors.consent = "Cochez la case pour accepter d’être recontacté.";
    }
    Object.keys(errors).forEach((k) => showError(k, errors[k]));
    ["name", "activity", "phone", "email", "websiteUrl", "contact", "consent"].forEach((k) => {
      if (!errors[k]) showError(k, "");
    });
    return { ok: Object.keys(errors).length === 0, data };
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const status = document.getElementById("form-status");
    const draft = document.getElementById("draft-actions");
    const { ok, data } = validate();
    if (!ok) {
      if (status) {
        status.textContent = "Vérifiez les champs en rouge.";
        status.style.color = "#ffd3bc";
      }
      return;
    }

    const payload = {
      name: String(data.get("name")).trim(),
      company: String(data.get("company") || "").trim(),
      activity: String(data.get("activity")).trim(),
      city: String(data.get("city") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      email: String(data.get("email") || "").trim(),
      hasWebsite: data.get("hasWebsite") === "yes" ? "yes" : "no",
      websiteUrl: String(data.get("websiteUrl") || "").trim(),
      plan: data.get("plan"),
      message: String(data.get("message") || "").trim(),
      preferredStyle: "Élégant",
      consent: true,
      company_website: String(data.get("company_website") || "").trim(),
    };

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    if (status) status.textContent = "Envoi en cours…";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        if (draft) draft.hidden = true;
        form.reset();
        if (websiteWrap) websiteWrap.hidden = true;
        const pf = form.querySelector('[name="preferredStyle"]');
        if (pf) pf.value = "Élégant";
        if (status) {
          status.textContent =
            "Bien reçu. On vous recontacte sous 48 heures avec votre maquette.";
          status.style.color = "#d9eea0";
        }
      } else if (body.errors) {
        Object.entries(body.errors).forEach(([k, v]) => showError(k, v));
        if (status) status.textContent = body.error || "Vérifiez les champs en rouge.";
      } else if (status) {
        status.textContent = body.error || "L’envoi a échoué. Réessayez ou écrivez-nous par e-mail.";
      }
    } catch (_) {
      if (status) status.textContent = "Connexion impossible. Réessayez ou écrivez-nous par e-mail.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }, true);
})();
