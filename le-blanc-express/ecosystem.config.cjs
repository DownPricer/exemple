/** PM2 — le serveur charge déjà .env via dotenv (cwd = répertoire du projet). */
module.exports = {
  apps: [
    {
      name: "siteready",
      script: "server/index.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: "250M",
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
