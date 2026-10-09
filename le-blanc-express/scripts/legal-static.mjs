import { CGV_PROVISIONAL_BANNER, HOST, PUBLISHER, SITE_URL } from "./site-config.mjs";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function publisherBlock() {
  return `
      <p><strong>${escapeHtml(PUBLISHER.brand)}</strong></p>
      <p>${escapeHtml(PUBLISHER.legalForm)}</p>
      <p>SIRET : ${escapeHtml(PUBLISHER.siret)}</p>
      <p>${escapeHtml(PUBLISHER.locality)} (${escapeHtml(PUBLISHER.postalCode)})</p>
      <p>E-mail : <a href="mailto:${escapeHtml(PUBLISHER.email)}">${escapeHtml(PUBLISHER.email)}</a></p>
      <p>${escapeHtml(PUBLISHER.tvaNotice)}</p>`;
}

function hostBlock() {
  return `
      <p>${escapeHtml(HOST.name)}</p>
      <p>${escapeHtml(HOST.street)}</p>
      <p>${escapeHtml(HOST.city)}, ${escapeHtml(HOST.country)}</p>`;
}

export function mentionsBodyHtml() {
  return `
      <h1>Mentions légales</h1>
      <h2>Éditeur du site</h2>
      ${publisherBlock()}
      <h2>Directeur de la publication</h2>
      <p>Le directeur de la publication est l’éditeur du site, identifié ci-dessus.</p>
      <h2>Hébergeur</h2>
      ${hostBlock()}
      <h2>Propriété intellectuelle</h2>
      <p>Les textes, visuels, maquettes et éléments graphiques présentés sur ${escapeHtml(SITE_URL)} sont la propriété de ${escapeHtml(PUBLISHER.brand)} ou de leurs auteurs respectifs, sauf mention contraire. Toute reproduction ou représentation non autorisée est interdite.</p>
      <h2>Responsabilité</h2>
      <p>${escapeHtml(PUBLISHER.brand)} s’efforce de fournir des informations exactes et à jour. Le site peut toutefois contenir des inexactitudes ou omissions ; l’éditeur ne saurait être tenu responsable de l’usage qui en est fait par l’utilisateur.</p>
      <h2>Cookies et traceurs</h2>
      <p>Ce site ne dépose pas de cookies de mesure d’audience ni de publicité. Seuls des cookies techniques strictement nécessaires au fonctionnement du serveur ou du navigateur peuvent être utilisés, sans profilage. Aucun bandeau de consentement cookies n’est requis dans cette configuration.</p>
      <h2>Droit applicable</h2>
      <p>Le présent site est soumis au droit français. En cas de litige, les tribunaux français seront seuls compétents, sous réserve des règles impératives applicables aux consommateurs.</p>
      <p><a href="/">Retour au site</a></p>`;
}

export function privacyBodyHtml() {
  return `
      <h1>Politique de confidentialité</h1>
      <p>Cette page décrit comment ${escapeHtml(PUBLISHER.brand)} traite les données personnelles transmises via le formulaire de contact de ${escapeHtml(SITE_URL)}.</p>
      <h2>Responsable du traitement</h2>
      ${publisherBlock()}
      <h2>Données collectées</h2>
      <p>Via le formulaire : nom, nom d’entreprise (le cas échéant), activité, ville, adresse e-mail, réponses concernant un site existant, formule envisagée, style de page préféré et message libre.</p>
      <h2>Finalité</h2>
      <p>Répondre à votre demande, préparer une maquette gratuite et, le cas échéant, établir un devis. Vos données ne sont pas vendues à des tiers.</p>
      <h2>Base légale</h2>
      <p>Intérêt légitime de ${escapeHtml(PUBLISHER.brand)} à traiter votre demande commerciale, et votre consentement lorsque vous cochez la case prévue à cet effet.</p>
      <h2>Durée de conservation</h2>
      <p>Les données sont conservées le temps nécessaire au suivi de votre demande, puis archivées ou supprimées. Durée indicative : trois ans à compter du dernier contact, sauf obligation légale contraire. [À COMPLÉTER si votre politique interne diffère]</p>
      <h2>Destinataires</h2>
      <p>${escapeHtml(PUBLISHER.brand)} et son hébergeur (${escapeHtml(HOST.name)}), uniquement pour l’hébergement technique du site et la transmission des messages.</p>
      <h2>Vos droits</h2>
      <p>Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité, dans les limites prévues par le RGPD. Pour les exercer : <a href="mailto:${escapeHtml(PUBLISHER.email)}">${escapeHtml(PUBLISHER.email)}</a>.</p>
      <h2>Réclamation</h2>
      <p>Vous pouvez introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" rel="noopener noreferrer">cnil.fr</a>) si vous estimez que vos droits ne sont pas respectés.</p>
      <p><a href="/">Retour au site</a></p>`;
}

export function cgvBodyHtml() {
  const banner = CGV_PROVISIONAL_BANNER
    ? `<p class="legal-provisional-banner" role="status"><strong>Version provisoire – à faire relire par un juriste</strong></p>`
    : "";

  return `
      ${banner}
      <h1>Conditions générales de vente</h1>
      <p>Les présentes conditions régissent les prestations de création de site internet proposées par ${escapeHtml(PUBLISHER.brand)} (${escapeHtml(PUBLISHER.legalForm)}, SIRET ${escapeHtml(PUBLISHER.siret)}, ${escapeHtml(PUBLISHER.locality)} — ${escapeHtml(PUBLISHER.email)}).</p>
      <h2>Offres</h2>
      <h3>Formule « En une fois »</h3>
      <p>À partir de 500&nbsp;€ pour un site vitrine (sites plus complexes sur devis). Le montant convenu est payé en totalité à la validation de la maquette. L’hébergement est facturé 5&nbsp;€/mois en sus.</p>
      <h3>Formule « Par mois »</h3>
      <p>50&nbsp;€/mois, hébergement et nom de domaine standard inclus, sans engagement, résiliable à tout moment. En cas de résiliation, le client peut racheter le site (au prix du devis, ou 500&nbsp;€ pour une vitrine) et repartir avec les fichiers.</p>
      <h3>Formule « Sur mesure »</h3>
      <p>Prestations spécifiques établies sur devis écrit.</p>
      <h2>Maquette et délais</h2>
      <p>La maquette est fournie gratuitement et sans engagement. Après validation de la maquette, le délai de livraison indicatif est de 30 jours, sauf délai différent précisé au devis.</p>
      <h2>Nom de domaine</h2>
      <p>Le nom de domaine est enregistré et géré par ${escapeHtml(PUBLISHER.brand)}. Un transfert vers le client est possible moyennant 100&nbsp;€. Le renouvellement est inclus dans la formule mensuelle jusqu’à 20&nbsp;€/an ; au-delà, le surcoût est facturé au client.</p>
      <h2>Modifications</h2>
      <p>Deux petites demandes de modification gratuites par mois (une heure maximum chacune) sont incluses dans la formule mensuelle ; toute demande supplémentaire fait l’objet d’un devis.</p>
      <h2>Impayés</h2>
      <p>En cas d’impayé, une relance est envoyée par e-mail. À l’issue de 30 jours sans régularisation, le site peut être mis hors ligne. Les fichiers peuvent être supprimés 60 jours plus tard. Des pénalités de retard égales à trois fois le taux d’intérêt légal ainsi qu’une indemnité forfaitaire de recouvrement de 40&nbsp;€ (article L441-10 du Code de commerce) peuvent être appliquées.</p>
      <h2>Droit de rétractation</h2>
      <p>Si le contrat est conclu hors établissement avec un professionnel employant 5 salariés ou moins et que la prestation n’entre pas dans le champ de son activité principale, le client dispose de 14 jours pour se rétracter et aucun paiement n’est exigé pendant les 7 premiers jours. [À FAIRE RELIRE PAR UN JURISTE]</p>
      <h2>Propriété intellectuelle</h2>
      <p>Les droits sur le site livré sont transférés au client après paiement intégral des sommes dues, dans les conditions précisées au devis.</p>
      <h2>Responsabilité</h2>
      <p>${escapeHtml(PUBLISHER.brand)} est tenue d’une obligation de moyens. Sa responsabilité est limitée au montant des sommes effectivement perçues au titre du contrat concerné, sauf faute lourde ou dolosive.</p>
      <h2>Données personnelles</h2>
      <p>Le traitement des données est décrit dans la <a href="/politique-confidentialite.html">politique de confidentialité</a>.</p>
      <h2>Médiation de la consommation</h2>
      <p>En cas de litige, le client peut recourir à un médiateur de la consommation : [À COMPLÉTER — coordonnées du médiateur].</p>
      <h2>Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit français.</p>
      <p><a href="/">Retour au site</a></p>`;
}

export const LEGAL_PAGES = {
  "mentions-legales.html": {
    key: "mentions",
    title: "Mentions légales | SiteReady",
    description: "Mentions légales du site SiteReady (sitereadyshd.fr).",
    body: mentionsBodyHtml,
  },
  "politique-confidentialite.html": {
    key: "privacy",
    title: "Politique de confidentialité | SiteReady",
    description:
      "Politique de confidentialité et traitement des données du formulaire de contact SiteReady.",
    body: privacyBodyHtml,
  },
  "conditions-de-vente.html": {
    key: "cgv",
    title: "Conditions de vente | SiteReady",
    description: "Conditions générales de vente des prestations SiteReady (sitereadyshd.fr).",
    body: cgvBodyHtml,
  },
};
