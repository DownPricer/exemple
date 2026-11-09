import { escapeHtml } from "./seo-head.mjs";
import { HOST, SITE_URL } from "./site-config.mjs";

function field(label, value) {
  const v = typeof value === "string" && value.trim() ? escapeHtml(value.trim()) : "";
  if (v) return `<p>${escapeHtml(label)} : ${v}</p>`;
  return `<p>${escapeHtml(label)} : <em>[À RENSEIGNER]</em></p>`;
}

function publisherBlock(cfg) {
  const p = cfg.publisher || {};
  return `
      <p><strong>SiteReady SHD</strong></p>
      ${field("Nom / raison sociale", p.name)}
      ${field("Statut", p.legalStatus)}
      ${field("SIRET", p.siret)}
      ${field("E-mail", cfg.email)}
      <p>Téléphone : <em>[À RENSEIGNER]</em></p>`;
}

function hostBlock(cfg) {
  const h = cfg.legal || {};
  return `
      <p>${escapeHtml(h.hostName || HOST.name)}</p>
      <p>${escapeHtml(h.hostStreet || HOST.street)}</p>
      <p>${escapeHtml(h.hostCity || HOST.city)}, ${escapeHtml(h.hostCountry || HOST.country)}</p>`;
}

export function vtcMentionsBodyHtml(cfg) {
  return `
      <h1>Mentions légales — offre VTC</h1>
      <p>Ces mentions concernent la page de présentation de l’offre « site de réservation VTC » sur ${escapeHtml(SITE_URL)}/vtc/.</p>
      <h2>Éditeur du site</h2>
      ${publisherBlock(cfg)}
      <h2>Directeur de la publication</h2>
      <p><em>[À RENSEIGNER : identité du directeur de la publication]</em></p>
      <h2>Hébergeur</h2>
      ${hostBlock(cfg)}
      <h2>Propriété intellectuelle</h2>
      <p>Les textes et éléments graphiques de cette page sont la propriété de l’éditeur ou de leurs auteurs respectifs, sauf mention contraire.</p>
      <h2>Responsabilité</h2>
      <p>L’éditeur s’efforce de fournir des informations exactes sur cette offre. Les tarifs et fonctionnalités annoncés peuvent évoluer ; seul un devis ou contrat signé fait foi.</p>
      <h2>Cookies et traceurs</h2>
      <p>Cette page /vtc/ ne dépose pas de cookies de mesure d’audience ni de publicité. Aucun outil d’analyse tiers n’est chargé sur cette page.</p>
      <h2>Droit applicable</h2>
      <p>Droit français. Tribunaux français compétents, sous réserve des règles impératives applicables aux consommateurs.</p>
      <p><a href="/vtc/">Retour à l’offre VTC</a> · <a href="/">Accueil SiteReady</a></p>`;
}

export function vtcPrivacyBodyHtml(cfg) {
  return `
      <h1>Politique de confidentialité — offre VTC</h1>
      <p>Cette politique décrit le traitement des données lorsque vous contactez SiteReady SHD au sujet de l’offre VTC (page ${escapeHtml(SITE_URL)}/vtc/).</p>
      <h2>Responsable du traitement</h2>
      ${publisherBlock(cfg)}
      <h2>Données concernées</h2>
      <p>Données que vous communiquez volontairement : identité, coordonnées (téléphone, e-mail), informations sur votre activité VTC, tarifs, véhicules, et tout message lié à votre demande.</p>
      <h2>Finalité</h2>
      <p>Répondre à votre demande, préparer une démonstration, établir un devis ou un contrat pour un site de réservation VTC. Vos données ne sont pas revendues.</p>
      <h2>Base légale</h2>
      <p>Intérêt légitime à traiter votre demande commerciale et, le cas échéant, mesures précontractuelles à votre demande.</p>
      <h2>Durée de conservation</h2>
      <p><em>[À RENSEIGNER : durée de conservation adaptée à votre politique interne]</em></p>
      <h2>Destinataires</h2>
      <p>L’éditeur et l’hébergeur technique du site, uniquement pour l’hébergement et la gestion des échanges.</p>
      <h2>Mesure d’audience</h2>
      <p>La page /vtc/ n’utilise pas de mesure d’audience. Le reste du site sitereadyshd.fr peut utiliser des outils distincts ; consultez la <a href="/politique-confidentialite.html">politique du site principal</a> le cas échéant.</p>
      <h2>Vos droits</h2>
      <p>Droits d’accès, rectification, effacement, limitation, opposition et portabilité (RGPD). Contact : ${
        cfg.email && String(cfg.email).trim()
          ? `<a href="mailto:${escapeHtml(cfg.email.trim())}">${escapeHtml(cfg.email.trim())}</a>`
          : "<em>[À RENSEIGNER : e-mail de contact]</em>"
      }.</p>
      <h2>Réclamation</h2>
      <p>Réclamation possible auprès de la CNIL (<a href="https://www.cnil.fr" rel="noopener noreferrer">cnil.fr</a>).</p>
      <p><a href="/vtc/">Retour à l’offre VTC</a> · <a href="/">Accueil SiteReady</a></p>`;
}
