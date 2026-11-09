import { escapeHtml } from "./seo-head.mjs";
import { SITE_URL } from "./site-config.mjs";
import { buildVtcContactFormHtml } from "./vtc-contact-form-html.mjs";

function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "number" && !Number.isNaN(value)) return true;
  return typeof value === "string" && value.trim().length > 0;
}

function subscriptionEur(cfg) {
  if (typeof cfg.subscriptionPriceEur === "number" && !Number.isNaN(cfg.subscriptionPriceEur)) {
    return cfg.subscriptionPriceEur;
  }
  return null;
}

export function collectLandingWarnings(cfg) {
  const w = [];
  if (subscriptionEur(cfg) === null) {
    w.push("subscriptionPriceEur : valeur manquante — affichage tarif masqué (calcul interne : 200 €).");
  }
  if (!isFilled(cfg.setup) && !isFilled(cfg.commitment)) {
    w.push("setup / commitment : vides — ligne « Mise en route / engagement » masquée.");
  } else {
    if (!isFilled(cfg.setup)) w.push("setup : vide — partie mise en route masquée.");
    if (!isFilled(cfg.commitment)) w.push("commitment : vide — partie engagement masquée.");
  }
  if (!isFilled(cfg.refactorPriceLabel)) {
    w.push("refactorPriceLabel : vide — prix refonte masqué.");
  }
  if (!isFilled(cfg.commitmentFaq)) {
    w.push("commitmentFaq : vide — question FAQ « engagement » masquée.");
  }
  if (!isFilled(cfg.email)) w.push("email : vide — pas d’e-mail affiché dans le pied de page VTC.");
  const p = cfg.publisher || {};
  if (!isFilled(p.name)) w.push("publisher.name : vide — ligne éditeur footer masquée.");
  if (!isFilled(p.legalStatus)) w.push("publisher.legalStatus : vide.");
  if (!isFilled(p.siret)) w.push("publisher.siret : vide.");
  return w;
}

function demoLink(cfg, className, label) {
  const url = escapeHtml(cfg.demoUrl);
  return `<a class="${className}" href="${url}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
}

function stripeFeatureCopy(cfg) {
  if (cfg.stripePaymentActive) {
    return "Le client règle par carte via Stripe, l'argent arrive sur votre compte.";
  }
  return "Le client pourra régler par carte via Stripe, l'argent arrive sur votre compte, une fois l'option validée ensemble.";
}

function pricingMeta(cfg) {
  const parts = [];
  if (isFilled(cfg.setup)) parts.push(`Mise en route : ${escapeHtml(cfg.setup.trim())}`);
  if (isFilled(cfg.commitment)) parts.push(`Engagement : ${escapeHtml(cfg.commitment.trim())}`);
  if (!parts.length) return "";
  return `<p class="sm">${parts.join(". ")}.</p>`;
}

function footerPublisher(cfg) {
  const p = cfg.publisher || {};
  const chunks = [];
  if (isFilled(p.name)) chunks.push(escapeHtml(p.name.trim()));
  if (isFilled(p.legalStatus)) chunks.push(escapeHtml(p.legalStatus.trim()));
  if (isFilled(p.siret)) chunks.push(`SIRET ${escapeHtml(p.siret.trim())}`);
  if (!chunks.length) return "";
  return `<div>Éditeur : ${chunks.join(" · ")} · <a href="mentions-legales.html">Mentions légales</a> · <a href="politique-confidentialite.html">Politique de confidentialité</a></div>`;
}

export function buildVtcBodyHtml(cfg) {
  const sub = subscriptionEur(cfg);
  const subDisplay =
    sub !== null
      ? `<div class="price">${escapeHtml(String(sub))} <small>/ mois</small></div>`
      : "";

  const stripeTick = cfg.stripePaymentActive
    ? "<li>Paiement en ligne Stripe</li>"
    : "";

  const priceBlock = pricingMeta(cfg);

  const refactorPrice = isFilled(cfg.refactorPriceLabel)
    ? `<div class="price">${escapeHtml(cfg.refactorPriceLabel.trim())}</div>`
    : "";

  const faqEngagement = isFilled(cfg.commitmentFaq)
    ? `<details><summary>Y a-t-il un engagement ?</summary><p>${escapeHtml(cfg.commitmentFaq.trim())}</p></details>`
    : "";

  const subRow = sub !== null;
  const boot = {
    subscriptionEur: sub !== null ? sub : 200,
    showSubscriptionInRoi: sub !== null,
  };

  return {
    bodyHtml: `
<header class="hero">
  <div class="wrap">
    <div class="top">
      <a class="logo" href="/vtc/"><i></i>SiteReady SHD</a>
      <a class="btn btn-amber btn-sm" href="#contact">Me rappeler</a>
    </div>

    <div class="hero-grid">
      <div>
        <p class="kicker">Site de réservation pour chauffeurs VTC</p>
        <h1>Vos clients ont leur prix <em>avant que le téléphone sonne.</em></h1>
        <p class="lead">Un site à votre nom qui calcule le tarif de chaque trajet avec vos règles, prend la demande et vous prévient sur votre téléphone. Même quand vous êtes au volant.</p>
        <div class="ctas">
          ${demoLink(cfg, "btn btn-amber", "Essayer la démo en direct")}
          <a class="btn btn-line" href="#contact">Parler à un humain</a>
        </div>
        <div class="proofline"><span>Votre nom, votre domaine</span><span>Vos tarifs au km</span><span>Planning sans doublon</span></div>
      </div>

      <div class="meter" id="compteur" aria-label="Exemple de calcul de tarif">
        <div class="meter-head"><span>Exemple de devis</span><span id="kmOut">35 km</span></div>
        <div class="route" aria-hidden="true">
          <svg viewBox="0 0 400 90">
            <path class="rd" d="M20 60 C 100 10, 160 90, 220 45 S 340 15, 380 50"/>
            <path class="rd-on" id="rdOn" d="M20 60 C 100 10, 160 90, 220 45 S 340 15, 380 50"/>
            <circle cx="20" cy="60" r="7" fill="#f2b01e"/><circle cx="380" cy="50" r="7" fill="#f2f4fa"/>
            <text x="14" y="82">Départ</text><text x="344" y="82">Arrivée</text>
          </svg>
        </div>
        <div class="meter-display"><span class="lbl">Prix client</span><span class="val" id="meterVal">86<small>€</small></span></div>
        <div class="slider-row">
          <label for="km"><span>Distance du trajet</span><b id="kmLbl">35 km</b></label>
          <input type="range" id="km" min="3" max="120" value="35">
        </div>
        <p class="meter-note">Grille d'exemple (12 € de prise en charge + 2,10 € par km), à titre d'illustration. Sur votre site, ce sont vos propres tarifs.</p>
        <a class="btn btn-amber" style="margin-top:14px;width:100%" href="${escapeHtml(cfg.demoUrl)}" target="_blank" rel="noopener">Tester le vrai calculateur</a>
      </div>
    </div>
  </div>
</header>

<main class="wrap">

  <section aria-labelledby="h-pain">
    <div class="sec-head"><span class="eyebrow">Ce que vous vivez</span><h2 id="h-pain">Chaque appel manqué est une course partie ailleurs.</h2></div>
    <div class="pains">
      <div class="pain"><b>Le téléphone sonne en course</b><span>Vous ne pouvez pas décrocher. Le client réserve chez un autre avant que vous ayez rappelé.</span></div>
      <div class="pain"><b>Un prix donné de tête</b><span>Trop bas, vous perdez de l'argent. Trop haut, vous perdez la course. Dans les deux cas, vous recalculez à la main.</span></div>
      <div class="pain"><b>Des clients qui ne sont pas à vous</b><span>Sur une plateforme, le client appartient à la plateforme. Sur votre site, il vous appartient.</span></div>
    </div>
  </section>

  <section aria-labelledby="h-how">
    <div class="sec-head"><span class="eyebrow">Comment ça marche</span><h2 id="h-how">Trois étapes, et vous n'avez rien touché.</h2></div>
    <div class="steps">
      <div class="step"><h3>Le client saisit son trajet</h3><p>Départ, arrivée, date. Le site calcule la distance et affiche le prix tout de suite, à toute heure.</p></div>
      <div class="step"><h3>Il envoie sa demande</h3><p>Les créneaux déjà pris, les jours fériés et vos véhicules sont pris en compte. Pas de double réservation.</p></div>
      <div class="step"><h3>Vous êtes prévenu</h3><p>Notification sur votre téléphone et e-mail. Vous acceptez depuis l'espace pro, installé comme une application.</p></div>
    </div>
  </section>

  <section aria-labelledby="h-feat">
    <div class="sec-head"><span class="eyebrow">Ce que vous avez</span><h2 id="h-feat">Fait pour un chauffeur, pas pour un développeur.</h2></div>
    <div class="feat">
      <div class="f"><span class="ic"><svg viewBox="0 0 24 24"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg></span><h3>Calculateur de tarif</h3><p>Paliers au kilomètre, trajet d'approche, retour à la base : vos règles, appliquées à chaque devis.</p></div>
      <div class="f"><span class="ic"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg></span><h3>Planning et véhicules</h3><p>Une course acceptée bloque le créneau. Jours fériés français pris en compte, plusieurs véhicules possibles.</p></div>
      <div class="f"><span class="ic"><svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg></span><h3>Application sur téléphone</h3><p>L'espace pro s'installe comme une application et vous envoie une notification à chaque nouvelle demande.</p></div>
      <div class="f"><span class="ic"><svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg></span><h3>Paiement en ligne</h3><p>${escapeHtml(stripeFeatureCopy(cfg))}</p></div>
      <div class="f"><span class="ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg></span><h3>Un site à votre nom</h3><p>Votre domaine, vos couleurs, vos véhicules. Chaque chauffeur a son propre site, rien n'est partagé avec un concurrent.</p></div>
      <div class="f"><span class="ic"><svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg></span><h3>Sérieux et protégé</h3><p>Adresse introuvable : le client reçoit un message clair, jamais un faux prix. Formulaires protégés contre le spam.</p></div>
    </div>
  </section>

  <section aria-labelledby="h-roi">
    <div class="roi">
      <div>
        <span class="eyebrow" style="color:var(--amber)">Le calcul</span>
        <h2 id="h-roi">Combien vous laissez sur la table ?</h2>
        <p>Réglez vos propres chiffres. Le calcul se fait tout seul.</p>
        <small>Estimation indicative : elle suppose que ces demandes seraient devenues des courses payées.</small>
      </div>
      <div class="ctl">
        <div class="slider-row">
          <label for="lost"><span>Courses perdues par semaine</span><b id="lostLbl">3</b></label>
          <input type="range" id="lost" min="1" max="15" value="3">
        </div>
        <div class="slider-row">
          <label for="basket"><span>Prix moyen d'une course</span><b id="basketLbl">45 €</b></label>
          <input type="range" id="basket" min="20" max="150" step="5" value="45">
        </div>
        <div class="out" aria-live="polite">
          <span class="row"><span>Ce que vous laissez par mois</span></span>
          <span class="big" id="lostMonth">540 €</span>
          <span class="row" id="subPriceRow"${subRow ? "" : ' hidden'}><span>Abonnement</span><b><span id="subPrice">200 €</span></b></span>
          <span class="row" id="breakEvenRow"${subRow ? "" : ' hidden'}><span>Courses à récupérer pour le couvrir</span><b id="breakEven">5</b></span>
        </div>
      </div>
    </div>
  </section>

  <section aria-labelledby="h-price">
    <div class="sec-head"><span class="eyebrow">Tarifs</span><h2 id="h-price">Un prix clair, sans surprise.</h2></div>
    <div class="price-grid">
      <div class="card main">
        <b>Site de réservation VTC</b>
        ${subDisplay}
        <ul class="ticks">
          <li>Site à votre nom avec calculateur de tarif</li>
          <li>Planning, véhicules, jours fériés</li>
          <li>Application et notifications sur téléphone</li>
          <li>Hébergement, sécurité et mises à jour</li>
          ${stripeTick}
        </ul>
        ${priceBlock}
        ${demoLink(cfg, "btn btn-amber", "Voir la démo en direct")}
      </div>
      <div class="card">
        <b>Refonte de votre site actuel</b>
        ${refactorPrice}
        <p class="sm">Vous avez déjà un site mais il ne vous apporte pas de demandes ? On le refait, avec calculateur si vous le souhaitez.</p>
        <a class="btn btn-line" href="#contact">Demander un devis</a>
      </div>
    </div>
  </section>

  <section aria-labelledby="h-faq">
    <div class="sec-head"><span class="eyebrow">Questions</span><h2 id="h-faq">Ce que les chauffeurs demandent.</h2></div>
    <div class="faq">
      <details><summary>Les clients restent-ils les miens ?</summary><p>Oui. C'est votre site, votre domaine, et les demandes arrivent chez vous. Aucune plateforme entre vous et le client.</p></details>
      <details><summary>Les prix sont vraiment les miens ?</summary><p>Oui. On règle ensemble vos paliers au kilomètre, votre trajet d'approche et votre retour à la base. Le site applique ensuite ces règles à chaque devis.</p></details>
      <details><summary>Je dois installer quelque chose ?</summary><p>Non. Votre site tourne en ligne. Pour être prévenu, vous installez l'espace pro sur votre téléphone en deux clics, comme une application.</p></details>
      <details><summary>Et si le client saisit une adresse introuvable ?</summary><p>Il reçoit un message clair pour corriger. Le site n'affiche jamais un faux prix à 0 km.</p></details>
      <details><summary>Comment je démarre ?</summary><p>Vous me donnez vos tarifs et vos véhicules, je configure votre site, puis on le teste ensemble sur de vraies demandes avant de le mettre en avant.</p></details>
      ${faqEngagement}
    </div>
  </section>

  ${buildVtcContactFormHtml()}

  <footer>
    <div><b>SiteReady SHD</b> · sitereadyshd.fr · <a href="/">Offre artisans Ardèche</a></div>
    ${footerPublisher(cfg) || `<div><a href="mentions-legales.html">Mentions légales</a> · <a href="politique-confidentialite.html">Politique de confidentialité</a></div>`}
  </footer>
</main>`,
    boot,
  };
}

export function buildVtcIndexHtml(cfg, warnings, assetsVersion = "1") {
  const { bodyHtml, boot } = buildVtcBodyHtml(cfg);
  const seo = cfg.seo;
  const canonical = `${SITE_URL}${seo.canonicalPath}`;
  const warnScript =
    warnings.length && process.env.NODE_ENV !== "production"
      ? `<script>
(function () {
  var msgs = ${JSON.stringify(warnings)};
  msgs.forEach(function (m) { console.warn("[landing.config]", m); });
})();
</script>`
      : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(seo.title)}</title>
<meta name="description" content="${escapeHtml(seo.description)}">
<meta property="og:title" content="${escapeHtml(seo.title)}">
<meta property="og:description" content="${escapeHtml(seo.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:locale" content="${escapeHtml(seo.ogLocale || "fr_FR")}">
<meta property="og:image" content="${escapeHtml(seo.ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(seo.title)}">
<meta name="twitter:description" content="${escapeHtml(seo.description)}">
<meta name="twitter:image" content="${escapeHtml(seo.ogImage)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="icon" type="image/png" href="/assets/img/favicon.png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/img/favicon.png">
<meta name="theme-color" content="#0c1426">
<link rel="stylesheet" href="/assets/css/vtc-landing.css?v=${encodeURIComponent(assetsVersion)}">
</head>
<body>
${bodyHtml}
<script>window.__VTC_LANDING__ = ${JSON.stringify(boot)};</script>
<script src="/assets/js/contact-api.js?v=${encodeURIComponent(assetsVersion)}" defer></script>
<script src="/assets/js/vtc-landing.js?v=${encodeURIComponent(assetsVersion)}" defer></script>
<script src="/assets/js/vtc-contact-form.js?v=${encodeURIComponent(assetsVersion)}" defer></script>
${warnScript}
</body>
</html>`;
}
