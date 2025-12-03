import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type Language = 'id' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('app_language');
        return (saved === 'en' || saved === 'id') ? saved : 'id';
    });

    useEffect(() => {
        localStorage.setItem('app_language', language);
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }
        
        return typeof value === 'string' ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

const translations: Record<Language, any> = {
    id: {
        common: {
            save: 'Simpan',
            cancel: 'Batal',
            delete: 'Hapus',
            edit: 'Edit',
            add: 'Tambah',
            search: 'Cari',
            loading: 'Memuat...',
            success: 'Berhasil',
            error: 'Error',
            confirm: 'Konfirmasi',
            close: 'Tutup',
            view: 'Lihat',
            back: 'Kembali',
            next: 'Lanjut',
            previous: 'Sebelumnya',
            submit: 'Kirim',
            refresh: 'Refresh',
            filter: 'Filter',
            export: 'Export',
            import: 'Import',
            download: 'Download',
            upload: 'Upload',
            actions: 'Aksi',
            status: 'Status',
            date: 'Tanggal',
            total: 'Total',
            subtotal: 'Subtotal',
            name: 'Nama',
            email: 'Email',
            phone: 'Telepon',
            address: 'Alamat',
            description: 'Deskripsi',
            notes: 'Catatan',
            settings: 'Pengaturan',
            logout: 'Keluar',
            login: 'Masuk',
            register: 'Daftar',
            yes: 'Ya',
            no: 'Tidak',
            all: 'Semua',
            active: 'Aktif',
            inactive: 'Tidak Aktif',
        },
        sidebar: {
            dashboard: 'Dashboard',
            orders: 'Pesanan',
            customers: 'Pelanggan',
            forms: 'Formulir',
            abandonedCarts: 'Keranjang Ditinggalkan',
            adReports: 'Laporan Iklan',
            csReports: 'Laporan CS',
            cuanRank: 'Cuan Rank',
            settings: 'Pengaturan',
            myProfile: 'Profil Saya',
            earnings: 'Pendapatan',
        },
        header: {
            notifications: 'Notifikasi',
            profile: 'Profil',
            darkMode: 'Mode Gelap',
            lightMode: 'Mode Terang',
            language: 'Bahasa',
        },
        dashboard: {
            title: 'Dashboard',
            totalRevenue: 'Total Pendapatan',
            totalOrders: 'Total Pesanan',
            totalCustomers: 'Total Pelanggan',
            conversionRate: 'Tingkat Konversi',
            recentOrders: 'Pesanan Terbaru',
            topProducts: 'Produk Terlaris',
            revenueChart: 'Grafik Pendapatan',
            ordersChart: 'Grafik Pesanan',
            viewAll: 'Lihat Semua',
        },
        orders: {
            title: 'Manajemen Pesanan',
            orderNumber: 'No. Pesanan',
            customer: 'Pelanggan',
            product: 'Produk',
            quantity: 'Jumlah',
            price: 'Harga',
            shippingCost: 'Ongkir',
            paymentMethod: 'Metode Pembayaran',
            shippingMethod: 'Metode Pengiriman',
            orderDate: 'Tanggal Pesanan',
            pending: 'Pending',
            processing: 'Diproses',
            shipped: 'Dikirim',
            delivered: 'Terkirim',
            canceled: 'Dibatalkan',
            pendingDeletion: 'Menunggu Penghapusan',
            filterByStatus: 'Filter Status',
            filterByBrand: 'Filter Brand',
            filterByDate: 'Filter Tanggal',
            whatsappConfirm: 'Konfirmasi via WhatsApp',
            deleteOrder: 'Hapus Pesanan',
            confirmDelete: 'Apakah Anda yakin ingin menghapus pesanan ini?',
        },
        customers: {
            title: 'Manajemen Pelanggan',
            addCustomer: 'Tambah Pelanggan',
            editCustomer: 'Edit Pelanggan',
            customerName: 'Nama Pelanggan',
            totalSpent: 'Total Belanja',
            orderCount: 'Jumlah Pesanan',
            lastOrder: 'Pesanan Terakhir',
            customerScore: 'Skor Pelanggan',
            viewOrders: 'Lihat Pesanan',
        },
        forms: {
            title: 'Formulir',
            createForm: 'Buat Formulir',
            editForm: 'Edit Formulir',
            formName: 'Nama Formulir',
            productName: 'Nama Produk',
            productPrice: 'Harga Produk',
            productImage: 'Gambar Produk',
            productDescription: 'Deskripsi Produk',
            viewForm: 'Lihat Formulir',
            copyLink: 'Salin Link',
            linkCopied: 'Link disalin!',
            deleteForm: 'Hapus Formulir',
            duplicateForm: 'Duplikat Formulir',
        },
        abandonedCarts: {
            title: 'Keranjang Ditinggalkan',
            customerInfo: 'Info Pelanggan',
            cartItems: 'Isi Keranjang',
            abandonedAt: 'Ditinggalkan',
            followUp: 'Follow Up',
            contacted: 'Sudah Dihubungi',
            markContacted: 'Tandai Dihubungi',
        },
        settings: {
            title: 'Pengaturan',
            general: 'Umum',
            websiteSettings: 'Pengaturan Website',
            siteName: 'Nama Situs',
            logo: 'Logo',
            userManagement: 'Manajemen Pengguna',
            roleManagement: 'Manajemen Role',
            trackingPixels: 'Tracking Pixels',
            customerService: 'Customer Service',
            messageTemplates: 'Template Pesan',
            brands: 'Brand',
            saveSettings: 'Simpan Pengaturan',
            settingsSaved: 'Pengaturan berhasil disimpan!',
        },
        login: {
            title: 'Masuk ke Dashboard',
            email: 'Email',
            password: 'Kata Sandi',
            loginButton: 'Masuk',
            loggingIn: 'Sedang masuk...',
            invalidCredentials: 'Email atau kata sandi salah',
            forgotPassword: 'Lupa Kata Sandi?',
        },
        toast: {
            success: 'Berhasil!',
            error: 'Terjadi kesalahan',
            warning: 'Peringatan',
            info: 'Informasi',
        },
    },
    en: {
        common: {
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            add: 'Add',
            search: 'Search',
            loading: 'Loading...',
            success: 'Success',
            error: 'Error',
            confirm: 'Confirm',
            close: 'Close',
            view: 'View',
            back: 'Back',
            next: 'Next',
            previous: 'Previous',
            submit: 'Submit',
            refresh: 'Refresh',
            filter: 'Filter',
            export: 'Export',
            import: 'Import',
            download: 'Download',
            upload: 'Upload',
            actions: 'Actions',
            status: 'Status',
            date: 'Date',
            total: 'Total',
            subtotal: 'Subtotal',
            name: 'Name',
            email: 'Email',
            phone: 'Phone',
            address: 'Address',
            description: 'Description',
            notes: 'Notes',
            settings: 'Settings',
            logout: 'Logout',
            login: 'Login',
            register: 'Register',
            yes: 'Yes',
            no: 'No',
            all: 'All',
            active: 'Active',
            inactive: 'Inactive',
        },
        sidebar: {
            dashboard: 'Dashboard',
            orders: 'Orders',
            customers: 'Customers',
            forms: 'Forms',
            abandonedCarts: 'Abandoned Carts',
            adReports: 'Ad Reports',
            csReports: 'CS Reports',
            cuanRank: 'Cuan Rank',
            settings: 'Settings',
            myProfile: 'My Profile',
            earnings: 'Earnings',
        },
        header: {
            notifications: 'Notifications',
            profile: 'Profile',
            darkMode: 'Dark Mode',
            lightMode: 'Light Mode',
            language: 'Language',
        },
        dashboard: {
            title: 'Dashboard',
            totalRevenue: 'Total Revenue',
            totalOrders: 'Total Orders',
            totalCustomers: 'Total Customers',
            conversionRate: 'Conversion Rate',
            recentOrders: 'Recent Orders',
            topProducts: 'Top Products',
            revenueChart: 'Revenue Chart',
            ordersChart: 'Orders Chart',
            viewAll: 'View All',
        },
        orders: {
            title: 'Order Management',
            orderNumber: 'Order No.',
            customer: 'Customer',
            product: 'Product',
            quantity: 'Quantity',
            price: 'Price',
            shippingCost: 'Shipping Cost',
            paymentMethod: 'Payment Method',
            shippingMethod: 'Shipping Method',
            orderDate: 'Order Date',
            pending: 'Pending',
            processing: 'Processing',
            shipped: 'Shipped',
            delivered: 'Delivered',
            canceled: 'Canceled',
            pendingDeletion: 'Pending Deletion',
            filterByStatus: 'Filter by Status',
            filterByBrand: 'Filter by Brand',
            filterByDate: 'Filter by Date',
            whatsappConfirm: 'Confirm via WhatsApp',
            deleteOrder: 'Delete Order',
            confirmDelete: 'Are you sure you want to delete this order?',
        },
        customers: {
            title: 'Customer Management',
            addCustomer: 'Add Customer',
            editCustomer: 'Edit Customer',
            customerName: 'Customer Name',
            totalSpent: 'Total Spent',
            orderCount: 'Order Count',
            lastOrder: 'Last Order',
            customerScore: 'Customer Score',
            viewOrders: 'View Orders',
        },
        forms: {
            title: 'Forms',
            createForm: 'Create Form',
            editForm: 'Edit Form',
            formName: 'Form Name',
            productName: 'Product Name',
            productPrice: 'Product Price',
            productImage: 'Product Image',
            productDescription: 'Product Description',
            viewForm: 'View Form',
            copyLink: 'Copy Link',
            linkCopied: 'Link copied!',
            deleteForm: 'Delete Form',
            duplicateForm: 'Duplicate Form',
        },
        abandonedCarts: {
            title: 'Abandoned Carts',
            customerInfo: 'Customer Info',
            cartItems: 'Cart Items',
            abandonedAt: 'Abandoned At',
            followUp: 'Follow Up',
            contacted: 'Contacted',
            markContacted: 'Mark as Contacted',
        },
        settings: {
            title: 'Settings',
            general: 'General',
            websiteSettings: 'Website Settings',
            siteName: 'Site Name',
            logo: 'Logo',
            domainSettings: 'Domain Settings',
            userManagement: 'User Management',
            roleManagement: 'Role Management',
            trackingPixels: 'Tracking Pixels',
            customerService: 'Customer Service',
            messageTemplates: 'Message Templates',
            brands: 'Brands',
            saveSettings: 'Save Settings',
            settingsSaved: 'Settings saved successfully!',
        },
        login: {
            title: 'Login to Dashboard',
            email: 'Email',
            password: 'Password',
            loginButton: 'Login',
            loggingIn: 'Logging in...',
            invalidCredentials: 'Invalid email or password',
            forgotPassword: 'Forgot Password?',
        },
        toast: {
            success: 'Success!',
            error: 'An error occurred',
            warning: 'Warning',
            info: 'Information',
        },
    },
};
