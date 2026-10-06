(function () {
  const STORAGE_KEY = "siteready-design";
  const C = window.SITE_CONTENT;

  function scrollToSelector() {
    const el = document.getElementById("style-selector");
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  }

  function setActive(design) {
    document.querySelectorAll("[data-theme-active]").forEach((btn) => {
      const isActive = btn.getAttribute("data-theme-active") === design;
      btn.classList.toggle("is-active", isActive);
      if (btn.tagName === "BUTTON") btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  document.addEventListener("click", (event) => {
    const toElegant = event.target.closest("[data-go-elegant]");
    if (toElegant) {
      sessionStorage.setItem(STORAGE_KEY, "elegant");
      return;
    }
    const toDynamique = event.target.closest("[data-go-dynamique]");
    if (toDynamique) {
      sessionStorage.setItem(STORAGE_KEY, "dynamique");
    }
    const toMinimal = event.target.closest("[data-go-minimal]");
    if (toMinimal) {
      sessionStorage.setItem(STORAGE_KEY, "minimal");
    }
    const toAnime = event.target.closest("[data-go-anime]");
    if (toAnime) {
      sessionStorage.setItem(STORAGE_KEY, "anime");
    }
  });

  const page = document.body.dataset.page;
  if (page === "dynamique") {
    setActive("dynamique");
    sessionStorage.setItem(STORAGE_KEY, "dynamique");
  }

  if (window.location.hash === "#style-selector") {
    if (document.readyState === "complete") scrollToSelector();
    else window.addEventListener("load", scrollToSelector);
  }
})();
