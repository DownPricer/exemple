# Brief — Site vitrine T'Nature & Jardin (paysagiste)

## Avant de commencer
- Si le projet est cartographié avec **Graphify**, utilise Graphify avant de lire ou de modifier le code, pour repérer les fichiers, composants et routes existants. Ne recrée rien qui existe déjà. Lance **Graphify Update** après chaque modification importante, et ne committe ni caches ni sorties Graphify. Si Graphify est indisponible, dis-le avant d'explorer autrement.

## Objectif
Coder un site vitrine **une page**, responsive et prêt à mettre en ligne, qui reproduit **au pixel près** les deux maquettes fournies :
- `maquette-ordinateur.html` : la référence pour l'écran large (contenu de 1200 px de large maximum) ;
- `maquette-telephone.html` : la référence pour le mobile (390 px). Il ne faut pas deux sites, mais **un seul site responsive** dont l'affichage en dessous d'environ 768 px correspond à cette maquette.

Ouvre les deux fichiers dans un navigateur avant de coder : ils sont la source de vérité pour les espacements, les tailles, les couleurs et les textes.

## Le client
- **Entreprise :** T'Nature & Jardin, dirigée par Thomas Theillard (artisan paysagiste)
- **Téléphone :** 06 78 50 33 89 (lien `tel:0678503389`)
- **SIRET :** 100 804 646 00017
- **Logo :** `logo.jpg` (sur fond blanc)
- **Zone d'intervention :** à confirmer. Garde le placeholder `[ZONE D'INTERVENTION À CONFIRMER]`.

## Design system (repris des maquettes)
| Rôle | Valeur |
|---|---|
| Fond principal | `#F6F4EE` |
| Fond secondaire (services) | `#FFFFFF` |
| Texte / vert forêt | `#1C2B22` |
| Texte secondaire | `#44544A`, `#5A6A5F` |
| Accent (boutons) | `#3F7A1F` |
| Vert foncé (liens, étiquettes) | `#2F5E17` |
| Vert clair (icônes sur fond foncé) | `#A8D672` |
| Badge clair | `#E4EDD9` |
| Bordures | `#E2DED2`, `#CFD6C7` |
| Section guêpes : fond | `#1A1A16` |
| Section guêpes : ambre | `#F2B233` |

- **Typos (Google Fonts) :** *Bricolage Grotesque* 700/800 pour les titres, *Inter* 400/500/600 pour le texte.
- **Arrondis :** boutons en pilule (999px), cartes de 18 à 22px, grands blocs de 28 à 32px.
- **Icônes :** SVG au trait, inline, comme dans les maquettes (pas d'émoji).

## Structure de la page
1. **En-tête** : logo + nom + « Thomas Theillard · Paysagiste », navigation par ancres (Services, Guêpes & frelons, À propos, Contact), bouton téléphone. Sur mobile, l'en-tête reste fixé en haut et un **menu burger fonctionnel** remplace les liens.
2. **Haut de page** : badge, titre « Votre jardin, entre de bonnes mains. », sous-titre, boutons « Demander un devis gratuit » et « Appeler », trois mentions cochées, grande photo avec une carte flottante « Nids de guêpes & frelons ».
3. **Services** : cinq cartes (tonte de pelouse, taille de haies & arbustes, débroussaillage, entretien de jardins, mise en valeur des espaces verts), plus une carte d'appel à l'action verte.
4. **Guêpes & frelons** : section sombre noir et ambre, trois étapes numérotées, bouton urgence.
5. **À propos** : photo, texte sur Thomas, deux encarts (Professionnalisme, Efficacité).
6. **Contact** : grand bloc vert forêt, numéro en grand, formulaire (nom, téléphone, prestation, message).
7. **Pied de page** : logo, ©, SIRET, lien vers les mentions légales.
8. **Mobile uniquement** : une **barre fixe en bas de l'écran** avec les boutons « Appeler » et « Devis gratuit ».

## Ce qu'il faut ajouter par rapport à la maquette
- Un **défilement doux** vers les ancres, en tenant compte de la hauteur de l'en-tête fixe.
- Un menu burger mobile qui s'ouvre, se ferme et se ferme aussi au clic sur un lien.
- Un formulaire **réellement fonctionnel** : choisis une solution simple (Formspree, Web3Forms ou une route serveur si le projet en a une), avec des messages de succès et d'erreur. Ne prétends jamais qu'un message est envoyé s'il ne l'est pas.
- Une **page Mentions légales** (avec des placeholders pour les infos à compléter).
- Le SEO local : `title` et `meta description` du type « Paysagiste [ZONE] — T'Nature & Jardin », balises Open Graph, données structurées JSON-LD `LocalBusiness` (avec nom, téléphone et zone en placeholder).
- Des **emplacements photo** pour l'instant. Garde les blocs rayés avec leur étiquette, ou des images libres de droits clairement marquées comme provisoires. Le client fournira ses vraies photos : prévois des images en `object-fit: cover` faciles à remplacer.
- L'accessibilité : contrastes conformes, `alt` sur les images, `aria-label` sur le bouton burger, focus visible.
- Les performances : polices en `display=swap`, images optimisées et en chargement différé.

## À ne pas faire
- Pas de chiffres inventés (années d'expérience, nombre de clients, avis).
- Pas d'adresse postale : elle n'est pas fournie.
- Ne change ni les textes ni les couleurs sans validation.

## Livrable attendu
Un projet prêt à déployer. Si rien n'est imposé, prends du HTML/CSS/JS statique, ou Astro, ou Next.js en export statique. Fournis un README court qui explique comment remplacer les photos et la zone d'intervention.
