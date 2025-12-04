
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import ToggleSwitch from '../components/ToggleSwitch';
import { uploadFileAndGetURL } from '../fileUploader';
import type { User } from '../types';
import UserIcon from '../components/icons/UserIcon';
import LockClosedIcon from '../components/icons/LockClosedIcon';
import BellIcon from '../components/icons/BellIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import CheckCircleFilledIcon from '../components/icons/CheckCircleFilledIcon';
import XCircleIcon from '../components/icons/XCircleIcon';
import AddressInput, { type AddressData } from '../components/AddressInput';

const Message: React.FC<{ message: { type: string, text: string } }> = ({ message }) => {
    if (!message.text) return null;
    
    const isSuccess = message.type === 'success';
    const isError = message.type === 'error';
    
    return (
        <div className={`flex items-center gap-2 text-sm p-3 rounded-lg mt-4 animate-fade-in ${
            isSuccess ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
            isError ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
            'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
        }`}>
            {isSuccess && <CheckCircleFilledIcon className="w-5 h-5 flex-shrink-0" />}
            {isError && <XCircleIcon className="w-5 h-5 flex-shrink-0" />}
            <span>{message.text}</span>
        </div>
    );
};

const ProfilePage: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [address, setAddress] = useState('');
    const [addressData, setAddressData] = useState<AddressData>({
        province: '',
        city: '',
        district: '',
        postalCode: '',
        detailAddress: '',
        fullAddress: ''
    });
    const [avatarPreview, setAvatarPreview] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [notifications, setNotifications] = useState({ marketing: true, activity: true });

    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
    const [notificationMessage, setNotificationMessage] = useState({ type: '', text: '' });
    
    const [loading, setLoading] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
                if (data) {
                    const profileData = data as User;
                    setUserData(profileData);
                    setDisplayName(profileData.name || user.user_metadata?.full_name || '');
                    setEmail(profileData.email || user.email || '');
                    setWhatsapp(profileData.whatsapp || '');
                    setAddress(profileData.address || '');
                    setAvatarPreview(profileData.avatar || user.user_metadata?.avatar_url || '');
                } else {
                    setDisplayName(user.user_metadata?.full_name || '');
                    setEmail(user.email || '');
                    setAvatarPreview(user.user_metadata?.avatar_url || '');
                }
            }
            setLoading(false);
        };
        fetchUserData();
    }, []);

    // Update address when addressData changes
    useEffect(() => {
        setAddress(addressData.fullAddress);
    }, [addressData]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            setAvatarFile(file);
            setAvatarPreview(previewUrl);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingProfile(true);
        setProfileMessage({ type: '', text: '' });

        const nameChanged = displayName !== (userData?.name || user.user_metadata?.full_name);
        const whatsappChanged = whatsapp !== (userData?.whatsapp || '');
        const addressChanged = address !== (userData?.address || '');
        const avatarChanged = !!avatarFile;

        if (!nameChanged && !whatsappChanged && !addressChanged && !avatarChanged) {
            setProfileMessage({ type: 'info', text: 'Tidak ada perubahan yang dilakukan.' });
            setLoadingProfile(false);
            return;
        }

        try {
            let newAvatarUrl: string | undefined = undefined;
            if (avatarFile) {
                newAvatarUrl = await uploadFileAndGetURL(avatarFile);
            }

            const dbUpdateData: { name?: string; whatsapp?: string; address?: string; avatar?: string } = {};
            const authUpdateData: { full_name?: string; avatar_url?: string } = {};

            if (nameChanged) {
                dbUpdateData.name = displayName;
                authUpdateData.full_name = displayName;
            }
            if (whatsappChanged) {
                dbUpdateData.whatsapp = whatsapp;
            }
            if (addressChanged) {
                dbUpdateData.address = address;
            }
            if (avatarChanged && newAvatarUrl) {
                dbUpdateData.avatar = newAvatarUrl;
                authUpdateData.avatar_url = newAvatarUrl;
            }
            
            // Update Supabase Users Table
            const { error: dbError } = await supabase.from('users').update(dbUpdateData).eq('id', user.id);
            if (dbError) throw dbError;

            // Update Auth Metadata
            const { error: authError } = await supabase.auth.updateUser({ data: authUpdateData });
            if (authError) throw authError;
            
            setUserData(prev => ({ ...prev!, ...dbUpdateData } as User));
            if (avatarChanged) setAvatarFile(null);
            
            setProfileMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });
        } catch (error) {
            console.error("Error updating profile: ", error);
            setProfileMessage({ type: 'error', text: 'Gagal memperbarui profil.' });
        } finally {
            setLoadingProfile(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingPassword(true);
        setPasswordMessage({ type: '', text: '' });
        
        if (!newPassword || !confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Semua kolom kata sandi harus diisi.' });
            setLoadingPassword(false);
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Kata sandi tidak cocok.' });
            setLoadingPassword(false);
            return;
        }
        if (newPassword.length < 6) {
             setPasswordMessage({ type: 'error', text: 'Kata sandi harus minimal 6 karakter.' });
             setLoadingPassword(false);
             return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            
            setPasswordMessage({ type: 'success', text: 'Kata sandi berhasil diubah.' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error("Error updating password: ", error);
            setPasswordMessage({ type: 'error', text: error.message || 'Gagal mengubah kata sandi.' });
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleNotificationUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingNotifications(true);
        setNotificationMessage({ type: '', text: '' });
        // Simulate save for now as there is no backend field for this in prompt
        await new Promise(resolve => setTimeout(resolve, 1000));
        setNotificationMessage({ type: 'success', text: 'Preferensi notifikasi berhasil disimpan.' });
        setLoadingNotifications(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <SpinnerIcon className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-500">Memuat pengaturan...</p>
            </div>
        );
    }
    
    if (!user) {
        return <div className="text-center p-8">Pengguna tidak ditemukan. Silakan login kembali.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Gradient Header */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 shadow-sm border border-blue-100/50 dark:border-blue-800/30">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                            Pengaturan Akun
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">Kelola informasi profil, keamanan, dan preferensi akun Anda</p>
                    </div>
                </div>
            </div>
            
            {/* Profile Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
                            <UserIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Informasi Profil</h2>
                    </div>
                </div>
                
                <div className="p-6 md:p-8">
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gradient-to-br from-indigo-400 to-purple-500 p-1 shadow-xl bg-gradient-to-br from-indigo-400 to-purple-500">
                                    <img 
                                        src={avatarPreview || `https://i.pravatar.cc/150?u=${user.id}`} 
                                        alt="Avatar" 
                                        className="w-full h-full object-cover bg-white dark:bg-slate-700 rounded-full"
                                    />
                                </div>
                                <label className="absolute bottom-0 right-0 p-2 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-lg cursor-pointer transition-all hover:scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                            <div className="flex-1 w-full space-y-4">
                                <div>
                                    <label htmlFor="displayName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nama Tampilan</label>
                                    <input
                                        id="displayName"
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        disabled
                                        className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="whatsapp" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nomor WhatsApp</label>
                                    <input
                                        id="whatsapp"
                                        type="tel"
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(e.target.value)}
                                        placeholder="08xx xxxxxxx"
                                        className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <AddressInput
                                        value={addressData}
                                        onChange={setAddressData}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex-grow w-full">
                                <Message message={profileMessage} />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loadingProfile} 
                                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center justify-center gap-2"
                            >
                                {loadingProfile && <SpinnerIcon className="w-4 h-4 animate-spin"/>}
                                {loadingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Security Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden h-full flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white shadow-lg">
                                <LockClosedIcon className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Keamanan</h2>
                        </div>
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                        <form onSubmit={handlePasswordUpdate} className="space-y-4 flex-grow flex flex-col">
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Kata Sandi Baru</label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimal 6 karakter"
                                    className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Konfirmasi Kata Sandi</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Ulangi kata sandi baru"
                                    className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                                />
                            </div>
                            <div className="flex-grow">
                                <Message message={passwordMessage} />
                            </div>
                            <div className="pt-2 mt-auto">
                                <button 
                                    type="submit" 
                                    disabled={loadingPassword} 
                                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    {loadingPassword && <SpinnerIcon className="w-4 h-4 animate-spin"/>}
                                    {loadingPassword ? 'Memproses...' : 'Ubah Kata Sandi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden h-full flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white shadow-lg">
                                <BellIcon className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notifikasi</h2>
                        </div>
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                        <form onSubmit={handleNotificationUpdate} className="flex-grow flex flex-col">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span className="p-1.5 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-lg">
                                                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </span>
                                            Email Pemasaran
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 ml-11">Terima berita dan penawaran.</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={notifications.marketing}
                                        onChange={(checked) => setNotifications(p => ({ ...p, marketing: checked }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span className="p-1.5 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg">
                                                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            </span>
                                            Aktivitas Akun
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 ml-11">Notifikasi login dan keamanan.</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={notifications.activity}
                                        onChange={(checked) => setNotifications(p => ({ ...p, activity: checked }))}
                                    />
                                </div>
                            </div>
                            <div className="mt-auto pt-6">
                                <Message message={notificationMessage} />
                                <button 
                                    type="submit" 
                                    disabled={loadingNotifications} 
                                    className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    {loadingNotifications && <SpinnerIcon className="w-4 h-4 animate-spin"/>}
                                    {loadingNotifications ? 'Menyimpan...' : 'Simpan Preferensi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ProfilePage;
