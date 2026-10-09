(function () {
  const C = window.SITE_CONTENT;
  const O = window.SITE_OFFERS || {};
  if (!C) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let searchTypingTimer = null;

  function scrollAnchorOffset(extra = 20) {
    const header = document.querySelector(".site-header");
    return header ? header.getBoundingClientRect().height + extra : 88;
  }

  function scrollToElement(el, extra = 20) {
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - scrollAnchorOffset(extra);
    window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function applySeo() {
    const { seo, site } = C;
    document.documentElement.lang = "fr";
    document.title = seo.title;

    const setMeta = (name, content, prop) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", seo.description);
    setMeta("og:title", seo.title, true);
    setMeta("og:description", seo.description, true);
    setMeta("og:type", "website", true);
    setMeta("og:url", site.url, true);
    setMeta("og:locale", seo.ogLocale, true);
    if (seo.ogImage) {
      setMeta("og:image", seo.ogImage, true);
      setMeta("og:image:width", String(seo.ogImageWidth || 1200), true);
      setMeta("og:image:height", String(seo.ogImageHeight || 630), true);
      setMeta("twitter:card", "summary_large_image");
      setMeta("twitter:image", seo.ogImage);
    }

    const cities = seo.schemaCities || [];
    const areaServed = [
      { "@type": "AdministrativeArea", name: seo.areaServed },
      ...cities.map((name) => ({ "@type": "City", name })),
    ];
    const service = {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: seo.serviceName,
      description: seo.serviceDescription,
      url: site.url,
      email: seo.email,
      areaServed,
      priceRange: seo.priceRange || "€€",
    };
    const faqItems = [...(C.faq?.items || [])];
    if (O.faqHosting?.q) faqItems.splice(3, 0, O.faqHosting);
    if (O.faqDomain?.q) faqItems.push(O.faqDomain);
    const faqPage = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    };

    const script = document.getElementById("json-ld");
    if (script) script.textContent = JSON.stringify([service, faqPage]);
  }

  function fillText(selector, text) {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = text;
    });
  }

  function buildPhoneMock(inner) {
    return `
      <div class="phone-mock" aria-hidden="true">
        <div class="phone-mock__bezel">
          <div class="phone-mock__notch"></div>
          <div class="phone-mock__screen">${inner}</div>
        </div>
      </div>`;
  }

  function heroMockInner(data) {
    return `
      <div class="mock-site mock-site--hero">
        <div class="mock-site__bar"></div>
        <p class="mock-site__brand">${escapeHtml(data.brand)}</p>
        <p class="mock-site__city">${escapeHtml(data.city)}</p>
        <div class="mock-site__block mock-site__block--tall"></div>
        <div class="mock-site__block"></div>
        <span class="mock-site__btn">${escapeHtml(data.cta)}</span>
      </div>`;
  }

  function exampleMockInner(item) {
    if (item.id === "plombier") {
      return `
      <div class="mock-mini mock-mini--plombier">
        <div class="mock-mini__banner">${escapeHtml(item.mockTitle)}</div>
        <p class="mock-mini__tagline">Dépannage rapide</p>
        <span class="mock-mini__cta">Appeler</span>
        <ul class="mock-mini__list">
          <li>Dépannage</li><li>Installation</li><li>Entretien</li>
        </ul>
      </div>`;
    }
    if (item.id === "coiffeur") {
      return `
      <div class="mock-mini mock-mini--coiffeur">
        <p class="mock-mini__brand">${escapeHtml(item.mockTitle)}</p>
        <p class="mock-mini__tagline">Coupe &amp; couleur sur rendez-vous</p>
        <span class="mock-mini__cta">Prendre rendez-vous</span>
        <ul class="mock-mini__prices">
          <li><span>Coupe</span><span>28 €</span></li>
          <li><span>Couleur</span><span>45 €</span></li>
          <li><span>Brushing</span><span>22 €</span></li>
        </ul>
      </div>`;
    }
    return `
      <div class="mock-mini mock-mini--restaurant">
        <div class="mock-mini__banner">${escapeHtml(item.mockTitle)}</div>
        <p class="mock-mini__tagline">Cuisine de saison</p>
        <span class="mock-mini__cta">Réserver</span>
        <div class="mock-mini__menu">
          <p>Entrée du jour</p>
          <p>Plat du marché</p>
          <p>Dessert maison</p>
        </div>
      </div>`;
  }

  function setPillGroup(form, group, value) {
    const hidden = form.querySelector(`[name="${group}"]`);
    if (hidden) hidden.value = value;
    form.querySelectorAll(`[data-pill-group="${group}"]`).forEach((btn) => {
      const active = btn.getAttribute("data-value") === value;
      btn.classList.toggle("is-selected", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function selectPlanAndScroll(planId) {
    const form = document.getElementById("contact-form");
    if (form) setPillGroup(form, "plan", planId);
    scrollToElement(document.getElementById("contact"));
    const firstField = form?.querySelector("#name");
    if (firstField) setTimeout(() => firstField.focus({ preventScroll: true }), 400);
  }

  function initPillGroups(form) {
    form.querySelectorAll("[data-pill-group]").forEach((btn) => {
      btn.setAttribute("type", "button");
      btn.setAttribute("aria-pressed", btn.classList.contains("is-selected") ? "true" : "false");
      btn.addEventListener("click", () => {
        const group = btn.getAttribute("data-pill-group");
        const value = btn.getAttribute("data-value");
        setPillGroup(form, group, value);
        if (group === "hasWebsite") {
          const websiteWrap = document.getElementById("website-url-wrap");
          if (websiteWrap) websiteWrap.hidden = value !== "yes";
        }
      });
    });
  }

  function initNav() {
    fillText("[data-site-name-normal]", "Site");
    fillText("[data-site-name-bold]", "Ready");
    fillText("[data-nav-cta]", C.nav.cta);
    const navList = document.getElementById("nav-links");
    if (navList) {
      navList.innerHTML = C.nav.links
        .map((link) => `<li><a href="${link.href}">${escapeHtml(link.label)}</a></li>`)
        .join("");
    }
  }

  function initThemeSwitch() {
    const t = C.themeSwitch;
    fillText("[data-theme-switch-title]", t.title);
    fillText("[data-theme-switch-subtitle]", t.subtitle);
    fillText("[data-theme-switch-dynamique]", t.dynamique);
    fillText("[data-theme-switch-elegant]", t.elegant);
    fillText("[data-theme-switch-minimal]", t.minimal);
    fillText("[data-theme-switch-anime]", t.anime);
    const elegantLink = document.querySelector("[data-theme-switch-elegant]");
    if (elegantLink) elegantLink.textContent = t.elegant;
  }

  function initHero() {
    fillText("[data-hero-badge]", C.hero.badge);
    fillText("[data-hero-title]", C.hero.title);
    fillText("[data-hero-subtitle]", C.hero.subtitle);
    fillText("[data-hero-cta]", C.hero.cta);
    const mount = document.getElementById("hero-phone");
    if (mount) mount.innerHTML = buildPhoneMock(heroMockInner(C.hero.phoneMock));
  }

  function runSearchTyping() {
    if (searchTypingTimer) clearTimeout(searchTypingTimer);
    const el = document.getElementById("fake-search-text");
    if (!el) return;
    const full = C.problem.searchQuery;
    if (prefersReducedMotion) {
      el.textContent = full;
      return;
    }
    let i = 0;
    el.textContent = "";
    const tick = () => {
      if (i <= full.length) {
        el.textContent = full.slice(0, i);
        i += 1;
        searchTypingTimer = setTimeout(tick, i < full.length ? 80 : 1200);
      } else {
        i = 0;
        searchTypingTimer = setTimeout(tick, 800);
      }
    };
    tick();
  }

  function initProblem() {
    fillText("[data-problem-title]", C.problem.title);
    const results = document.getElementById("search-results");
    if (results) {
      results.innerHTML = C.problem.results
        .map(
          (r) => `
        <li class="search-result">
          <span class="search-result__name">${escapeHtml(r.name)}</span>
          <span class="search-result__tag">${escapeHtml(r.tag)}</span>
        </li>`
        )
        .join("");
    }
    fillText("[data-problem-missing]", C.problem.missing);
    runSearchTyping();
  }

  function initSteps() {
    fillText("[data-steps-title]", C.steps.title);
    fillText("[data-steps-intro]", C.steps.intro);
    const list = document.getElementById("steps-list");
    if (list) {
      list.innerHTML = C.steps.items
        .map(
          (step, index) => `
        <li class="step-card reveal">
          <span class="step-card__num">${index + 1}</span>
          <h3>${escapeHtml(step.title)}</h3>
          <p>${escapeHtml(step.text)}</p>
        </li>`
        )
        .join("");
    }
  }

  function initPricing() {
    fillText("[data-pricing-title]", C.pricing.title);
    fillText("[data-pricing-subtitle]", C.pricing.subtitle);
    const grid = document.getElementById("pricing-grid");
    const cards = C.pricing.cards;
    if (grid) {
      grid.innerHTML = cards
        .map(
          (card) => `
        <article class="price-card reveal${card.id === "monthly" ? " price-card--highlight" : ""}">
          <h3>${escapeHtml(card.name)}</h3>
          <p class="price-card__note">${escapeHtml(card.priceNote)}</p>
          <p class="price-card__price">${escapeHtml(card.price)}</p>
          ${(() => {
            const line =
              card.hostingLine ||
              (card.id === "once" ? O.onceHostingAddon : card.id === "monthly" ? O.monthlyHostingIncluded : "");
            return line ? `<p class="price-card__hosting">${escapeHtml(line)}</p>` : "";
          })()}
          <ul class="price-card__bullets">
            ${(() => {
              const bullets = [...(card.bullets || [])];
              if (
                (card.id === "once" || card.id === "monthly") &&
                O.customDomainPricingBullet &&
                !bullets.includes(O.customDomainPricingBullet)
              ) {
                bullets.push(O.customDomainPricingBullet);
              }
              if (card.id === "once" && O.onceHostingBullet && !bullets.includes(O.onceHostingBullet)) {
                bullets.push(O.onceHostingBullet);
              }
              return bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("");
            })()}
          </ul>
          ${card.legal ? `<p class="price-card__legal">${escapeHtml(card.legal)}</p>` : ""}
          <button type="button" class="btn btn--pill btn--night price-card__cta" data-plan="${escapeHtml(card.id)}">Commencer →</button>
        </article>`
        )
        .join("");
      grid.querySelectorAll(".price-card__cta").forEach((btn) => {
        btn.addEventListener("click", () => selectPlanAndScroll(btn.getAttribute("data-plan")));
      });
    }
  }

  function initIncluded() {
    fillText("[data-included-title]", C.included.title);
    const list = document.getElementById("included-list");
    if (list) {
      const includedItems = C.included.items.map((text) =>
        O.customDomainIncluded && text.includes("Nom de domaine")
          ? O.customDomainIncluded
          : text
      );
      list.innerHTML = includedItems
        .map(
          (item) => `
        <li class="included-item reveal">
          <span class="included-item__check" aria-hidden="true"></span>
          <span>${escapeHtml(item)}</span>
        </li>`
        )
        .join("");
    }
  }

  function initExamples() {
    fillText("[data-examples-title]", C.examples.title);
    fillText("[data-examples-subtitle]", C.examples.subtitle);
    const grid = document.getElementById("examples-grid");
    if (grid) {
      grid.innerHTML = C.examples.items
        .map(
          (item) => `
        <figure class="example-card reveal">
          <span class="example-card__fictif">Exemple fictif</span>
          <span class="example-card__label">${escapeHtml(item.label)}</span>
          <figcaption class="example-card__trade">${escapeHtml(item.trade)}</figcaption>
          ${buildPhoneMock(exampleMockInner(item))}
        </figure>`
        )
        .join("");
    }
  }

  function renderStars(rating) {
    const full = Math.max(0, Math.min(5, Math.round(rating)));
    let html = "";
    for (let i = 1; i <= 5; i += 1) {
      html += `<span class="star ${i <= full ? "is-full" : ""}" aria-hidden="true"></span>`;
    }
    return html;
  }

  async function initReviews() {
    const section = document.getElementById("avis");
    if (!section) return;
    let reviews = [];
    try {
      const res = await fetch("/avis.json", { cache: "no-store" });
      if (res.ok) reviews = await res.json();
    } catch (_) {
      reviews = [];
    }
    if (!Array.isArray(reviews) || reviews.length === 0) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    fillText("[data-reviews-title]", C.reviews.title);
    const avg = reviews.reduce((sum, r) => sum + (Number(r.note) || 0), 0) / reviews.length;
    const summary = document.getElementById("reviews-summary");
    if (summary) {
      summary.innerHTML = `
        <p class="reviews-summary__score">${avg.toFixed(1).replace(".", ",")}<span>/5</span></p>
        <div class="reviews-summary__stars" role="img" aria-label="Note moyenne ${avg.toFixed(1)} sur 5">
          ${renderStars(avg)}
        </div>
        <p class="reviews-summary__count">${reviews.length} avis</p>`;
    }
    const list = document.getElementById("reviews-list");
    if (list) {
      list.innerHTML = reviews
        .map(
          (r) => `
        <blockquote class="review-card reveal">
          <div class="review-card__stars" role="img" aria-label="${r.note} sur 5">${renderStars(r.note)}</div>
          <p>${escapeHtml(r.texte)}</p>
          <footer>
            <strong>${escapeHtml(r.prenom)}</strong>
            — ${escapeHtml(r.entreprise)}, ${escapeHtml(r.ville)}
            <time datetime="${escapeHtml(r.date)}">${escapeHtml(r.date)}</time>
          </footer>
        </blockquote>`
        )
        .join("");
    }
  }

  function purgeOrphanFaqItems() {
    const list = document.getElementById("faq-list");
    const section = document.getElementById("faq");
    if (!list || !section) return;
    section.querySelectorAll(".faq-item").forEach((el) => {
      if (!list.contains(el)) el.remove();
    });
  }

  function initFaq() {
    fillText("[data-faq-title]", C.faq.title);
    const root = document.getElementById("faq-list");
    if (!root) return;
    purgeOrphanFaqItems();
    const faqItems = [...C.faq.items];
    if (O.faqHosting?.q && O.faqHosting?.a) {
      faqItems.splice(3, 0, O.faqHosting);
    }
    if (O.faqDomain?.q && O.faqDomain?.a) {
      faqItems.push(O.faqDomain);
    }
    root.innerHTML = faqItems
      .map(
        (item, i) => `
      <div class="faq-item reveal">
        <h3>
          <button type="button" class="faq-item__trigger" aria-expanded="false" aria-controls="faq-panel-${i}" id="faq-trigger-${i}">
            <span class="faq-item__label">${escapeHtml(item.q)}</span>
            <span class="faq-item__icon" aria-hidden="true"></span>
          </button>
        </h3>
        <div id="faq-panel-${i}" class="faq-item__panel" role="region" aria-labelledby="faq-trigger-${i}" hidden>
          <p>${escapeHtml(item.a)}</p>
        </div>
      </div>`
      )
      .join("");
    root.querySelectorAll(".faq-item__trigger").forEach((btn) => {
      btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        const panel = document.getElementById(btn.getAttribute("aria-controls"));
        btn.setAttribute("aria-expanded", String(!expanded));
        if (panel) panel.hidden = expanded;
      });
    });
  }

  function showFieldError(form, name, message) {
    const el = form.querySelector(`[data-error-for="${name}"]`);
    const input = form.querySelector(`[name="${name}"]`);
    if (el) el.textContent = message || "";
    if (input && input.type !== "radio" && input.type !== "checkbox") {
      input.classList.toggle("is-invalid", Boolean(message));
    }
  }

  function validateContactForm(form) {
    const data = new FormData(form);
    const errors = {};
    const name = String(data.get("name") || "").trim();
    const activity = String(data.get("activity") || "").trim();
    const email = String(data.get("email") || "").trim();
    if (!name) errors.name = "Indiquez votre nom.";
    if (!activity) errors.activity = "Indiquez votre activité.";
    if (!email) errors.email = "Indiquez votre adresse e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Cette adresse e-mail ne semble pas valide.";
    }
    if (data.get("hasWebsite") === "yes" && !String(data.get("websiteUrl") || "").trim()) {
      errors.websiteUrl = "Indiquez l’adresse de votre site.";
    }
    if (!form.querySelector('[name="consent"]')?.checked) {
      errors.consent = "Cochez la case pour accepter d’être recontacté.";
    }
    ["name", "activity", "email", "websiteUrl", "consent"].forEach(
      (field) => showFieldError(form, field, errors[field])
    );
    return { ok: Object.keys(errors).length === 0, data, errors };
  }

  async function onSubmitContact(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.getElementById("form-status");
    const submitBtn = form.querySelector('[type="submit"]');
    const { ok, data } = validateContactForm(form);
    if (!ok) {
      if (status) {
        status.className = "form-status form-status--error";
        status.textContent = "Vérifiez les champs en rouge.";
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
      hasWebsite: data.get("hasWebsite"),
      websiteUrl: String(data.get("websiteUrl") || "").trim(),
      plan: data.get("plan"),
      message: String(data.get("message") || "").trim(),
      preferredStyle: String(data.get("preferredStyle") || "Dynamique").trim(),
      consent: true,
      company_website: String(data.get("company_website") || "").trim(),
    };
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = C.contact.form.sending;
    }
    if (status) {
      status.className = "form-status";
      status.textContent = "";
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
        const pf = form.querySelector('[name="preferredStyle"]');
        if (pf) pf.value = C.themeSwitch.dynamique;
        setPillGroup(form, "hasWebsite", "no");
        setPillGroup(form, "plan", "once");
        const websiteWrap = document.getElementById("website-url-wrap");
        if (websiteWrap) websiteWrap.hidden = true;
        if (status) {
          status.className = "form-status form-status--success";
          status.textContent = C.contact.success;
        }
      } else if (body.errors) {
        Object.entries(body.errors).forEach(([key, msg]) => showFieldError(form, key, msg));
        if (status) {
          status.className = "form-status form-status--error";
          status.textContent = body.error || "Vérifiez les champs en rouge.";
        }
      } else if (status) {
        status.className = "form-status form-status--error";
        status.textContent = body.error || "L’envoi a échoué. Réessayez ou écrivez-nous par e-mail.";
      }
    } catch (_) {
      if (status) {
        status.className = "form-status form-status--error";
        status.textContent = "Connexion impossible. Réessayez ou écrivez-nous par e-mail.";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = C.contact.form.submit;
      }
    }
  }

  function initContact() {
    const { contact } = C;
    fillText("[data-contact-title]", contact.title);
    fillText("[data-contact-intro]", contact.intro);
    fillText("[data-contact-email-link]", contact.email);
    const emailLink = document.getElementById("contact-email-link");
    if (emailLink) emailLink.href = `mailto:${contact.email}`;
    const form = document.getElementById("contact-form");
    if (!form) return;
    const f = contact.form;
    const labels = {
      name: f.name,
      company: f.company,
      activity: f.activity,
      city: f.city,
      phone: f.phone,
      email: f.email,
      websiteUrl: f.websiteUrl,
      message: f.message,
    };
    Object.entries(labels).forEach(([id, label]) => {
      const labelEl = form.querySelector(`label[for="${id}"]`);
      if (labelEl) labelEl.textContent = label;
    });
    fillText("[data-label-has-website]", f.hasWebsite);
    fillText("[data-has-website-yes]", f.hasWebsiteYes);
    fillText("[data-has-website-no]", f.hasWebsiteNo);
    fillText("[data-label-plan]", f.plan);
    fillText("[data-submit-label]", f.submit);
    f.planOptions.forEach((o) => {
      const pill = form.querySelector(`[data-pill-group="plan"][data-value="${o.value}"]`);
      if (!pill) return;
      const label =
        o.value === "once" && O.planOnceFormLabel ? O.planOnceFormLabel : o.label;
      pill.textContent = label;
    });
    initPillGroups(form);
    const consentText = form.querySelector("[data-label-consent]");
    const consentHtml = `${escapeHtml(f.consentBefore)}<a href="/politique-confidentialite.html">${escapeHtml(f.consentLink)}</a>${escapeHtml(f.consentAndTerms || " et aux ")}<a href="/conditions-de-vente.html">${escapeHtml(f.consentTermsLink || "conditions de vente")}</a>.`;
    if (consentText) {
      consentText.innerHTML = consentHtml;
    } else {
      const consentLabel = document.getElementById("consent-label");
      const existing = consentLabel?.querySelector('input[name="consent"]');
      if (consentLabel && existing) {
        const span = document.createElement("span");
        span.setAttribute("data-label-consent", "");
        span.innerHTML = consentHtml;
        consentLabel.replaceChildren(existing, span);
      }
    }
    const websiteWrap = document.getElementById("website-url-wrap");
    const pf = form.querySelector('[name="preferredStyle"]');
    if (pf) pf.value = C.themeSwitch.dynamique;
    form.addEventListener("submit", onSubmitContact);
    form.querySelectorAll("input, textarea").forEach((field) => {
      field.addEventListener("blur", () => validateContactForm(form));
    });
  }

  function initFooter() {
    fillText("[data-footer-tagline]", C.site.taglineFooter);
  }

  function initHeader() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("site-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      nav.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav?.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle?.setAttribute("aria-expanded", "false");
      }
    });
    if (!prefersReducedMotion && header) {
      const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  let revealObserver;
  function initReveal() {
    const nodes = document.querySelectorAll(".reveal:not(.is-visible)");
    if (prefersReducedMotion) {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
    }
    nodes.forEach((n) => revealObserver.observe(n));
  }

  applySeo();
  initNav();
  initThemeSwitch();
  initHero();
  initProblem();
  initSteps();
  initPricing();
  initIncluded();
  initExamples();
  initFaq();
  initContact();
  initFooter();
  initHeader();
  initReveal();
  initReviews().then(initReveal);
})();
