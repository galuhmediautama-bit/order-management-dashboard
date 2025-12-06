import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import LockClosedIcon from '../components/icons/LockClosedIcon';
import EyeIcon from '../components/icons/EyeIcon';
import EyeOffIcon from '../components/icons/EyeOffIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);

    useEffect(() => {
        // Listen for auth state changes to catch recovery session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Auth state change:', { event, hasSession: !!session });
            
            if (event === 'PASSWORD_RECOVERY') {
                console.log('✅ Password recovery event detected');
                setIsValidSession(true);
                setError('');
            } else if (session && event === 'SIGNED_IN') {
                console.log('✅ User signed in (recovery flow)');
                setIsValidSession(true);
                setError('');
            }
        });

        // Also check current session on mount
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            console.log('🔍 Initial session check:', { hasSession: !!session });
            
            if (session) {
                setIsValidSession(true);
                setError('');
            } else {
                // Give auth state change listener time to fire
                setTimeout(() => {
                    supabase.auth.getSession().then(({ data: { session: laterSession } }) => {
                        if (!laterSession) {
                            setError('⛔ Link reset password tidak valid atau sudah kadaluarsa. Silakan request reset password lagi.');
                        }
                    });
                }, 1000);
            }
        };
        
        checkSession();

        // Cleanup subscription
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        // Validation
        if (newPassword.length < 6) {
            setError('❌ Password minimal 6 karakter');
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('❌ Password dan konfirmasi password tidak cocok');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setSuccessMsg('✅ Password berhasil diubah! Anda akan dialihkan ke halaman login...');
            
            // Logout and redirect to login after 2 seconds
            setTimeout(async () => {
                await supabase.auth.signOut();
                navigate('/login');
            }, 2000);

        } catch (err: any) {
            console.error('Reset password error:', err);
            setError(`❌ Gagal mengubah password: ${err.message || 'Terjadi kesalahan'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 space-y-6 border border-slate-200 dark:border-slate-700">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg mb-4">
                            <LockClosedIcon className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Reset Password
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Masukkan password baru Anda
                        </p>
                    </div>

                    {/* Alert Messages */}
                    {successMsg && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/50 rounded-xl">
                            <p className="text-emerald-800 dark:text-emerald-400 text-sm font-medium text-center">{successMsg}</p>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 rounded-xl">
                            <p className="text-red-800 dark:text-red-400 text-sm font-medium text-center">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    {isValidSession && !successMsg && (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                                    Password Baru
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all"
                                        placeholder="Minimal 6 karakter"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                                    Konfirmasi Password Baru
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all"
                                        placeholder="Ulangi password baru"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Password Strength Indicator */}
                            {newPassword && (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        {[...Array(4)].map((_, i) => {
                                            const strength = newPassword.length < 6 ? 0 :
                                                           newPassword.length < 8 ? 1 :
                                                           newPassword.length < 10 ? 2 :
                                                           /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 4 : 3;
                                            return (
                                                <div
                                                    key={i}
                                                    className={`h-2 flex-1 rounded-full transition-colors ${
                                                        i < strength
                                                            ? strength === 1 ? 'bg-red-500'
                                                            : strength === 2 ? 'bg-yellow-500'
                                                            : strength === 3 ? 'bg-blue-500'
                                                            : 'bg-green-500'
                                                            : 'bg-slate-200 dark:bg-slate-600'
                                                    }`}
                                                />
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {newPassword.length < 6 ? '⚠️ Terlalu pendek' :
                                         newPassword.length < 8 ? '🟡 Lemah' :
                                         newPassword.length < 10 ? '🟠 Sedang' :
                                         /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? '🟢 Sangat Kuat' : '🔵 Kuat'}
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !newPassword || !confirmPassword}
                                className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <SpinnerIcon className="w-5 h-5" />
                                        <span>Mengubah Password...</span>
                                    </>
                                ) : (
                                    <>
                                        <LockClosedIcon className="w-5 h-5" />
                                        <span>Ubah Password</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Back to Login */}
                    <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                        >
                            ← Kembali ke Login
                        </button>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        🔒 Link reset password hanya valid untuk 1 jam dan hanya bisa digunakan sekali
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
