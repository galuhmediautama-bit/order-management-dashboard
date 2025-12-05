
import React, { useState } from 'react';
import { supabase } from '../supabase';
import MailIcon from '../components/icons/MailIcon';
import LockClosedIcon from '../components/icons/LockClosedIcon';
import EyeIcon from '../components/icons/EyeIcon';
import EyeOffIcon from '../components/icons/EyeOffIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import { useLanguage } from '../contexts/LanguageContext';

const LoginPage: React.FC = () => {
    const { t } = useLanguage();
    // Security: No auto-fill credentials
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [selectedRole, setSelectedRole] = useState('Advertiser'); // Default: Advertiser
    const [whatsapp, setWhatsapp] = useState('');
    const [address, setAddress] = useState('');
    
    const [showPassword, setShowPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false); // Toggle Login/Register
    const [isForgotPassword, setIsForgotPassword] = useState(false); // Toggle Forgot Password
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            if (isForgotPassword) {
                // --- LOGIKA RESET PASSWORD ---
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/#/reset-password`,
                });

                if (resetError) throw resetError;

                setSuccessMsg('✅ Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.');
                setEmail('');
                setIsForgotPassword(false);
                return;
            }

            if (isRegistering) {
                // --- LOGIKA PENDAFTARAN ---
                console.log('📝 Register request:', {
                    email,
                    fullName,
                    selectedRole,
                    whatsapp,
                    address
                });

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: selectedRole,
                            phone: whatsapp || null,
                            address: address || null
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

                    // Insert profile into public.users with status 'Tidak Aktif' (requires admin approval)
                    const { error: dbError, data: insertedData } = await supabase.from('users').insert([{
                        id: authData.user.id,
                        email: email,
                        name: fullName || email.split('@')[0],
                        phone: whatsapp || null,
                        address: address || null,
                        role: selectedRole,
                        status: 'Tidak Aktif', // Changed: User must be approved by admin before login
                        lastLogin: null // Changed: No login timestamp until approved
                    }]);

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
                        setSuccessMsg('✅ Akun berhasil dibuat! Status: MENUNGGU APPROVAL dari Admin. Anda akan menerima notifikasi email setelah akun Anda disetujui dan dapat login.');
                        setIsRegistering(false);
                        setEmail('');
                        setPassword('');
                        setFullName('');
                        setWhatsapp('');
                        setAddress('');
                        setSelectedRole('Advertiser');
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
        <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col">
            {/* Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">OrderDash</span>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex pt-16">
                {/* Left Section - Branding */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex-col justify-between p-16 relative overflow-hidden">
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

                    {/* Testimonial Card */}
                    <div className="relative z-10">
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

                {/* Right Section - Auth Form */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 py-12">
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
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                                        Alamat Lengkap
                                    </label>
                                    <textarea
                                        placeholder="Jl. ..., RT/RW ..., Kelurahan ..., Kecamatan ..."
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 resize-none"
                                    />
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
                                        className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                    />
                                </div>
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
                                {isRegistering && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Minimal 6 karakter, kombinasi huruf dan angka</p>}
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
                                {loading && <SpinnerIcon className="h-5 w-5 animate-spin"/>}
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
