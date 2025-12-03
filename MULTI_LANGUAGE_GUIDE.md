# 🌍 Multi-Language Guide (Panduan Multi-Bahasa)

## Fitur Multi-Bahasa Aktif! ✅

Aplikasi Order Management Dashboard sekarang mendukung **2 bahasa**:
- 🇮🇩 **Bahasa Indonesia** (Default)
- 🇬🇧 **English**

---

## 📌 Cara Menggunakan

### 1. **Mengganti Bahasa**
- Klik ikon **Globe (🌐)** di bagian atas kanan header
- Toggle akan menampilkan bahasa aktif (ID/EN)
- Klik untuk beralih antara Bahasa Indonesia dan English
- Preferensi bahasa disimpan otomatis di `localStorage`

### 2. **Untuk Developer: Menggunakan Translation di Component**

#### Import Context
```tsx
import { useLanguage } from '../contexts/LanguageContext';
```

#### Gunakan Hook dalam Component
```tsx
const MyComponent: React.FC = () => {
    const { t, language, setLanguage } = useLanguage();
    
    return (
        <div>
            <h1>{t('dashboard.title')}</h1>
            <p>{t('common.loading')}</p>
            <button onClick={() => setLanguage('en')}>
                Switch to English
            </button>
        </div>
    );
};
```

#### Translation Keys
Struktur translation tersedia di `contexts/LanguageContext.tsx`:

```typescript
// Contoh penggunaan:
t('common.save')              // "Simpan" / "Save"
t('sidebar.dashboard')        // "Dashboard"
t('orders.title')             // "Manajemen Pesanan" / "Order Management"
t('settings.websiteSettings') // "Pengaturan Website" / "Website Settings"
```

---

## 🗂️ Struktur Translation

### **Common** (Umum)
```typescript
t('common.save')       // Simpan / Save
t('common.cancel')     // Batal / Cancel
t('common.delete')     // Hapus / Delete
t('common.edit')       // Edit
t('common.loading')    // Memuat... / Loading...
t('common.search')     // Cari / Search
```

### **Sidebar** (Menu Navigasi)
```typescript
t('sidebar.dashboard')       // Dashboard
t('sidebar.orders')          // Pesanan / Orders
t('sidebar.customers')       // Pelanggan / Customers
t('sidebar.forms')           // Formulir / Forms
t('sidebar.settings')        // Pengaturan / Settings
```

### **Header**
```typescript
t('header.notifications')    // Notifikasi / Notifications
t('header.profile')          // Profil / Profile
t('header.language')         // Bahasa / Language
```

### **Dashboard**
```typescript
t('dashboard.title')         // Dashboard
t('dashboard.totalRevenue')  // Total Pendapatan / Total Revenue
t('dashboard.totalOrders')   // Total Pesanan / Total Orders
```

### **Orders** (Pesanan)
```typescript
t('orders.title')            // Manajemen Pesanan / Order Management
t('orders.orderNumber')      // No. Pesanan / Order No.
t('orders.customer')         // Pelanggan / Customer
t('orders.pending')          // Pending
t('orders.processing')       // Diproses / Processing
t('orders.shipped')          // Dikirim / Shipped
```

### **Login**
```typescript
t('login.title')             // Masuk ke Dashboard / Login to Dashboard
t('login.email')             // Email
t('login.password')          // Kata Sandi / Password
t('login.loginButton')       // Masuk / Login
```

---

## ➕ Menambahkan Translation Baru

Edit file `contexts/LanguageContext.tsx`:

```typescript
const translations: Record<Language, any> = {
    id: {
        myNewSection: {
            title: 'Judul Baru',
            description: 'Deskripsi baru',
        }
    },
    en: {
        myNewSection: {
            title: 'New Title',
            description: 'New description',
        }
    }
};
```

Gunakan di component:
```tsx
{t('myNewSection.title')}
{t('myNewSection.description')}
```

---

## 🔧 Konfigurasi

### Default Language
Bahasa default adalah **Bahasa Indonesia** (`id`). 

Untuk mengubah default, edit di `contexts/LanguageContext.tsx`:
```typescript
const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'en' || saved === 'id') ? saved : 'en'; // Ubah 'id' ke 'en'
});
```

### Menambah Bahasa Baru
1. Update type `Language` di `contexts/LanguageContext.tsx`:
```typescript
export type Language = 'id' | 'en' | 'zh' | 'ja'; // Tambah bahasa baru
```

2. Tambahkan translations:
```typescript
const translations: Record<Language, any> = {
    id: { /* ... */ },
    en: { /* ... */ },
    zh: { /* ... bahasa Mandarin */ },
    ja: { /* ... bahasa Jepang */ }
};
```

3. Update `LanguageToggle` component untuk menampilkan lebih dari 2 bahasa (gunakan dropdown).

---

## 📦 Components yang Sudah Terintegrasi

✅ **Header** - Tombol toggle bahasa  
✅ **Sidebar** - Import context (siap digunakan)  
✅ **LoginPage** - Import context (siap digunakan)  
✅ **App.tsx** - LanguageProvider wrapper  

### Component Lain (Belum Terimplementasi Penuh)
Untuk mengimplementasikan translation di component lain:
1. Import `useLanguage` hook
2. Gunakan `t()` function untuk semua text yang perlu diterjemahkan
3. Ganti hardcoded text dengan translation keys

**Contoh:**
```tsx
// Sebelum
<h1>Manajemen Pesanan</h1>

// Sesudah
const { t } = useLanguage();
<h1>{t('orders.title')}</h1>
```

---

## 🎯 Roadmap

- [ ] Implementasi translation lengkap di semua halaman
- [ ] Dynamic form labels berdasarkan bahasa
- [ ] Date/time formatting per locale
- [ ] Currency formatting per locale
- [ ] RTL support untuk bahasa Arab
- [ ] Auto-detect browser language

---

## 🐛 Troubleshooting

### **Translation tidak muncul / menampilkan key**
- Periksa apakah key ada di `translations` object
- Gunakan console: `console.log(t('your.key'))`
- Pastikan component sudah import `useLanguage`

### **Bahasa tidak tersimpan setelah refresh**
- Cek localStorage: `localStorage.getItem('app_language')`
- Clear cache browser jika masalah persist

### **Error: useLanguage must be used within LanguageProvider**
- Pastikan component berada di dalam `<LanguageProvider>` di `App.tsx`

---

## 📞 Support

Untuk pertanyaan atau masalah terkait multi-bahasa:
1. Buka issue di repository
2. Sertakan screenshot dan translation key yang bermasalah
3. Jelaskan bahasa yang digunakan dan expected behavior

---

**Dibuat dengan ❤️ untuk Order Management Dashboard**
