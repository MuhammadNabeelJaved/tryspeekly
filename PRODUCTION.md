# Production Deployment Guide — TrySpeekly

Frontend deploys to **Vercel** (static Vite build). The backend runs Express +
**Socket.io**, which needs a persistent Node host with WebSocket support — **not**
Vercel serverless. Recommended: **Render** or **Railway** (or a VPS).

---

## 1. Backend (Render / Railway / VPS)

Create a Node web service pointing at the `server/` directory.

| Setting | Value |
|---------|-------|
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `npm start` |
| Health check path | `/api/health` |

> Do **not** set `PORT` — the host injects it and the server reads `process.env.PORT` (`server/index.js`).

### Backend environment variables

```
NODE_ENV=production
CLIENT_URL=https://tryspeekly.com
SITE_URL=https://tryspeekly.com
SITE_NAME=TrySpeekly
CONTACT_EMAIL=hello@tryspeekly.com
SUPPORT_EMAIL=support@tryspeekly.com
PRIVACY_EMAIL=privacy@tryspeekly.com
PAYMENTS_EMAIL=payments@tryspeekly.com
CONTACT_PHONE=+92 308 692 5545
CONTACT_WHATSAPP=923086925545
MONGO_URI=mongodb+srv://USER:STRONG_PASSWORD@cluster0.gsbme.mongodb.net   # rotate the weak password
DB_NAME=english
JWT_ACCESS_SECRET=<strong 96-char secret>
JWT_REFRESH_SECRET=<strong 96-char secret>
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CLOUDINARY_CLOUD_NAME=<value>
CLOUDINARY_API_KEY=<value>
CLOUDINARY_API_SECRET=<value>
ANTHROPIC_API_KEY=<value>
RESEND_API_KEY=<value>
RESEND_FROM_EMAIL=TrySpeekly <hello@tryspeekly.com>
```

The server **refuses to boot in production with weak/default JWT secrets** — use real 96-char secrets.

---

## 2. Frontend (Vercel)

| Setting | Value |
|---------|-------|
| Root directory | `client` |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

### Frontend environment variables (Settings → Environment Variables → Production)

```
VITE_API_URL=https://<your-backend-url>        # e.g. https://tryspeekly-api.onrender.com
VITE_SOCKET_URL=https://<your-backend-url>     # same as API
VITE_SITE_URL=https://tryspeekly.com
VITE_SITE_NAME=TrySpeekly
VITE_CONTACT_EMAIL=hello@tryspeekly.com
VITE_SUPPORT_EMAIL=support@tryspeekly.com
VITE_PRIVACY_EMAIL=privacy@tryspeekly.com
VITE_PAYMENTS_EMAIL=payments@tryspeekly.com
VITE_CONTACT_PHONE=+92 308 692 5545
VITE_CONTACT_WHATSAPP=923086925545
VITE_CONTACT_ADDRESS=
```

> `VITE_*` vars are baked in at **build time** — after changing any, **redeploy** the frontend.

---

## 3. Deploy order (avoids the chicken-and-egg)

1. Deploy the **backend** first → note its public URL.
2. In Vercel, set `VITE_API_URL` + `VITE_SOCKET_URL` to that backend URL (plus the other `VITE_*`).
3. Deploy the **frontend** (Vercel build).
4. Add the custom domain **tryspeekly.com** in Vercel and point DNS to it.
5. Set the backend's `CLIENT_URL` to the final domain `https://tryspeekly.com` (CORS + email links depend on it).

---

## 4. Gotchas

- **CORS is a single origin.** The server allows exactly the one origin in `CLIENT_URL`
  (`server/app.js`, `server/index.js` Socket.io). Pick one canonical host and redirect the
  other (apex ↔ www) at the DNS/Vercel layer, or both won't pass CORS.
- **Resend domain** `tryspeekly.com` must be DNS-verified, or outbound email fails.
- **Email/site-settings templates live in the DB.** Brand/font changes in code don't reach
  existing rows automatically — run `server/scripts/resync-email-templates.js` (`APPLY=true`)
  after deploying template changes.
- **MongoDB:** rotate the weak `nabeeljaved:nabeeljaved` credential before go-live and
  whitelist the backend host's egress IPs in Atlas.

---

## 5. Pre-launch security checklist

- [ ] Revoke the previously-exposed GitHub PAT
- [ ] Rotate the MongoDB Atlas password and the admin account password
- [ ] Confirm strong `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` in prod
- [ ] Verify `tryspeekly.com` in Resend
- [ ] Confirm `NODE_ENV=production` and the correct `CLIENT_URL` / `VITE_API_URL`
