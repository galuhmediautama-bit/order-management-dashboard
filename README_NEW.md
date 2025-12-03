# 📊 Order Management Dashboard

Platform all-in-one untuk mengelola pesanan, pelanggan, dan penghasilan tim Anda secara real-time.

## ✨ Features

- 📋 **Order Management** - Kelola pesanan dengan pagination, search, dan filtering
- 👥 **Customer Management** - Database pelanggan terintegrasi
- 💰 **Earnings Tracking** - Laporan keuangan real-time
- 📊 **Dashboard Analytics** - Visualisasi data dengan chart interaktif
- 🔐 **User Management** - Role-based access control dengan admin approval
- 📱 **Responsive Design** - Mobile-friendly interface
- 🌙 **Dark Mode** - Full dark mode support
- 🔗 **Supabase Integration** - PostgreSQL database & authentication

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ ([Download](https://nodejs.org/))
- Git
- Supabase Account ([Free Sign Up](https://supabase.com))

### Local Development

1. Clone repository:
```bash
git clone https://github.com/username/order-management-dashboard.git
cd order-management-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.example .env.local
```

4. Fill in your environment variables:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

5. Start dev server:
```bash
npm run dev
```

6. Open browser → http://localhost:3000

### Default Credentials (Development)
- Email: `galuhmediautama@gmail.com`
- Password: `Banjar2018`

## 🌍 Deployment

### Quick Deployment Options

**Choose one:**

1. **App Platform** (Easiest - ⭐⭐⭐⭐⭐)
   - No server management needed
   - Auto-deploy from GitHub
   - Perfect for beginners
   - **[→ Full Guide](./DEPLOYMENT_QUICK.md#opsi-1-app-platform-termudah)**

2. **Droplet + PM2** (Full Control - 🔥)
   - Complete server control
   - Better for scaling
   - Only $6/month
   - **[→ Full Guide](./DEPLOYMENT_QUICK.md#opsi-2-droplet--pm2-recommended-)**

3. **Spaces Static Hosting** (Cheapest - 💰)
   - Pure frontend CDN
   - Only $5/month
   - **[→ Full Guide](./DEPLOYMENT_QUICK.md#opsi-3-static-hosting-via-spaces-termurah-)**

### Build for Production
```bash
npm run build
```

This creates optimized build in `dist/` folder.

[📖 **See Full Deployment Guide →**](./DEPLOYMENT_QUICK.md)

## 📁 Project Structure

```
order-management-dashboard/
├── components/          # React components
│   ├── icons/          # Icon components
│   └── landing/        # Landing page components
├── pages/              # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── OrdersPage.tsx
│   └── ...
├── contexts/           # React contexts
├── styles/             # CSS files
├── types/              # TypeScript types
├── App.tsx
├── index.tsx
├── vite.config.ts
├── tsconfig.json
├── package.json
├── DEPLOYMENT.md       # Detailed deployment guide
├── DEPLOYMENT_QUICK.md # Quick deployment guide
└── .env.example        # Environment variables template
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Charts** | Recharts |
| **Routing** | React Router v6 |

## 🔧 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
```

## 📚 Documentation

- [Environment Variables](./DEPLOYMENT_QUICK.md#konfigurasi-environment-variables)
- [Deployment Guide](./DEPLOYMENT_QUICK.md)
- [Troubleshooting](./DEPLOYMENT_QUICK.md#troubleshooting)
- [Database Schema](./firestore.rules) (Supabase)

## 🔒 Security Notes

- ✅ Never commit `.env.local` (already in `.gitignore`)
- ✅ Use Supabase Row Level Security (RLS) for data protection
- ✅ Validate all user inputs server-side
- ✅ Keep dependencies updated: `npm update`

## 📞 Support

For issues or questions:
1. Check [Troubleshooting Guide](./DEPLOYMENT_QUICK.md#troubleshooting)
2. Review [DigitalOcean Docs](https://docs.digitalocean.com)
3. Check [Supabase Documentation](https://supabase.com/docs)

## 📄 License

This project is open source.

---

**Made with ❤️ for order management**
