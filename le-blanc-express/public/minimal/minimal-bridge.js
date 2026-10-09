(function () {
  "use strict";
  const STORAGE_KEY = "siteready-design";
  document.body.dataset.page = "minimal";

  function scrollAnchorOffset(extra = 20) {
    const header = document.querySelector(".site-header");
    return header ? header.getBoundingClientRect().height + extra : 88;
  }

  function scrollToElement(el) {
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - scrollAnchorOffset();
    window.scrollTo({ top, behavior: "smooth" });
  }

  function scrollToSelector() {
    scrollToElement(document.getElementById("style-selector"));
  }

  function setActive(design) {
    document.querySelectorAll("[data-theme-active]").forEach((node) => {
      const active = node.getAttribute("data-theme-active") === design;
      node.classList.toggle("is-active", active);
      if (node.tagName === "BUTTON") node.setAttribute("aria-pressed", String(active));
    });
  }

  document.addEventListener("click", (event) => {
    const toDyn = event.target.closest("[data-go-dynamique]");
    if (toDyn) {
      event.preventDefault();
      sessionStorage.setItem(STORAGE_KEY, "dynamique");
      window.location.href = "/#style-selector";
    }
    const toElegant = event.target.closest("[data-go-elegant]");
    if (toElegant) {
      sessionStorage.setItem(STORAGE_KEY, "elegant");
    }
  });

  setActive("minimal");
  sessionStorage.setItem(STORAGE_KEY, "minimal");

  if (window.location.hash === "#style-selector") {
    window.addEventListener("load", scrollToSelector);
  }

  const form = document.getElementById("contact-form");
  if (!form) return;

  const websiteWrap = document.getElementById("website-url-wrap");

  function setPillGroup(group, value) {
    const hidden =
      group === "plan" ? form.querySelector("#plan") : form.querySelector('[name="hasWebsite"]');
    if (hidden) hidden.value = value;
    form.querySelectorAll(`[data-pill-group="${group}"]`).forEach((btn) => {
      const on = btn.getAttribute("data-value") === value;
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    if (group === "hasWebsite" && websiteWrap) websiteWrap.hidden = value !== "yes";
  }

  form.querySelectorAll("[data-pill-group]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setPillGroup(btn.getAttribute("data-pill-group"), btn.getAttribute("data-value"));
    });
  });

  document.querySelectorAll(".price-card__cta").forEach((btn) => {
    btn.addEventListener("click", () => {
      setPillGroup("plan", btn.getAttribute("data-plan"));
      scrollToElement(document.getElementById("contact"));
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
    const email = String(data.get("email") || "").trim();
    if (!email) errors.email = "Indiquez votre adresse e-mail.";
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
    ["name", "activity", "email", "websiteUrl", "consent"].forEach((k) => {
      if (!errors[k]) showError(k, "");
    });
    return { ok: Object.keys(errors).length === 0, data };
  }

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const status = document.getElementById("form-status");
      const { ok, data } = validate();
      if (!ok) {
        if (status) {
          status.textContent = "Vérifiez les champs en rouge.";
          status.className = "form-status is-error";
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
        preferredStyle: "Minimal",
        consent: true,
        company_website: String(data.get("company_website") || "").trim(),
      };

      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      if (status) {
        status.textContent = "Envoi en cours…";
        status.className = "form-status";
      }

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.ok) {
          form.reset();
          if (websiteWrap) websiteWrap.hidden = true;
          const pf = form.querySelector('[name="preferredStyle"]');
          if (pf) pf.value = "Minimal";
          const oncePill = form.querySelector('[data-pill-group="plan"][data-value="once"]');
          if (oncePill) oncePill.classList.add("is-selected");
          if (status) {
            status.textContent =
              "Bien reçu. On vous recontacte sous 48 heures avec votre maquette.";
            status.className = "form-status is-ok";
          }
        } else if (body.errors) {
          Object.entries(body.errors).forEach(([k, v]) => showError(k, v));
          if (status) {
            status.textContent = body.error || "Vérifiez les champs en rouge.";
            status.className = "form-status is-error";
          }
        } else if (status) {
          status.textContent = body.error || "L’envoi a échoué. Réessayez ou écrivez-nous par e-mail.";
          status.className = "form-status is-error";
        }
      } catch (_) {
        if (status) {
          status.textContent = "Connexion impossible. Réessayez ou écrivez-nous par e-mail.";
          status.className = "form-status is-error";
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    },
    true
  );
})();
