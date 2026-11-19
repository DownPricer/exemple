# T'Nature & Jardin — site vitrine

Site one-page responsive (desktop ≤ 1200 px / mobile ≈ 390 px), prêt à déployer en fichiers statiques.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Style **Maquette** (référence pixel) |
| `refonte.html` | Style **Refonte** (version pine / Manrope) |
| `mentions-legales.html` | Mentions légales (placeholders) |
| `css/styles.css` | Styles maquette + responsive |
| `css/style-picker.css` | Molette de choix de style |
| `js/main.js` | Menu burger, smooth scroll, formulaire |
| `js/style-picker.js` | Bascule Maquette ↔ Refonte |
| `assets/logo.jpg` | Logo |

## Comparer les styles

Une **molette** flottante (bas à droite) permet de basculer entre :
- **Maquette** → `index.html`
- **Refonte** → `refonte.html`

Le dernier choix est mémorisé dans `localStorage`. À retirer avant la mise en ligne définitive si un seul style est validé.

## Lancer en local

```bash
cd site
python -m http.server 8080
```

Ouvrir http://127.0.0.1:8080

## Avant la mise en ligne

### 1. Zone d'intervention

Remplacer partout `[ZONE D'INTERVENTION À CONFIRMER]` (textes, `title`, meta, JSON-LD).

### 2. Photos

Dans chaque bloc `.media-slot`, ajouter une image :

```html
<div class="media-slot" data-photo="jardin">
  <img src="assets/photos/jardin.jpg" alt="Jardin entretenu par T'Nature & Jardin" width="880" height="560" loading="lazy">
</div>
```

Slots prévus : `jardin` (hero), `nid` (guêpes), `thomas` (à propos).  
Les images utilisent `object-fit: cover`. Formats recommandés : WebP ou JPG optimisé.

### 3. Formulaire (Web3Forms)

1. Créer une clé gratuite sur [web3forms.com](https://web3forms.com) (e-mail de réception).
2. Dans `js/main.js`, remplacer `YOUR_WEB3FORMS_ACCESS_KEY` par votre clé.

Sans clé, le formulaire affiche une erreur honnête (pas de faux message de succès).

### 4. SEO / URL

Remplacer `https://www.exemple-tnature-jardin.fr/` dans les balises Open Graph, `canonical` et JSON-LD.

### 5. Mentions légales

Compléter adresse, e-mail, hébergeur dans `mentions-legales.html`.

## Déploiement

Uploader le contenu de `site/` sur n'importe quel hébergement statique (Netlify, Vercel, OVH, etc.).
