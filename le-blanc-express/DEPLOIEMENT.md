# Déploiement SiteReady sur VPS Linux (Nginx + Node)

Ce projet sert les fichiers statiques depuis `public/` et expose l’API d’envoi du formulaire sur `POST /api/contact`.

## Prérequis

- VPS Linux (Debian/Ubuntu recommandé)
- Node.js 20 ou plus récent
- Nginx
- Nom de domaine `sitereadyshd.fr` pointant vers le VPS
- Compte SMTP (hébergeur mail, Brevo, Mailgun, etc.)

## 1. Copier le projet sur le serveur

```bash
cd /var/www
git clone [VOTRE_DÉPÔT] siteready
cd siteready
npm ci
cp .env.example .env
nano .env
```

Renseignez au minimum (voir `.env.example`) :

- `PORT=3001` (doit correspondre au `proxy_pass` Nginx)
- `CONTACT_TO`, `MAIL_FROM`, `CONTACT_REPLY_TO`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

```bash
npm run build:elegant
mkdir -p logs
```

## 2. Process manager (PM2 recommandé)

### Option A — PM2

```bash
sudo npm install -g pm2
cd /var/www/siteready
pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

Logs : `pm2 logs siteready` (fichiers aussi dans `logs/pm2-*.log`).

Après mise à jour du code :

```bash
cd /var/www/siteready
git pull
npm ci
npm run build:elegant
pm2 restart siteready
```

### Option B — systemd (si PM2 indisponible)

Créez `/etc/systemd/system/siteready.service` :

```ini
[Unit]
Description=SiteReady (Node)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/siteready
Environment=NODE_ENV=production
EnvironmentFile=-/var/www/siteready/.env
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=5
StandardOutput=append:/var/www/siteready/logs/systemd-out.log
StandardError=append:/var/www/siteready/logs/systemd-error.log

[Install]
WantedBy=multi-user.target
```

```bash
sudo mkdir -p /var/www/siteready/logs
sudo chown -R www-data:www-data /var/www/siteready
sudo systemctl daemon-reload
sudo systemctl enable siteready
sudo systemctl start siteready
sudo systemctl status siteready
```

L’API écoute sur le port défini dans `.env` (**3001** par défaut).

## 3. Nginx

Exemple `/etc/nginx/sites-available/sitereadyshd.fr` :

```nginx
server {
    listen 80;
    server_name sitereadyshd.fr www.sitereadyshd.fr;
    return 301 https://sitereadyshd.fr$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sitereadyshd.fr;

    root /var/www/siteready/public;
    index index.html;

    ssl_certificate     /etc/letsencrypt/live/sitereadyshd.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sitereadyshd.fr/privkey.pem;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Certificat TLS (Let’s Encrypt) :

```bash
sudo certbot --nginx -d sitereadyshd.fr -d www.sitereadyshd.fr
sudo nginx -t && sudo systemctl reload nginx
```

## 4. Test local (développement)

```bash
npm install
cp .env.example .env
# renseigner SMTP
npm run dev
```

Ouvrez `http://localhost:3001` (ou le port défini dans `.env`). Sans SMTP configuré, le formulaire renverra une erreur 503 explicite.

Page design Élégant : placez la refonte dans `refonte-chatgpt/SiteReady-refonte/index.html`, puis `npm run build:elegant`. Elle est servie sur `/elegant/`.

## 5. Mises à jour

```bash
cd /var/www/siteready
git pull
npm ci
pm2 restart siteready
# ou : sudo systemctl restart siteready
```

## 6. Avis clients

Éditez `public/avis.json`. Format d’un avis :

```json
{
  "prenom": "Marie",
  "entreprise": "Boulangerie Example",
  "ville": "Aubenas",
  "note": 5,
  "texte": "Texte de l'avis.",
  "date": "2026-03-01"
}
```

Tant que le fichier contient `[]`, la section avis reste masquée.

## 7. Contenu éditorial

Tous les textes de la page d’accueil et des pages légales sont dans `public/assets/js/content.js`.
