(function () {
  const C = window.SITE_CONTENT;
  if (!C) return;

  const page = document.body.dataset.legalPage;
  const root = document.getElementById("legal-content");
  if (!root || !page) return;

  if (page === "mentions") {
    const m = C.legal.mentions;
    document.title = `${m.title} | SiteReady`;
    root.innerHTML = `
      <h1>${escape(m.title)}</h1>
      <h2>${escape(m.editorTitle)}</h2>
      ${m.editorLines.map((line) => `<p>${escape(line)}</p>`).join("")}
      <h2>${escape(m.hostTitle)}</h2>
      ${m.hostLines.map((line) => `<p>${escape(line)}</p>`).join("")}
      <p><a href="/">${escape(m.back)}</a></p>`;
  }

  if (page === "privacy") {
    const p = C.legal.privacy;
    document.title = `${p.title} | SiteReady`;
    root.innerHTML = `
      <h1>${escape(p.title)}</h1>
      <p>${escape(p.intro)}</p>
      ${p.sections
        .map(
          (s) => `<h2>${escape(s.title)}</h2><p>${escape(s.text)}</p>`
        )
        .join("")}
      <p><a href="/">${escape(p.back)}</a></p>`;
  }

  function escape(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
})();
