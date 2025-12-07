# 🚀 CPU Optimization Fix - Deployment Guide

## Masalah yang Ditemukan

**CPU Usage 100% Constant** disebabkan oleh:
- ❌ **Double subscription**: Real-time + Polling berjalan bersamaan
- ❌ **OrdersPage**: Query database setiap 15 detik
- ❌ **AbandonedCartsPage**: Query database setiap 30 detik
- ❌ **10 users × 2 polling = 3,600 queries/jam** (tidak efisien!)

## Solusi yang Diterapkan

### ✅ File yang Diubah:
1. **`pages/OrdersPage.tsx`** (Line 424-430)
   - Disabled polling interval
   - Real-time subscription sudah cukup

2. **`pages/AbandonedCartsPage.tsx`** (Line 269-272)
   - Disabled polling interval
   - Real-time subscription sudah cukup

### ✅ Hasil yang Diharapkan:
- **CPU usage turun 70-80%**
- **Database queries berkurang drastis**
- **Real-time notifications tetap berfungsi**

---

## 🚀 Cara Deploy ke DigitalOcean

### Option 1: Via GitHub Push (Recommended)

```powershell
# 1. Commit perubahan
git add pages/OrdersPage.tsx pages/AbandonedCartsPage.tsx
git commit -m "fix: disable polling to reduce CPU usage (keep real-time only)"

# 2. Push ke GitHub
git push origin main

# 3. DigitalOcean App Platform akan auto-deploy
# Tunggu 3-5 menit, monitor di dashboard
```

### Option 2: Manual Build & Deploy

```powershell
# 1. Build production
npm run build

# 2. Test build locally
npx vite preview --host 0.0.0.0 --port 8080

# 3. Upload dist/ folder ke DigitalOcean
# (Sesuai method deployment Anda)
```

---

## 📊 Monitoring Setelah Deploy

### 1. Cek CPU Usage di Dashboard
- Login: https://cloud.digitalocean.com
- Pilih App/Droplet Anda
- Tab **Metrics** → Lihat grafik CPU
- **Harapan**: CPU turun dari 100% ke 20-40%

### 2. Test Functionality
✅ **Harus tetap berfungsi**:
- Real-time order notifications (saat ada order baru)
- Real-time abandoned cart alerts
- Badge count di header
- Sound notifications

❌ **Yang dihilangkan**:
- Polling fallback (tidak perlu karena real-time sudah aktif)

### 3. Check Real-time Subscriptions
Buka browser console (`F12`) di dashboard:
```
[Real-time] Subscription status: SUBSCRIBED
[Real-time] New order detected: {...}
```

---

## ⚠️ Rollback Plan (Jika Bermasalah)

Jika real-time notifications **tidak berfungsi**, uncomment polling:

### Rollback OrdersPage.tsx (Line 424):
```typescript
useEffect(() => {
  const interval = setInterval(() => {
      refreshOrdersSilently();
  }, 60000); // 60s (lebih lambat dari sebelumnya)
  return () => clearInterval(interval);
}, [refreshOrdersSilently]);
```

### Rollback AbandonedCartsPage.tsx (Line 269):
```typescript
useEffect(() => {
    const interval = setInterval(() => refreshAbandonedSilently(), 120000); // 2 menit
    return () => clearInterval(interval);
}, [refreshAbandonedSilently]);
```

**Catatan**: Gunakan interval **lebih lama** (60s-120s) untuk mengurangi beban CPU.

---

## 🔧 Alternative: Supabase Real-time Configuration

Pastikan Supabase real-time **enabled** di tabel:
1. Login Supabase dashboard
2. Database → Replication
3. Pastikan tabel `orders` dan `abandoned_carts` di-checklist

Jika real-time tidak aktif, polling menjadi penting (gunakan interval lambat).

---

## 📈 Expected Performance

### Before Fix:
- CPU: **100% constant**
- Database queries: **~3,600/jam**
- Response time: Slow

### After Fix:
- CPU: **20-40% average**
- Database queries: **~100-200/jam** (hanya real-time events)
- Response time: **Faster**

---

## ✅ Deployment Checklist

- [ ] Git commit & push perubahan
- [ ] Tunggu auto-deploy selesai (3-5 menit)
- [ ] Monitor CPU usage di DigitalOcean dashboard
- [ ] Test order notification tetap berfungsi
- [ ] Test abandoned cart notification tetap berfungsi
- [ ] Verify badge count updates real-time
- [ ] Monitor selama 30-60 menit

---

**Date**: December 7, 2025  
**Issue**: CPU 100% constant  
**Root Cause**: Double subscription (real-time + aggressive polling)  
**Solution**: Disable polling, keep real-time only  
**Impact**: 70-80% CPU reduction expected
