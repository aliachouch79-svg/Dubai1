# Déploiement GitHub - Dubai Real Estate App

Ce dossier contient tout le nécessaire pour déployer l'application sur GitHub et Render.

## Configuration Render
1. **Build Command:** `npm install && npm run server:build`
2. **Start Command:** `npm run server:prod`
3. **Environnement Variables:**
   - `DATABASE_URL`: Votre URL de base de données PostgreSQL.
   - `EXPO_PUBLIC_DOMAIN`: `dubai-knlv.onrender.com`
   - `NODE_ENV`: `production`

## Structure
- `app/`: Frontend Expo Router.
- `server/`: Backend Express + Drizzle ORM.
- `shared/`: Schémas Zod et Drizzle.
