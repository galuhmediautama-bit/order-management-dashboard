# Manual Testing - Notification System

## Verifikasi Sistem Notifikasi Sudah Berfungsi

### Test 1: Lonceng Notifikasi Menampilkan Badge ✅

#### Langkah-langkah:
1. Buka aplikasi di `http://localhost:3000`
2. Login ke dashboard
3. Perhatikan **icon lonceng (bell icon)** di header bagian atas kanan

#### Hasil yang Diharapkan:
- **Jika ada Pesanan dengan Status "Pending"**: Badge orange muncul di lonceng dengan jumlah pesanan
- **Jika ada Keranjang dengan Status "New"**: Badge menunjukkan total (pesanan pending + keranjang baru)
- **Format Badge**: Angka kecil berwarna orange di sudut kanan atas lonceng
- Contoh: Jika ada 3 pesanan pending dan 2 keranjang baru → Badge menunjukkan "5"

#### Jika Badge Tidak Muncul:
- [ ] Buka Developer Console (F12)
- [ ] Cek apakah ada error message
- [ ] Hard refresh page (Ctrl+Shift+R)
- [ ] Pastikan ada pesanan dengan status "Pending"

---

### Test 2: Dropdown Notifikasi Menampilkan Breakdown ✅

#### Langkah-langkah:
1. Klik icon lonceng di header
2. Perhatikan dropdown yang muncul

#### Hasil yang Diharapkan:
Dropdown menampilkan:
```
Notifikasi
📦 X pesanan baru
🛒 Y keranjang baru
[Notifikasi lainnya...]
```

Contoh:
- Jika ada 3 pesanan pending: "📦 3 pesanan baru"
- Jika ada 2 keranjang baru: "🛒 2 keranjang baru"
- Keduanya ditampilkan dengan breakdown yang jelas

---

### Test 3: Auto-Refresh Pesanan Setiap 45 Detik ✅

#### Langkah-langkah:
1. Buka halaman **Pesanan** (Orders)
2. Buka **Developer Console** (F12 → Console tab)
3. Tunggu 50 detik dan perhatikan console

#### Hasil yang Diharapkan:
Console menampilkan setiap 45 detik:
```
[Polling] Previous IDs: 25 New orders: 0
```

Atau jika ada pesanan baru:
```
[Polling] Previous IDs: 25 New orders: 1
[Notification] Showing toast for 1 new orders
```

#### Debug Console:
```javascript
// Jalankan di console untuk monitor polling:
setInterval(() => console.log('45 detik berlalu'), 45000);

// Cek apakah sound enabled:
localStorage.getItem('orders_sound_enabled');  // Harus return 'true' atau 'false'
```

---

### Test 4: Auto-Refresh Keranjang Setiap 60 Detik ✅

#### Langkah-langkah:
1. Buka halaman **Keranjang Terbengkalai** (Abandoned Carts)
2. Buka **Developer Console** (F12)
3. Tunggu 65 detik

#### Hasil yang Diharapkan:
Console menampilkan setiap 60 detik:
```
[Polling Carts] Previous: 12 New: 0
```

Atau jika ada keranjang baru:
```
[Polling Carts] Previous: 12 New: 1
[Notification Carts] Showing toast for 1 new carts
```

---

### Test 5: Toast Notifikasi Muncul Saat Ada Pesanan Baru ✅

#### Langkah-langkah:
1. Tetap di halaman **Pesanan** dengan console terbuka
2. Tunggu polling cycle berikutnya (45 detik)
3. Jika ada pesanan baru yang masuk, perhatikan toast di bawah header

#### Hasil yang Diharapkan:
- Toast notification muncul: **"X pesanan baru masuk"** (warna hijau/success)
- Toast muncul otomatis tanpa perlu refresh page
- Durasi toast: ~3 detik kemudian hilang
- Console menunjukkan: `[Notification] Showing toast for X new orders`

---

### Test 6: Toast Notifikasi Keranjang Muncul ✅

#### Langkah-langkah:
1. Tetap di halaman **Keranjang Terbengkalai** dengan console terbuka
2. Tunggu polling cycle (60 detik)
3. Jika ada keranjang baru, perhatikan toast

#### Hasil yang Diharapkan:
- Toast notification: **"X keranjang baru tercatat"** (warna biru/info)
- Berbeda dengan toast pesanan (warna & message berbeda)
- Console menunjukkan: `[Notification Carts] Showing toast for X new carts`

---

### Test 7: Sound Notification Pesanan (880Hz) ✅

#### Langkah-langkah:
1. Di halaman **Pesanan**, cari toggle **"Suara Notifikasi Pesanan"**
2. Pastikan toggle **ON** (hijau)
3. Tunggu pesanan baru masuk atau refresh page sambil ada pesanan pending
4. Dengarkan suara saat polling

#### Hasil yang Diharapkan:
- Suara berbunyи: **"Beep" tinggi** (880Hz sine wave)
- Durasi: ~0.3 detik
- Hanya bunyі jika toggle ON
- Volume mengikuti system volume

#### Verifikasi Toggle Persisten:
1. Klik toggle untuk OFF/ON
2. Refresh page (F5)
3. Toggle harus tetap dalam status sebelumnya
4. Verify di localStorage:
```javascript
// Di console:
localStorage.getItem('orders_sound_enabled');
// Harus return: 'true' atau 'false' sesuai toggle status
```

---

### Test 8: Sound Notification Keranjang (660Hz) ✅

#### Langkah-langkah:
1. Di halaman **Keranjang Terbengkalai**, cari toggle **"Suara Notifikasi Keranjang"**
2. Pastikan toggle **ON**
3. Tunggu keranjang baru atau polling cycle
4. Dengarkan suara

#### Hasil yang Diharapkan:
- Suara berbunyі: **"Beep" lebih rendah** daripada pesanan (660Hz triangle wave)
- Suara pesanan (880Hz) vs Keranjang (660Hz) terdengar jelas berbeda
- Hanya bunyі jika toggle ON

---

### Test 9: Badge Update Real-Time ✅

#### Langkah-langkah:
1. Buka halaman **Pesanan**
2. Lihat icon lonceng di header
3. Cek badge jumlah pesanan pending
4. Pindah ke halaman **Keranjang Terbengkalai**
5. Lihat badge berubah menjadi jumlah keranjang baru

#### Hasil yang Diharapkan:
- Badge berubah otomatis saat pindah halaman
- Badge = (jumlah pesanan pending) + (jumlah keranjang baru)
- Tidak perlu refresh page, update real-time
- Setiap halaman update count-nya otomatis saat polling

#### Contoh Alur:
```
Status Awal:
- Pesanan Pending: 5
- Keranjang Baru: 0
- Badge: "5"

Pindah ke halaman Keranjang → Polling cicle keranjang
- Keranjang Baru terdeteksi: 3
- Badge update: "8" (5 pesanan + 3 keranjang)

Kembali ke halaman Pesanan → Polling cycle pesanan
- Pesanan baru detected: 2
- Pesanan Pending total sekarang: 7
- Badge update: "10" (7 pesanan + 3 keranjang)
```

---

### Test 10: Polling Berjalan Terus (No Memory Leak) ✅

#### Langkah-langkah:
1. Buka **DevTools** (F12) → **Performance** tab
2. Perhatikan memory usage sambil halaman berjalan 5 menit
3. Polling harus tetap berjalan tanpa naiknya memory drastis

#### Hasil yang Diharapkan:
- Memory usage stabil (~50-100MB dari loading awal)
- Tidak ada memory leak
- Polling terus berjalan setiap 45s/60s
- Audio context reused, tidak ada multiple context

---

## Checklist Testing Lengkap

- [ ] **Badge muncul** di icon lonceng
- [ ] **Dropdown breakdown** menampilkan pesanan & keranjang terpisah
- [ ] **Pesanan polling** muncul di console setiap 45 detik
- [ ] **Keranjang polling** muncul di console setiap 60 detik
- [ ] **Toast pesanan** muncul saat ada pesanan baru (hijau)
- [ ] **Toast keranjang** muncul saat ada keranjang baru (biru)
- [ ] **Sound pesanan** (880Hz) bunyі jika toggle ON
- [ ] **Sound keranjang** (660Hz) bunyі jika toggle ON, terdengar berbeda
- [ ] **Sound toggle** persisten setelah refresh
- [ ] **Badge update** real-time saat pindah halaman
- [ ] **Memory usage** stabil, tidak ada leak

---

## Troubleshooting

### Problem: Badge tidak muncul
**Solution:**
- Pastikan ada pesanan dengan status "Pending" atau keranjang status "New"
- Cek di halaman Orders/Carts masing-masing
- Hard refresh: Ctrl+Shift+R
- Check console untuk error

### Problem: Polling tidak berjalan
**Solution:**
- Buka console (F12)
- Tunggu 50 detik, lihat message `[Polling]`
- Jika tidak ada, check browser network tab
- Pastikan Supabase connection aktif (test dengan buat order manual)

### Problem: Sound tidak berbunyi
**Solution:**
- Cek toggle harus ON
- Cek volume sistem tidak mute
- Check localStorage: `localStorage.getItem('orders_sound_enabled')`
- Try hard refresh
- Some browsers memerlukan user interaction dulu sebelum audio bisa jalan

### Problem: Badge tidak berubah
**Solution:**
- Check apakah context provider ada di App.tsx
- Check console untuk error: `useNotificationCount must be used within NotificationCountProvider`
- Hard refresh
- Check apakah RefreshOrdersSilently dipanggil dengan setNewOrdersCount

### Problem: Toast tidak muncul
**Solution:**
- Check console apakah ada "Showing toast" message
- Pastikan ToastProvider ada di provider stack
- Check apakah previousIds.size > 0 (polling pertama kali tidak show toast)

---

## Debug Commands

Run ini di browser console untuk debug:

```javascript
// 1. Monitor localStorage preferences
console.log('Orders Sound:', localStorage.getItem('orders_sound_enabled'));
console.log('Carts Sound:', localStorage.getItem('abandoned_sound_enabled'));

// 2. Check context values (requires import dari app)
// Buka React DevTools → Components → App tree → NotificationCountProvider
// Lihat state: newOrdersCount, newAbandonedCount

// 3. Manual polling test (jangan dilakukan di production, only for debug)
// Buka console di OrdersPage:
// Refresh manually: tekan Ctrl+Shift+I, ketik di console:
// refreshOrdersSilently(); // jika function accessible

// 4. Clear localStorage (reset preferences)
localStorage.removeItem('orders_sound_enabled');
localStorage.removeItem('abandoned_sound_enabled');
// Refresh page, toggle akan kembali default (true)
```

---

## Success Criteria

✅ Sistem notifikasi berhasil jika:
1. Badge orange muncul di lonceng dengan jumlah items
2. Dropdown menampilkan breakdown pesanan & keranjang
3. Console menunjukkan polling setiap 45s dan 60s
4. Toast muncul saat ada item baru
5. Sound berbunyi berbeda untuk pesanan vs keranjang
6. Preferences persisten setelah refresh
7. Memory usage stabil

---

**Saat semua test berhasil → Sistem notifikasi 100% berfungsi! 🎉**
