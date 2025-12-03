
import React, { useState, useMemo, useEffect } from 'react';
import type { CSAgent, User } from '../types';
import PlusIcon from '../components/icons/PlusIcon';
import SearchIcon from '../components/icons/SearchIcon';
import XIcon from '../components/icons/XIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import { supabase } from '../firebase';
import { uploadFileAndGetURL } from '../fileUploader';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';


const getStatusBadgeClass = (status: CSAgent['status']) => {
    switch (status) {
        case 'Aktif': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
        case 'Cuti': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
        case 'Tidak Aktif': return 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
        default: return '';
    }
}

const AgentModal: React.FC<{
    agent: CSAgent | null;
    availableUsers: User[];
    onClose: () => void;
    onSave: (agent: CSAgent, file: File | null) => void;
}> = ({ agent, availableUsers, onClose, onSave }) => {
    const [formData, setFormData] = useState<CSAgent>(
        agent || { id: '', name: '', email: '', phone: '', status: 'Aktif', ordersHandled: 0, closingRate: 0, totalOmzet: 0, avatar: '' }
    );
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState(agent?.avatar || '');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const { showToast } = useToast();

    const isEditing = !!agent?.id;

     useEffect(() => {
        return () => {
            if (avatarPreview && avatarPreview.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    useEffect(() => {
        if (!isEditing && selectedUserId) {
            const selectedUser = availableUsers.find(u => u.id === selectedUserId);
            if (selectedUser) {
                setFormData(prev => ({
                    ...prev,
                    id: selectedUser.id,
                    name: selectedUser.name,
                    email: selectedUser.email,
                    avatar: prev.avatar || `https://i.pravatar.cc/150?u=${selectedUser.name}`
                }));
            }
        }
    }, [selectedUserId, isEditing, availableUsers]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            if (avatarPreview && avatarPreview.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreview);
            }
            setAvatarFile(file);
            setAvatarPreview(previewUrl);
        }
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing && !selectedUserId) {
            showToast("Pilih pengguna untuk dijadikan agen CS.", 'warning');
            return;
        }
        if (formData.name && formData.email) {
            onSave(formData, avatarFile);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                <form onSubmit={handleSave}>
                    <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Edit Agen CS' : 'Tambah Agen CS Baru'}</h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"><XIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="flex items-center space-x-4">
                             <img src={avatarPreview || `https://i.pravatar.cc/150?u=${formData.name}`} alt="Avatar" className="w-20 h-20 rounded-full object-cover"/>
                             <label className="cursor-pointer px-4 py-2 bg-slate-200 dark:bg-slate-600 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">
                                <span>Unggah Foto</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                        {!isEditing && (
                             <div>
                                <label className="text-sm text-slate-700 dark:text-slate-300">Pilih Pengguna (Peran CS)*</label>
                                <select
                                    value={selectedUserId}
                                    onChange={e => setSelectedUserId(e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600"
                                    required
                                >
                                    <option value="" disabled>Pilih dari pengguna yang tersedia</option>
                                    {availableUsers.map(user => (
                                        <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div><label className="text-sm text-slate-700 dark:text-slate-300">Nama Lengkap</label><input type="text" name="name" value={formData.name || ''} className="w-full mt-1 p-2 border rounded-md bg-slate-200 dark:bg-slate-600 dark:border-slate-600 cursor-not-allowed" readOnly /></div>
                        <div><label className="text-sm text-slate-700 dark:text-slate-300">Email</label><input type="email" name="email" value={formData.email || ''} className="w-full mt-1 p-2 border rounded-md bg-slate-200 dark:bg-slate-600 dark:border-slate-600 cursor-not-allowed" readOnly /></div>
                        <div><label className="text-sm text-slate-700 dark:text-slate-300">No. Telepon (WhatsApp)</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="e.g., 628123456789" className="w-full mt-1 p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600" /></div>
                        
                        <div><label className="text-sm text-slate-700 dark:text-slate-300">Status</label><select name="status" value={formData.status} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600"><option>Aktif</option><option>Cuti</option><option>Tidak Aktif</option></select></div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-sm font-medium rounded-lg">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CSManagementPage: React.FC = () => {
    const [agents, setAgents] = useState<CSAgent[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<CSAgent | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
    const { showToast } = useToast();

    const fetchAgentsAndUsers = async () => {
        setLoading(true);
        try {
            const { data: agentsData, error: agentsError } = await supabase.from('cs_agents').select('*');
            
            if (agentsError) {
                if (agentsError.code === '42P01' || agentsError.message?.includes('does not exist')) {
                    setAgents([]);
                } else {
                    throw agentsError;
                }
            } else {
                const agentsList = (agentsData || []).map(doc => ({ ...doc } as CSAgent));
                setAgents(agentsList);
            }

            const { data: usersData, error: usersError } = await supabase.from('users').select('*');
            if (usersError) throw usersError;
            const usersList = (usersData || []).map(doc => ({ ...doc } as User));
            setUsers(usersList);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchAgentsAndUsers();
    }, []);

    const availableUsersForCS = useMemo(() => {
        const assignedAgentEmails = agents.map(agent => agent.email);
        return users.filter(user => user.role === 'Customer service' && !assignedAgentEmails.includes(user.email));
    }, [users, agents]);

    const filteredAgents = useMemo(() => {
        return agents.filter(agent =>
            agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [agents, searchTerm]);
    
    const handleOpenModal = (agent: CSAgent | null = null) => {
        setEditingAgent(agent);
        setIsModalOpen(true);
    };

    const handleSaveAgent = async (agentData: CSAgent, avatarFile: File | null) => {
        try {
            let finalData = { ...agentData };
            
            if (avatarFile) {
                const avatarUrl = await uploadFileAndGetURL(avatarFile);
                finalData.avatar = avatarUrl;
            } else if (!finalData.avatar) {
                 finalData.avatar = `https://i.pravatar.cc/150?u=${finalData.name}`
            }

            if (finalData.id) {
                const { id, ...newData } = finalData;
                await supabase.from('cs_agents').upsert({ id: finalData.id, ...newData });
            } else {
                console.error("Cannot save agent without a user ID.");
                showToast("Terjadi kesalahan: ID Pengguna tidak ditemukan.", 'error');
                return;
            }
            fetchAgentsAndUsers(); // Refresh both agents and users
            showToast("Agen CS berhasil disimpan.", 'success');
        } catch(e) {
            console.error("Error saving agent: ", e);
            showToast("Gagal menyimpan agen.", 'error');
        } finally {
            setIsModalOpen(false);
            setEditingAgent(null);
        }
    };

    const confirmDeleteAgent = async () => {
        if (!agentToDelete) return;
        try {
            await supabase.from('cs_agents').delete().eq('id', agentToDelete);
            fetchAgentsAndUsers();
            showToast("Agen berhasil dihapus.", 'success');
        } catch (error) {
            console.error("Error deleting agent: ", error);
            showToast("Gagal menghapus agen.", 'error');
        } finally {
            setDeleteModalOpen(false);
            setAgentToDelete(null);
        }
    };

    const handleDeleteClick = (id: string) => {
        setAgentToDelete(id);
        setDeleteModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Gradient Header */}
            <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-teal-900/20 rounded-2xl p-8 shadow-sm border border-blue-100/50 dark:border-blue-800/30">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2">
                            💬 Manajemen Tim CS
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">Kelola dan pantau kinerja tim customer service Anda</p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Tambah CS</span>
                    </button>
                </div>
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-blue-100 dark:border-blue-800/50 hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Agen CS</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{agents.length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-green-100 dark:border-green-800/50 hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">CS Aktif</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{agents.filter(a => a.status === 'Aktif').length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100 dark:border-purple-800/50 hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Order</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{agents.reduce((sum, a) => sum + a.ordersHandled, 0)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-amber-100 dark:border-amber-800/50 hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Omzet</p>
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">Rp {(agents.reduce((sum, a) => sum + a.totalOmzet, 0) / 1000000).toFixed(1)}jt</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="relative w-full md:w-1/3">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Cari nama atau email agen CS..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>
            
            {/* CS Agents Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center p-20">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="ml-4 text-gray-600 dark:text-gray-400">Memuat data agen CS...</p>
                        </div>
                    ) : filteredAgents.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="flex flex-col items-center">
                                <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Tidak ada agen CS ditemukan</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Coba ubah pencarian atau tambah agen baru</p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b-2 border-blue-200 dark:border-blue-800">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Nama Agen</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Kontak</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Kinerja</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAgents.map(agent => (
                                    <tr key={agent.id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={agent.avatar || `https://i.pravatar.cc/150?u=${agent.name}`} 
                                                    alt={agent.name} 
                                                    className="w-10 h-10 rounded-full bg-gray-200 ring-2 ring-blue-200 dark:ring-blue-700 object-cover"
                                                />
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{agent.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{agent.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs rounded-full font-bold ${
                                                agent.status === 'Aktif' 
                                                    ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-400' 
                                                    : agent.status === 'Cuti'
                                                    ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:text-yellow-400'
                                                    : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 dark:from-slate-900/30 dark:to-slate-800/30 dark:text-slate-400'
                                            }`}>
                                                {agent.status === 'Aktif' ? '✓ Aktif' : agent.status === 'Cuti' ? '🏖️ Cuti' : '⏸️ Tidak Aktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {agent.phone ? (
                                                <a href={`https://wa.me/${agent.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 dark:text-green-400 hover:underline">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                                    </svg>
                                                    {agent.phone}
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-xs text-gray-500">Order: <span className="font-bold text-gray-800 dark:text-gray-200">{agent.ordersHandled}</span></p>
                                                <p className="text-xs text-gray-500">Closing: <span className="font-bold text-blue-600 dark:text-blue-400">{agent.closingRate}%</span></p>
                                                <p className="text-xs text-gray-500">Omzet: <span className="font-bold text-amber-600 dark:text-amber-400">Rp {(agent.totalOmzet / 1000000).toFixed(1)}jt</span></p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button 
                                                    onClick={() => handleOpenModal(agent)} 
                                                    title="Edit CS" 
                                                    className="p-2 text-slate-500 hover:text-white hover:bg-blue-600 rounded-lg transition-all"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(agent.id)} 
                                                    title="Hapus CS" 
                                                    className="p-2 text-slate-500 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            
            {isModalOpen && <AgentModal agent={editingAgent} availableUsers={availableUsersForCS} onClose={() => setIsModalOpen(false)} onSave={handleSaveAgent} />}
            
            {deleteModalOpen && (
                <ConfirmationModal 
                    isOpen={deleteModalOpen}
                    title="Hapus Agen"
                    message="Apakah Anda yakin ingin menghapus agen ini?"
                    confirmLabel="Ya, Hapus"
                    variant="danger"
                    onConfirm={confirmDeleteAgent}
                    onClose={() => setDeleteModalOpen(false)}
                />
            )}
        </div>
    );
};

export default CSManagementPage;
