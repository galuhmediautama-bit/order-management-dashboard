
import React, { useState, useEffect } from 'react';
import { supabase } from '../firebase';
import MailIcon from '../components/icons/MailIcon';
import LockClosedIcon from '../components/icons/LockClosedIcon';
import EyeIcon from '../components/icons/EyeIcon';
import EyeOffIcon from '../components/icons/EyeOffIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { createNotification } from '../services/notificationService';

// API Base URL for Indonesia regions data
const API_BASE = 'https://ibnux.github.io/data-indonesia';
const POSTAL_API_PRIMARY = 'https://kodepos.vercel.app/search';
const POSTAL_API_FALLBACK = 'https://api.cahyadsn.com/cari';

interface ApiProvince { id: string; nama: string; }
interface ApiCity { id: string; nama: string; }
interface ApiDistrict { id: string; nama: string; }
interface ApiVillage { id: string; nama: string; }

const LoginPage: React.FC = () => {
    const { t } = useLanguage();
    // Security: No auto-fill credentials
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [selectedRole, setSelectedRole] = useState('Advertiser'); // Default: Advertiser
    const [whatsapp, setWhatsapp] = useState('');
    const [detailAddress, setDetailAddress] = useState('');

    // Address dropdown states
    const [provinces, setProvinces] = useState<ApiProvince[]>([]);
    const [cities, setCities] = useState<ApiCity[]>([]);
    const [districts, setDistricts] = useState<ApiDistrict[]>([]);
    const [villages, setVillages] = useState<ApiVillage[]>([]);

    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedProvinceId, setSelectedProvinceId] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCityId, setSelectedCityId] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedDistrictId, setSelectedDistrictId] = useState('');
    const [selectedVillage, setSelectedVillage] = useState('');

    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingVillages, setLoadingVillages] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false); // Toggle Login/Register
    const [isForgotPassword, setIsForgotPassword] = useState(false); // Toggle Forgot Password
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // UX Enhancement states
    const [isAddressExpanded, setIsAddressExpanded] = useState(false);
    const [userCount, setUserCount] = useState(0);

    // Email validation
    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Password strength checker
    const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
        if (!pwd) return { level: 0, label: '', color: '' };
        let score = 0;
        if (pwd.length >= 6) score++;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 2) return { level: 1, label: 'Lemah', color: 'bg-red-500' };
        if (score <= 3) return { level: 2, label: 'Sedang', color: 'bg-yellow-500' };
        return { level: 3, label: 'Kuat', color: 'bg-green-500' };
    };

    const passwordStrength = getPasswordStrength(password);

    // Animated counter effect
    useEffect(() => {
        const targetCount = 1247;
        const duration = 2000;
        const steps = 60;
        const increment = targetCount / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= targetCount) {
                setUserCount(targetCount);
                clearInterval(timer);
            } else {
                setUserCount(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, []);

    // Helper functions
    const sortByName = <T extends { nama: string }>(data: T[]): T[] => {
        return [...data].sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
    };

    const formatName = (name: string) => {
        return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Build full address string
    const getFullAddress = () => {
        const parts = [];
        if (detailAddress) parts.push(detailAddress);
        if (selectedVillage) parts.push(selectedVillage);
        if (selectedDistrict) parts.push(selectedDistrict);
        if (selectedCity) parts.push(selectedCity);
        if (selectedProvince) parts.push(selectedProvince);
        return parts.join(', ');
    };

    // Fetch provinces on component mount when registering
    useEffect(() => {
        if (!isRegistering) return;
        const fetchProvinces = async () => {
            setLoadingProvinces(true);
            try {
                const res = await fetch(`${API_BASE}/provinsi.json`);
                const data: ApiProvince[] = await res.json();
                setProvinces(sortByName(data));
            } catch (err) {
                console.error('Error fetching provinces:', err);
            } finally {
                setLoadingProvinces(false);
            }
        };
        fetchProvinces();
    }, [isRegistering]);

    // Fetch cities when province changes
    useEffect(() => {
        if (!selectedProvinceId) {
            setCities([]);
            setSelectedCity('');
            setSelectedCityId('');
            return;
        }
        const fetchCities = async () => {
            setLoadingCities(true);
            try {
                const res = await fetch(`${API_BASE}/kabupaten/${selectedProvinceId}.json`);
                const data: ApiCity[] = await res.json();
                setCities(sortByName(data));
            } catch (err) {
                console.error('Error fetching cities:', err);
                setCities([]);
            } finally {
                setLoadingCities(false);
            }
        };
        fetchCities();
    }, [selectedProvinceId]);

    // Fetch districts when city changes
    useEffect(() => {
        if (!selectedCityId) {
            setDistricts([]);
            setSelectedDistrict('');
            setSelectedDistrictId('');
            return;
        }
        const fetchDistricts = async () => {
            setLoadingDistricts(true);
            try {
                const res = await fetch(`${API_BASE}/kecamatan/${selectedCityId}.json`);
                const data: ApiDistrict[] = await res.json();
                setDistricts(sortByName(data));
            } catch (err) {
                console.error('Error fetching districts:', err);
                setDistricts([]);
            } finally {
                setLoadingDistricts(false);
            }
        };
        fetchDistricts();
    }, [selectedCityId]);

    // Fetch villages when district changes
    useEffect(() => {
        if (!selectedDistrictId) {
            setVillages([]);
            setSelectedVillage('');
            return;
        }
        const fetchVillages = async () => {
            setLoadingVillages(true);
            try {
                const res = await fetch(`${API_BASE}/kelurahan/${selectedDistrictId}.json`);
                const data: ApiVillage[] = await res.json();
                setVillages(sortByName(data));
            } catch (err) {
                console.error('Error fetching villages:', err);
                setVillages([]);
            } finally {
                setLoadingVillages(false);
            }
        };
        fetchVillages();
    }, [selectedDistrictId]);

    // Handle province change
    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provinceId = e.target.value;
        const province = provinces.find(p => p.id === provinceId);
        setSelectedProvinceId(provinceId);
        setSelectedProvince(province ? formatName(province.nama) : '');
        // Reset dependent fields
        setSelectedCityId('');
        setSelectedCity('');
        setSelectedDistrictId('');
        setSelectedDistrict('');
        setSelectedVillage('');
    };

    // Handle city change
    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cityId = e.target.value;
        const city = cities.find(c => c.id === cityId);
        setSelectedCityId(cityId);
        setSelectedCity(city ? formatName(city.nama) : '');
        // Reset dependent fields
        setSelectedDistrictId('');
        setSelectedDistrict('');
        setSelectedVillage('');
    };

    // Handle district change
    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const districtId = e.target.value;
        const district = districts.find(d => d.id === districtId);
        setSelectedDistrictId(districtId);
        setSelectedDistrict(district ? formatName(district.nama) : '');
        // Reset dependent fields
        setSelectedVillage('');
    };

    // Handle village change
    const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const villageId = e.target.value;
        const village = villages.find(v => v.id === villageId);
        const villageName = village ? formatName(village.nama) : '';
        setSelectedVillage(villageName);
    };



    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            if (isForgotPassword) {
                // --- LOGIKA RESET PASSWORD ---
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `https://form.cuanmax.digital/#/reset-password`,
                });

                if (resetError) throw resetError;

                setSuccessMsg('✅ Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.');
                setEmail('');
                setIsForgotPassword(false);
                return;
            }

            if (isRegistering) {
                // --- LOGIKA PENDAFTARAN ---
                const fullAddress = getFullAddress();
                console.log('📝 Register request:', {
                    email,
                    fullName,
                    selectedRole,
                    whatsapp,
                    address: fullAddress,
                    province: selectedProvince,
                    city: selectedCity,
                    district: selectedDistrict,
                    village: selectedVillage,
                    detailAddress
                });

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: selectedRole,
                            phone: whatsapp || null,
                            address: fullAddress || null
                        }
                    }
                });

                if (authError) throw authError;

                if (authData && authData.user) {
                    console.log('✅ Auth user created:', {
                        userId: authData.user.id,
                        email: authData.user.email,
                        metadata: authData.user.user_metadata,
                        metadata_stringified: JSON.stringify(authData.user.user_metadata, null, 2)
                    });

                    // If email confirmation is required, supabase may return no session
                    if (!authData.session && authData.user.identities?.length) {
                        setSuccessMsg('Akun dibuat! Silakan cek email Anda untuk konfirmasi sebelum masuk.');
                        setIsRegistering(false);
                        return;
                    }

                    if (authData.user) {
                        // Insert profile into public.users with status 'Tidak Aktif' (requires admin approval)
                        const newUserPayload: any = {
                            id: authData.user.id,
                            email: email,
                            name: fullName || email.split('@')[0],
                            phone: whatsapp || null,
                            address: fullAddress || null,
                            role: selectedRole,
                            status: 'Tidak Aktif', // User must be approved by admin before active
                            lastLogin: null
                        };

                        const { error: dbError, data: insertedData } = await supabase.from('users').insert([newUserPayload]);

                        if (dbError) {
                            console.error('❌ Gagal membuat profil user:', { error: dbError, selectedRole });
                            setError(`Akun Auth dibuat, tapi gagal simpan profil: ${dbError.message || JSON.stringify(dbError)}`);
                        } else {
                            console.log('✅ User profile created successfully:', {
                                userId: authData.user.id,
                                email: email,
                                role: selectedRole,
                                data: insertedData
                            });

                            // Kirim notifikasi ke Admin/Super Admin untuk approval
                            const { data: admins, error: adminsError } = await supabase
                                .from('users')
                                .select('id')
                                .in('role', ['Admin', 'Super Admin'])
                                .eq('status', 'Aktif');

                            if (!adminsError && admins && admins.length > 0) {
                                for (const admin of admins) {
                                    await createNotification(admin.id, {
                                        type: 'SYSTEM_ALERT',
                                        title: 'Pengguna baru menunggu approval',
                                        message: `${newUserPayload.name} (${newUserPayload.email}) memerlukan approval`,
                                        metadata: {
                                            userId: newUserPayload.id,
                                            email: newUserPayload.email,
                                            name: newUserPayload.name,
                                        },
                                    });
                                }
                            }

                            setSuccessMsg('✅ Akun berhasil dibuat! Status: MENUNGGU APPROVAL dari Admin. Anda akan menerima notifikasi email setelah akun Anda disetujui dan dapat login.');
                            setIsRegistering(false);
                            setEmail('');
                            setPassword('');
                            setFullName('');
                            setWhatsapp('');
                            setDetailAddress('');
                            setSelectedProvince('');
                            setSelectedProvinceId('');
                            setSelectedCity('');
                            setSelectedCityId('');
                            setSelectedDistrict('');
                            setSelectedDistrictId('');
                            setSelectedVillage('');
                            setSelectedRole('Advertiser');
                        }
                    }
                }
            } else {
                // --- LOGIKA LOGIN ---
                const { error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) throw error;
                // onAuthStateChanged di App.tsx akan menangani redirect otomatis
            }
        } catch (err: any) {
            console.error("Auth error details:", err);

            let errorMessage = err.message || 'Gagal memproses permintaan.';

            if (errorMessage.includes('Invalid login credentials')) {
                setError('Email atau kata sandi salah.');
            } else if (errorMessage.includes('User already registered')) {
                setError('Email sudah terdaftar. Silakan masuk.');
            } else if (errorMessage.includes('Email not confirmed')) {
                setError('Email belum dikonfirmasi. Cek inbox Anda atau matikan "Confirm Email" di dashboard Supabase.');
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex">
            {/* Left Section - Branding (Fixed/Static) */}
            <div className="hidden lg:flex lg:w-1/2 fixed left-0 top-0 bottom-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex-col justify-between p-16 overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

                <div className="relative z-10 space-y-8">
                    <div>
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                            Kelola Pesanan dengan Mudah
                        </h1>
                        <p className="text-lg text-indigo-100 mb-10 max-w-lg leading-relaxed">
                            Platform all-in-one yang dirancang khusus untuk mengelola pesanan, pelanggan, dan penghasilan tim Anda secara real-time.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                        {[
                            { icon: '📊', text: 'Dashboard analytics real-time' },
                            { icon: '📋', text: 'Manajemen pesanan terintegrasi' },
                            { icon: '💰', text: 'Laporan keuangan otomatis' },
                            { icon: '👥', text: 'Kolaborasi tim yang mulus' }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 text-white">
                                <span className="text-2xl">{item.icon}</span>
                                <span className="text-lg font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Testimonial Card + User Counter */}
                <div className="relative z-10 space-y-6">
                    {/* Animated User Counter */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {['👨', '👩', '👨‍💼', '👩‍💼'].map((emoji, i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl border-2 border-white/30">
                                    {emoji}
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{userCount.toLocaleString()}+</p>
                            <p className="text-indigo-200 text-sm">Pengguna aktif</p>
                        </div>
                    </div>

                    {/* Testimonial */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                        <p className="text-white italic mb-4 text-lg">"Platform ini mengubah cara kami mengelola bisnis. Efisiensi meningkat 40% dalam sebulan pertama."</p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                                BD
                            </div>
                            <div>
                                <p className="text-white font-semibold">Budi Darma</p>
                                <p className="text-indigo-200 text-sm">CEO, Tokoshop Indonesia</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Section - Auth Form (Scrollable) */}
            <div className="w-full lg:w-1/2 lg:ml-[50%] min-h-screen flex flex-col justify-center px-6 sm:px-12 py-12 overflow-y-auto">
                <div className="w-full max-w-sm mx-auto">
                    {/* Form Header */}
                    <div className="mb-10">
                        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
                            {isForgotPassword ? '🔑 Reset Password' : (isRegistering ? '🎯 Daftar Sekarang' : '👋 Selamat Datang')}
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            {isForgotPassword ? 'Masukkan email Anda untuk reset password' : (isRegistering ? 'Bergabunglah dengan ribuan pengguna kami' : 'Masuk ke dashboard Anda')}
                        </p>
                    </div>

                    {/* Alert Messages */}
                    {successMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/50 rounded-xl flex gap-3">
                            <span className="text-2xl">✅</span>
                            <p className="text-emerald-800 dark:text-emerald-400 text-sm font-medium">{successMsg}</p>
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 rounded-xl flex gap-3">
                            <span className="text-2xl">❌</span>
                            <p className="text-red-800 dark:text-red-400 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Auth Form */}
                    <form onSubmit={handleAuth} className="space-y-5">
                        {!isForgotPassword && isRegistering && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    placeholder="Masukkan nama Anda"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                />
                            </div>
                        )}

                        {!isForgotPassword && isRegistering && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                                    Peran Anda
                                </label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                >
                                    <option value="Advertiser">🎯 Advertiser (Penjual Produk)</option>
                                    <option value="Customer service">👥 Customer Service (Layanan Pelanggan)</option>
                                </select>
                            </div>
                        )}

                        {!isForgotPassword && isRegistering && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                                    Nomor WhatsApp
                                </label>
                                <input
                                    type="tel"
                                    placeholder="08xx xxxxxxx"
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                />
                            </div>
                        )}

                        {!isForgotPassword && isRegistering && (
                            <div>
                                {/* Collapsible Address Section */}
                                <button
                                    type="button"
                                    onClick={() => setIsAddressExpanded(!isAddressExpanded)}
                                    className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition duration-200"
                                >
                                    <span className="flex items-center gap-2 font-semibold text-sm">
                                        <span>📍</span> Alamat {selectedProvince && `- ${selectedProvince}`}
                                    </span>
                                    <span className={`transform transition-transform duration-200 ${isAddressExpanded ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>

                                {isAddressExpanded && (
                                    <div className="mt-3 space-y-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        {/* Province Dropdown */}
                                        <div className="relative">
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Provinsi</label>
                                            <select
                                                value={selectedProvinceId}
                                                onChange={handleProvinceChange}
                                                disabled={loadingProvinces}
                                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                            >
                                                <option value="">{loadingProvinces ? '⏳ Memuat...' : '-- Pilih Provinsi --'}</option>
                                                {provinces.map((p) => (
                                                    <option key={p.id} value={p.id}>{formatName(p.nama)}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* City Dropdown */}
                                        <div className="relative">
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Kota/Kabupaten</label>
                                            <select
                                                value={selectedCityId}
                                                onChange={handleCityChange}
                                                disabled={!selectedProvinceId || loadingCities}
                                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="">{loadingCities ? '⏳ Memuat...' : '-- Pilih Kota --'}</option>
                                                {cities.map((c) => (
                                                    <option key={c.id} value={c.id}>{formatName(c.nama)}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* District Dropdown */}
                                        <div className="relative">
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Kecamatan</label>
                                            <select
                                                value={selectedDistrictId}
                                                onChange={handleDistrictChange}
                                                disabled={!selectedCityId || loadingDistricts}
                                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="">{loadingDistricts ? '⏳ Memuat...' : '-- Pilih Kecamatan --'}</option>
                                                {districts.map((d) => (
                                                    <option key={d.id} value={d.id}>{formatName(d.nama)}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Village Dropdown */}
                                        <div className="relative">
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Kelurahan/Desa</label>
                                            <select
                                                value={villages.find(v => formatName(v.nama) === selectedVillage)?.id || ''}
                                                onChange={handleVillageChange}
                                                disabled={!selectedDistrictId || loadingVillages}
                                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="">{loadingVillages ? '⏳ Memuat...' : '-- Pilih Kelurahan --'}</option>
                                                {villages.map((v) => (
                                                    <option key={v.id} value={v.id}>{formatName(v.nama)}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Detail Address */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Alamat Detail</label>
                                            <textarea
                                                placeholder="Jl. ..., RT/RW ..., No. Rumah ..."
                                                value={detailAddress}
                                                onChange={(e) => setDetailAddress(e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 resize-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                                Email
                            </label>
                            <div className="relative">
                                <MailIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="nama@email.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck="false"
                                    className={`w-full pl-12 pr-12 py-3 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ${email && !isValidEmail(email) ? 'border-red-300 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                />
                                {/* Email validation indicator */}
                                {email && (
                                    <span className={`absolute right-4 top-3.5 text-lg ${isValidEmail(email) ? 'text-green-500' : 'text-red-500'}`}>
                                        {isValidEmail(email) ? '✓' : '✗'}
                                    </span>
                                )}
                            </div>
                            {email && !isValidEmail(email) && (
                                <p className="text-xs text-red-500 mt-1">Format email tidak valid</p>
                            )}
                        </div>

                        {!isForgotPassword && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                                    Kata Sandi
                                </label>
                                <div className="relative">
                                    <LockClosedIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        spellCheck="false"
                                        className="w-full pl-12 pr-12 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                                    >
                                        {showPassword ? (
                                            <EyeOffIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {isRegistering && password && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${passwordStrength.level >= level
                                                            ? passwordStrength.color
                                                            : 'bg-slate-200 dark:bg-slate-700'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className={`text-xs ${passwordStrength.level === 1 ? 'text-red-500' :
                                                passwordStrength.level === 2 ? 'text-yellow-600' :
                                                    'text-green-500'
                                            }`}>
                                            Kekuatan: {passwordStrength.label}
                                        </p>
                                    </div>
                                )}

                                {isRegistering && !password && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                        Minimal 6 karakter, kombinasi huruf dan angka
                                    </p>
                                )}
                            </div>
                        )}

                        {!isRegistering && !isForgotPassword && (
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-slate-600 dark:text-slate-400">Ingat saya</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsForgotPassword(true);
                                        setError('');
                                        setSuccessMsg('');
                                    }}
                                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                                >
                                    Lupa kata sandi?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                            {loading && <SpinnerIcon className="h-5 w-5 animate-spin" />}
                            {loading ? 'Memproses...' : (isForgotPassword ? '📧 Kirim Link Reset' : (isRegistering ? '🚀 Daftar Sekarang' : '✨ Masuk'))}
                        </button>
                    </form>

                    {/* Auth Toggle */}
                    {isForgotPassword ? (
                        <div className="mt-8 text-center">
                            <p className="text-slate-600 dark:text-slate-400">
                                Sudah ingat password?
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsForgotPassword(false);
                                        setError('');
                                        setSuccessMsg('');
                                    }}
                                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition ml-1"
                                >
                                    Kembali ke Login
                                </button>
                            </p>
                        </div>
                    ) : (
                        <div className="mt-8 text-center">
                            <p className="text-slate-600 dark:text-slate-400">
                                {isRegistering ? 'Sudah punya akun? ' : 'Belum punya akun? '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRegistering(!isRegistering);
                                        setError('');
                                        setSuccessMsg('');
                                    }}
                                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                                >
                                    {isRegistering ? 'Masuk di sini' : 'Daftar di sini'}
                                </button>
                            </p>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="mt-10 p-5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl">
                        <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
                            <span className="font-semibold">ℹ️ Info:</span> Pengguna baru harus dikonfirmasi oleh admin sebelum dapat mengakses dashboard. Anda akan menerima notifikasi email saat akun disetujui.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
