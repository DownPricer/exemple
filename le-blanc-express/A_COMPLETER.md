# Éléments à compléter avant mise en production

Remplacez les valeurs entre crochets dans **`public/assets/js/content.js`** (section `seo`, `contact`, `legal`) et vérifiez les points ci-dessous.

| Placeholder | Où | Description |
|-------------|-----|-------------|
| `[VOTRE_TÉLÉPHONE]` | `seo.telephone` | Téléphone affiché dans les données structurées (JSON-LD) |
| `[VOTRE_VILLE]` | `seo.addressLocality` | Ville de l’éditeur |
| `[CODE_POSTAL]` | `seo.postalCode` | Code postal |
| `[ADRESSE_POSTALE]` | `seo.streetAddress` | Adresse postale (SEO / schema.org) |
| `[LIEN_PAGE_FACEBOOK]` | `contact.facebookUrl` | URL complète de la page Facebook (ex. `https://facebook.com/...`) |
| `[STATUT_JURIDIQUE]` | `legal.mentions.editorLines`, `legal.privacy.sections` | Ex. Micro-entreprise, EURL… |
| `[NUMÉRO_SIRET]` | `legal.mentions.editorLines` | SIRET |
| `[ADRESSE_POSTALE_COMPLÈTE]` | mentions + politique | Adresse postale complète de l’éditeur |
| `[NOM_HÉBERGEUR]` | `legal.mentions.hostLines` | Nom legal de l’hébergeur |
| `[ADRESSE_HÉBERGEUR]` | `legal.mentions.hostLines` | Adresse de l’hébergeur |

## Déjà renseigné dans le projet

- E-mail de contact : `contact@sitereadyshd.fr`
- Délai de recontact affiché après envoi du formulaire : `contact.recontactDelay` (par défaut **48 heures**)
- Domaine et URL canonique : `sitereadyshd.fr` / `https://sitereadyshd.fr`

## Fichiers à configurer côté serveur

- **`.env`** : identifiants SMTP (voir `.env.example`)
- **Certificat SSL** pour `sitereadyshd.fr`
- **`public/avis.json`** : laisser `[]` tant qu’il n’y a pas de vrais avis

## FAQ

Les réponses dans `content.js` sont rédigées ; relisez-les pour qu’elles correspondent exactement à votre offre (délais, conditions d’abonnement, reprise du domaine).

## Déploiement

Instructions détaillées : **`DEPLOIEMENT.md`**.
