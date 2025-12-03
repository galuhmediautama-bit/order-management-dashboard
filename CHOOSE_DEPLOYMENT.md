# 🎯 DEPLOYMENT DECISION TREE

Pilih opsi deployment yang paling cocok untuk Anda:

```
                    Mau Deploy ke DigitalOcean?
                              │
                ┌─────────────┴─────────────┐
                │                           │
         [Opsi 1]                    [Opsi 2]                    [Opsi 3]
      APP PLATFORM               DROPLET + PM2                   SPACES
      (Termudah)               (Recommended)                   (Termurah)
            │                         │                            │
            │                         │                            │
     ⭐⭐⭐⭐⭐                  ⭐⭐⭐⭐⭐                    ⭐⭐⭐⭐
    (Mudah)                  (Moderate)                   (Easy)
            │                         │                            │
            │                         │                            │
    NO SERVER MGMT           FULL CONTROL              PURE FRONTEND
    AUTO DEPLOYMENT          SCALABLE                  CDN HOSTED
    $5-12/MONTH             $6-12/MONTH               $5/MONTH
            │                         │                            │
            └─────────────┬───────────┴────────────────┬──────────┘
                          │                           │
                    GIT PUSH                   SSH TO SERVER
                          │                           │
            ┌─────────────────────────────────────────┘
            │
            V
    APLIKASI ONLINE! ✓
```

---

## 📍 OPSI 1: APP PLATFORM (Termudah)

```
┌──────────────────────────────────────────────┐
│         OPSI 1: APP PLATFORM                 │
│         (NO SERVER MANAGEMENT)               │
├──────────────────────────────────────────────┤
│                                              │
│ 1. Push ke GitHub                           │
│    git push                                  │
│                                              │
│ 2. DigitalOcean Dashboard                    │
│    → Apps → Create App                       │
│                                              │
│ 3. Connect GitHub                            │
│    → Select Repo                             │
│                                              │
│ 4. Configure                                 │
│    Build: npm install && npm run build       │
│    Run: npx vite preview --port 8080         │
│                                              │
│ 5. Add Env Variables                         │
│    VITE_SUPABASE_URL=xxx                     │
│    VITE_SUPABASE_ANON_KEY=xxx                │
│                                              │
│ 6. Create App                                │
│    Tunggu 5-10 menit                         │
│                                              │
│ 7. DONE! ✓ Auto-updates from GitHub          │
│                                              │
├──────────────────────────────────────────────┤
│ ✅ Pros:           │ ❌ Cons:                │
│ • Sangat mudah     │ • Limited control      │
│ • Auto-deploy      │ • Slower scaling       │
│ • Zero ops        │ • Vendor lock-in       │
│ • SSL auto        │                         │
│ • $5-12/month     │                         │
├──────────────────────────────────────────────┤
│ Cocok untuk: Pemula, MVP, prototype         │
└──────────────────────────────────────────────┘
```

---

## 🖥️ OPSI 2: DROPLET + PM2 (Recommended)

```
┌──────────────────────────────────────────────┐
│         OPSI 2: DROPLET + PM2                │
│         (FULL CONTROL, SCALABLE)             │
├──────────────────────────────────────────────┤
│                                              │
│ 1. Create Droplet                            │
│    • OS: Ubuntu 24.04                        │
│    • Plan: Basic ($6/mo)                     │
│    • Region: Singapore/Jakarta               │
│                                              │
│ 2. SSH to Server                             │
│    ssh root@your_ip                          │
│                                              │
│ 3. Run Setup Script (1 command!)             │
│    bash -c "$(curl ...)"                     │
│    ├─ Install Node.js                        │
│    ├─ Clone repository                       │
│    ├─ Install PM2                            │
│    ├─ Setup Nginx                            │
│    ├─ Install Certbot                        │
│    └─ Start application                      │
│                                              │
│ 4. Edit Env Variables                        │
│    nano /var/www/order-dashboard/.env.local  │
│                                              │
│ 5. Rebuild & Restart                         │
│    npm run build                             │
│    pm2 restart all                           │
│                                              │
│ 6. DONE! ✓ App running on :3000              │
│    Nginx proxying to port 80                 │
│                                              │
├──────────────────────────────────────────────┤
│ ✅ Pros:           │ ❌ Cons:                │
│ • Full control     │ • Need manage server    │
│ • Scalable         │ • Manual SSL            │
│ • Cheap            │ • More maintenance      │
│ • Flexible         │ • Need SSH knowledge    │
│ • $6-12/month      │                         │
├──────────────────────────────────────────────┤
│ Cocok untuk: Developer, production, scaling  │
└──────────────────────────────────────────────┘
```

---

## 💾 OPSI 3: SPACES (Termurah)

```
┌──────────────────────────────────────────────┐
│         OPSI 3: SPACES (CDN)                 │
│         (PURE FRONTEND, CHEAPEST)            │
├──────────────────────────────────────────────┤
│                                              │
│ 1. Build Locally                             │
│    npm run build                             │
│    → Creates dist/ folder                    │
│                                              │
│ 2. Create Space                              │
│    DigitalOcean → Spaces → Create Space      │
│                                              │
│ 3. Upload Files                              │
│    Drag & drop dist/ → Space                 │
│    Or use S3 CLI                             │
│                                              │
│ 4. Enable Static Site Hosting                │
│    Space Settings → Edit CORS                │
│                                              │
│ 5. DONE! ✓ Access via Space URL              │
│    e.g., https://xxxxx.digitaloceanspaces... │
│                                              │
├──────────────────────────────────────────────┤
│ ✅ Pros:           │ ❌ Cons:                │
│ • Termurah         │ • Frontend only         │
│ • Simple           │ • Need manual rebuilds  │
│ • CDN built-in     │ • Static files only     │
│ • Fast             │                         │
│ • $5/month         │                         │
├──────────────────────────────────────────────┤
│ Cocok untuk: Landing page, pure frontend    │
└──────────────────────────────────────────────┘
```

---

## 🔑 GET CREDENTIALS

```
Supabase Settings (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)
│
├─ Login: https://supabase.com
├─ Select Project
├─ Settings (⚙️) → API
├─ Copy "Project URL"
└─ Copy "anon public"

Contoh:
┌─────────────────────────────────────────────┐
│ VITE_SUPABASE_URL=                           │
│ https://abc123xyz.supabase.co                │
│                                              │
│ VITE_SUPABASE_ANON_KEY=                      │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...     │
└─────────────────────────────────────────────┘
```

---

## ⏱️ TIME & COST ESTIMATE

```
┌─────────────┬──────────┬─────────┬──────────┐
│ Option      │ Setup    │ Monthly │ Easiest  │
├─────────────┼──────────┼─────────┼──────────┤
│ App Platform│ 10 min   │ $5-12   │ ⭐⭐⭐⭐⭐ │
│ Droplet+PM2 │ 20 min   │ $6-12   │ ⭐⭐⭐   │
│ Spaces      │ 10 min   │ $5      │ ⭐⭐⭐⭐ │
└─────────────┴──────────┴─────────┴──────────┘
```

---

## 🚀 STEP-BY-STEP (Choose ONE)

### Opsi 1: App Platform
```
1. git push
2. DigitalOcean → Apps → Create
3. Connect GitHub & authorize
4. Set:
   Build: npm install && npm run build
   Run: npx vite preview --port 8080
5. Add env vars (VITE_SUPABASE_*)
6. Create App
7. Wait 5-10 min ✓
```

### Opsi 2: Droplet
```
1. Create Droplet (Ubuntu, Basic plan, SG/Jakarta)
2. ssh root@IP
3. Run: bash -c "$(curl ...setup.sh)"
4. nano .env.local (edit Supabase creds)
5. npm run build && pm2 restart
6. Access: http://IP ✓
```

### Opsi 3: Spaces
```
1. npm run build
2. Create Space
3. Upload dist/ folder
4. Access: Space URL ✓
```

---

## ❓ DECISION CHART

```
Am I comfortable with servers?
│
├─ NO → USE OPSI 1 (App Platform)
│       Everything automated
│
├─ MAYBE → USE OPSI 2 (Droplet)
│          Use setup.sh script
│
└─ YES → USE OPSI 2 (Droplet)
         Manual setup for full control
```

---

## 📱 AFTER DEPLOYMENT

```
✓ App online
✓ Database connected
✓ Auth working
✓ All features functional

Next:
→ Setup domain name
→ Setup SSL (if not auto)
→ Test all features
→ Monitor logs
→ Setup backups
→ Consider monitoring alerts
```

---

## 🆘 QUICK HELP

| Problem | Solution |
|---------|----------|
| App not starting | Check PM2 logs: `pm2 logs` |
| Env vars not working | Rebuild after setting vars |
| 404 errors | Check Nginx config proxy |
| Supabase timeout | Add IP to Supabase whitelist |
| Port already in use | `lsof -i :3000` then kill |

---

**Pick your option and let's deploy! 🚀**

Need help? Read:
- DEPLOYMENT_START_HERE.md (overview)
- DEPLOYMENT_QUICK.md (how-to)
- DEPLOYMENT.md (detailed guide)
