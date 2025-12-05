
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Form, MessageTemplates, User } from '../types';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import EyeIcon from '../components/icons/EyeIcon';
import LinkIcon from '../components/icons/LinkIcon';
import { supabase } from '../firebase';
import ChatBubbleIcon from '../components/icons/ChatBubbleIcon';
import ToggleSwitch from '../components/ToggleSwitch';
import XIcon from '../components/icons/XIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import { filterDataByBrand } from '../utils';
import CodeIcon from '../components/icons/CodeIcon';
import ClipboardListIcon from '../components/icons/ClipboardListIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import PlusIcon from '../components/icons/PlusIcon';
import DotsHorizontalIcon from '../components/icons/DotsHorizontalIcon';

const MessageTemplatesModal: React.FC<{
    form: Form;
    globalTemplates: MessageTemplates | null;
    onClose: () => void;
    onSave: (formId: string, templates: Form['customMessageTemplates']) => void;
}> = ({ form, globalTemplates, onClose, onSave }) => {
    const [templates, setTemplates] = useState<Form['customMessageTemplates']>({ active: false, templates: {} });

    useEffect(() => {
        const initial = form.customMessageTemplates;
        setTemplates({
            active: initial?.active ?? false,
            templates: initial?.templates ?? {}
        });
    }, [form]);


    const handleSave = () => {
        onSave(form.id, templates);
    };

    const handleTemplateChange = (key: keyof MessageTemplates, value: string) => {
        setTemplates(prev => {
            if (!prev) return prev;
            const newTemplates = { ...prev.templates, [key]: value };
            return { ...prev, templates: newTemplates };
        });
    };
    
    const handleReset = (key: keyof MessageTemplates) => {
        setTemplates(prev => {
            if (!prev) return prev;
            const { [key]: _, ...remainingTemplates } = prev.templates;
            return {
                ...prev,
                templates: remainingTemplates
            };
        });
    };
    
    if (!globalTemplates) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all flex flex-col">
                 <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Template Pesan untuk "{form.title}"</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"><XIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                     <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                        <ToggleSwitch checked={templates?.active || false} onChange={v => setTemplates(prev => ({ ...prev!, active: v }))} />
                        <span className="text-sm">Gunakan template kustom untuk formulir ini</span>
                    </div>
                    {templates?.active && (
                         <div className="space-y-4 mt-4">
                            {Object.keys(globalTemplates).map(keyStr => {
                                const key = keyStr as keyof MessageTemplates;
                                const customTemplate = templates?.templates[key];
                                const globalTemplate = globalTemplates[key];
                                const placeholders: Record<keyof MessageTemplates, string> = {
                                    followUp1: "[CUSTOMER_NAME], [ORDER_ID]",
                                    followUp2: "[CUSTOMER_NAME], [ORDER_ID]",
                                    followUp3: "[CUSTOMER_NAME], [ORDER_ID]",
                                    followUp4: "[CUSTOMER_NAME], [ORDER_ID]",
                                    followUp5: "[CUSTOMER_NAME], [ORDER_ID]",
                                    processing: "[CUSTOMER_NAME], [ORDER_ID]",
                                    shipped: "[CUSTOMER_NAME], [ORDER_ID], [RESI_NUMBER]",
                                };

                                return (
                                    <div key={key}>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/(\d)/g, ' $1')}</label>
                                            {customTemplate !== undefined && (
                                                <button type="button" onClick={() => handleReset(key)} className="text-xs text-indigo-600 hover:underline">
                                                    Reset ke Default
                                                </button>
                                            )}
                                        </div>
                                        <textarea
                                            value={customTemplate ?? ''}
                                            placeholder={globalTemplate}
                                            onChange={e => handleTemplateChange(key, e.target.value)}
                                            rows={3}
                                            className="w-full text-sm p-2 border rounded bg-white dark:bg-slate-700 dark:border-slate-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        />
                                        <p className="mt-1 text-xs text-slate-500">Placeholder yang tersedia: {placeholders[key]}</p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-sm font-medium rounded-lg">Batal</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Simpan Template</button>
                </div>
            </div>
        </div>
    );
};

const FormsPage: React.FC = () => {
    const [forms, setForms] = useState<Form[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [csAgents, setCsAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formToDelete, setFormToDelete] = useState<Form | null>(null);
    const [editingTemplatesFor, setEditingTemplatesFor] = useState<Form | null>(null);
    const [globalTemplates, setGlobalTemplates] = useState<MessageTemplates | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
    const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
    const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
    const [productDropdownOpen, setProductDropdownOpen] = useState(false);
    const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
    const actionMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                 const { data: userDoc } = await supabase.from('users').select('*').eq('id', user.id).single();
                 if (userDoc) {
                     setCurrentUser({ id: user.id, ...userDoc } as User);
                 } else {
                     // Fallback for super admin
                     setCurrentUser({ id: user.id, role: 'Super Admin', name: 'Owner', email: user.email || '', status: 'Aktif', lastLogin: '' });
                 }
            }

            const { data: formsData } = await supabase.from('forms').select('*');
            const formsList = (formsData || []).map(doc => ({ ...doc } as Form));
            setForms(formsList);

            // Fetch all users for name lookups
            const { data: usersData } = await supabase.from('users').select('*');
            if (usersData) {
                setUsers(usersData as User[]);
            }

            // Fetch CS agents for name lookups
            const { data: csAgentsData } = await supabase.from('cs_agents').select('*');
            if (csAgentsData) {
                setCsAgents(csAgentsData);
            }

            const { data: templatesData } = await supabase.from('settings').select('*').eq('id', 'messageTemplates').single();
            if (templatesData) {
                setGlobalTemplates(templatesData as MessageTemplates);
            } else {
                setGlobalTemplates({
                    followUp1: 'Halo [CUSTOMER_NAME], kami mengingatkan kembali tentang pesanan Anda dengan ID [ORDER_ID]. Mohon segera lakukan pembayaran ya.',
                    followUp2: 'Follow up 2 untuk [CUSTOMER_NAME] mengenai pesanan [ORDER_ID].',
                    followUp3: 'Follow up 3 untuk [CUSTOMER_NAME] mengenai pesanan [ORDER_ID].',
                    followUp4: 'Follow up 4 untuk [CUSTOMER_NAME] mengenai pesanan [ORDER_ID].',
                    followUp5: 'Follow up 5 untuk [CUSTOMER_NAME] mengenai pesanan [ORDER_ID].',
                    processing: 'Pesanan Anda dengan ID [ORDER_ID] sedang kami proses. Terima kasih!',
                    shipped: 'Pesanan Anda ([ORDER_ID]) telah dikirim! Berikut nomor resi Anda: [RESI_NUMBER].',
                });
            }

        } catch (error) {
            console.error("Error fetching data for forms page: ", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Debug effect to log CS assignments
    useEffect(() => {
        if (forms.length > 0 && csAgents.length > 0) {
            console.log('=== Forms with CS Assignment ===');
            forms.forEach(form => {
                if (form.thankYouPage?.csAssignment) {
                    console.log(`Form: ${form.title}`, {
                        csAssignment: form.thankYouPage.csAssignment,
                        csAgentsAvailable: csAgents.map(a => ({ id: a.id, name: a.name }))
                    });
                }
            });
        }
    }, [forms, csAgents]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            
            // Close action menu
            if (openActionMenuId && actionMenuRefs.current[openActionMenuId]) {
                if (!actionMenuRefs.current[openActionMenuId]?.contains(target)) {
                    setOpenActionMenuId(null);
                }
            }
            
            // Close filter dropdowns
            const targetElement = target as HTMLElement;
            if (!targetElement.closest('.brand-dropdown')) {
                setBrandDropdownOpen(false);
            }
            if (!targetElement.closest('.product-dropdown')) {
                setProductDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openActionMenuId]);

    const handleNewForm = () => {
        navigate('/formulir/baru');
    };

    const handleEditForm = (form: Form) => {
        navigate(`/formulir/edit/${form.id}`);
        setOpenActionMenuId(null);
    };

    const handleDeleteForm = (form: Form) => {
        setFormToDelete(form);
        setOpenActionMenuId(null);
    };
    
    const confirmDelete = async () => {
        if (!formToDelete) return;
        try {
            // Hard delete - permanently delete the form
            await supabase
                .from('forms')
                .delete()
                .eq('id', formToDelete.id);
            
            setForms(prev => prev.filter(f => f.id !== formToDelete.id));
        } catch (error) {
            console.error("Error deleting form:", error);
        } finally {
            setFormToDelete(null);
        }
    };
    
    // Helper to get the correct URL using slug
    const getFormUrl = (form: Form) => {
        const baseUrl = window.location.origin;
        const formSlug = form.slug || form.id;
        return `${baseUrl}/#/f/${formSlug}`;
    };

    // Helper for standalone URL
    const getStandaloneUrl = (form: Form) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/standalone_form.html?id=${form.id}`;
    }

    const handleViewForm = (form: Form) => {
        window.open(getFormUrl(form), '_blank');
    };

    const handleViewStandalone = (form: Form) => {
        window.open(getStandaloneUrl(form), '_blank');
    };
    
    const handleCopyLink = (form: Form) => {
        const url = getFormUrl(form);
        navigator.clipboard.writeText(url).then(() => {
            alert('Tautan formulir disalin!');
        });
    };

    const handleSaveTemplates = async (formId: string, templatesData: Form['customMessageTemplates']) => {
        try {
            const { error } = await supabase.from('forms').update({ customMessageTemplates: templatesData }).eq('id', formId);
            if (error) throw error;
            setForms(prev => prev.map(f => f.id === formId ? { ...f, customMessageTemplates: templatesData } : f));
        } catch (error) {
            console.error("Error saving templates:", error);
            alert("Gagal menyimpan template.");
        } finally {
            setEditingTemplatesFor(null);
        }
    };

    // Helper function to get user name by ID (from users or cs_agents table)
    const getUserName = (userId?: string): string => {
        if (!userId || userId.trim() === '') return '(No Agent)';
        
        // First try to find in cs_agents table (priority for CS agents)
        let agent = csAgents.find(a => a.id === userId);
        if (agent) return agent.name;
        
        // Then try users table
        let user = users.find(u => u.id === userId);
        if (user) return user.name;
        
        // If still not found, log a warning
        console.warn(`⚠️ Agent/User not found for ID: "${userId}"`);
        console.log(`Available CS Agents: ${csAgents.map(a => `${a.id}(${a.name})`).join(', ') || 'None'}`);
        console.log(`Available Users: ${users.map(u => `${u.id}(${u.name})`).join(', ') || 'None'}`);
        
        return `[ID: ${userId.substring(0, 8)}...]`;
    };

    // Helper function to get CS agent names by mode - showing all details
    const getCsAssignmentDisplay = (csAssignment?: any): string => {
        if (!csAssignment) return '-';
        
        try {
            if (csAssignment.mode === 'single') {
                if (!csAssignment.singleAgentId) {
                    return '-';
                }
                const agentName = getUserName(csAssignment.singleAgentId);
                return agentName;
            }
            
            if (csAssignment.mode === 'round_robin') {
                if (!csAssignment.roundRobinAgents || csAssignment.roundRobinAgents.length === 0) {
                    return '-';
                }
                
                const agentDetails = csAssignment.roundRobinAgents
                    .map((ra: any) => {
                        const agentName = getUserName(ra.csAgentId);
                        const percentage = ra.percentage ? ` (${ra.percentage}%)` : '';
                        return `${agentName}${percentage}`;
                    })
                    .filter((name: string) => name); // Filter empty
                    
                if (agentDetails.length === 0) {
                    return '-';
                }
                
                return agentDetails.join(', ');
            }
            
            return '-';
        } catch (error) {
            console.error('Error in getCsAssignmentDisplay:', error);
            return '-';
        }
    };
    
    const filteredForms = useMemo(() => {
        let result = filterDataByBrand(forms, currentUser);
        
        // Brand Filter
        if (selectedBrandFilter !== 'all') {
            result = result.filter((form: Form) => form.brandId === selectedBrandFilter);
        }
        
        // Product Filter (by form title)
        if (selectedProductFilter !== 'all') {
            result = result.filter((form: Form) => form.title === selectedProductFilter);
        }
        
        // Search
        if (!searchTerm.trim()) return result;
        
        const term = searchTerm.toLowerCase();
        return result.filter((form: Form) => 
            form.title.toLowerCase().includes(term) ||
            form.slug.toLowerCase().includes(term)
        );
    }, [forms, currentUser, searchTerm, selectedBrandFilter, selectedProductFilter]);

    // Get unique brands for filter
    const uniqueBrands = useMemo(() => {
        const brands = new Set<string>();
        forms.forEach(f => {
            if (f.brandId) brands.add(f.brandId);
        });
        return Array.from(brands);
    }, [forms]);

    // Get unique products (form titles) for filter
    const uniqueProducts = useMemo(() => {
        const products = new Set<string>();
        forms.forEach(f => {
            if (f.title) products.add(f.title);
        });
        return Array.from(products).sort();
    }, [forms]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 p-6 rounded-2xl border border-indigo-100 dark:border-slate-700">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <ClipboardListIcon className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Formulir Pemesanan</h1>
                    </div>
                    <p className="ml-13 text-base text-slate-600 dark:text-slate-400">Kelola semua formulir pemesanan produk Anda.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <Link 
                        to="/pengaturan/template-pesan"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-slate-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold shadow-sm hover:shadow-md hover:scale-105 transition-all"
                    >
                        <ChatBubbleIcon className="w-5 h-5" />
                        <span>Template Pesan</span>
                    </Link>
                    <button 
                        onClick={handleNewForm} 
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Buat Formulir Baru</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-center gap-2 mb-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Cari formulir berdasarkan judul atau slug..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Brand Filter */}
                    <div className="relative brand-dropdown">
                        <button
                            onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
                            className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 min-w-[140px]"
                        >
                            <span className="flex-1 text-left truncate">
                                {selectedBrandFilter === 'all' ? 'Brand' : selectedBrandFilter}
                            </span>
                            <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
                        </button>
                        {brandDropdownOpen && (
                            <div className="absolute top-full mt-1 left-0 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setSelectedBrandFilter('all');
                                            setBrandDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-sm ${selectedBrandFilter === 'all' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
                                    >
                                        Semua Brand
                                    </button>
                                    {uniqueBrands.map(brand => (
                                        <button
                                            key={brand}
                                            onClick={() => {
                                                setSelectedBrandFilter(brand);
                                                setBrandDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-sm ${selectedBrandFilter === brand ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
                                        >
                                            {brand}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Filter */}
                    <div className="relative product-dropdown">
                        <button
                            onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                            className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 min-w-[160px]"
                        >
                            <span className="flex-1 text-left truncate">
                                {selectedProductFilter === 'all' ? 'Produk' : selectedProductFilter}
                            </span>
                            <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
                        </button>
                        {productDropdownOpen && (
                            <div className="absolute top-full mt-1 left-0 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setSelectedProductFilter('all');
                                            setProductDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-sm ${selectedProductFilter === 'all' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
                                    >
                                        Semua Produk
                                    </button>
                                    {uniqueProducts.map(product => (
                                        <button
                                            key={product}
                                            onClick={() => {
                                                setSelectedProductFilter(product);
                                                setProductDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-sm truncate ${selectedProductFilter === product ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
                                            title={product}
                                        >
                                            {product}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>Menampilkan {filteredForms.length} dari {forms.length} formulir</span>
                </div>
            </div>
            
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <SpinnerIcon className="w-10 h-10 text-indigo-600 animate-spin" />
                </div>
            ) : filteredForms.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-16 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <ClipboardListIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Belum ada formulir</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">Buat formulir pemesanan pertama Anda untuk mulai menerima pesanan dari pelanggan</p>
                    <button 
                        onClick={handleNewForm} 
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold inline-flex items-center gap-3 shadow-xl shadow-indigo-500/30 hover:scale-105 transition-all"
                    >
                        <PlusIcon className="w-6 h-6" />
                        <span>Buat Formulir Baru</span>
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Formulir</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Respons</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Slug / Domain</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">ADV Assign</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">CS Assign</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredForms.map(form => (
                                    <tr key={form.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <img 
                                                    src={form.mainImage || 'https://placehold.co/100x100/e2e8f0/94a3b8?text=No+Image'} 
                                                    alt={form.title} 
                                                    className="w-16 h-16 rounded-lg object-cover border-2 border-slate-200 dark:border-slate-600"
                                                />
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">{form.title}</h3>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <span className="text-sm font-bold text-green-700 dark:text-green-400">{form.submissionCount || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {form.slug ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">URL:</span>
                                                    <code className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded text-xs font-mono text-purple-700 dark:text-purple-300">
                                                        /f/{form.slug}
                                                    </code>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400 dark:text-slate-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {form.assignedAdvertiserId ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                    <div className="w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                                                        {getUserName(form.assignedAdvertiserId).charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{getUserName(form.assignedAdvertiserId)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400 dark:text-slate-500 italic">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-700 dark:text-slate-300 max-w-xs break-words">{getCsAssignmentDisplay(form.thankYouPage?.csAssignment)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative inline-block" ref={el => { if (el) actionMenuRefs.current[form.id] = el; }}>
                                                <button 
                                                    onClick={() => setOpenActionMenuId(openActionMenuId === form.id ? null : form.id)}
                                                    className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all hover:scale-110"
                                                    title="Aksi"
                                                >
                                                    <DotsHorizontalIcon className="w-5 h-5" />
                                                </button>
                                                {openActionMenuId === form.id && (
                                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl z-50 border border-slate-200 dark:border-slate-700 py-2">
                                                        <button 
                                                            onClick={() => { handleViewForm(form); setOpenActionMenuId(null); }}
                                                            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                                                        >
                                                            <EyeIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                            Lihat Formulir
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEditForm(form)}
                                                            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                                                        >
                                                            <PencilIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                                            Edit Formulir
                                                        </button>
                                                        <button 
                                                            onClick={() => { handleViewStandalone(form); setOpenActionMenuId(null); }}
                                                            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                                                        >
                                                            <CodeIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                            Lihat HTML
                                                        </button>
                                                        <button 
                                                            onClick={() => { setEditingTemplatesFor(form); setOpenActionMenuId(null); }}
                                                            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                                                        >
                                                            <ChatBubbleIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                            Template Pesan
                                                        </button>
                                                        <button 
                                                            onClick={() => { handleCopyLink(form); setOpenActionMenuId(null); }}
                                                            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                                                        >
                                                            <LinkIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                            Salin Tautan
                                                        </button>
                                                        <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                                                        <button 
                                                            onClick={() => handleDeleteForm(form)}
                                                            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                            Hapus
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {editingTemplatesFor && (
                <MessageTemplatesModal 
                    form={editingTemplatesFor}
                    globalTemplates={globalTemplates}
                    onClose={() => setEditingTemplatesFor(null)}
                    onSave={handleSaveTemplates}
                />
            )}

            {formToDelete && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <TrashIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Hapus Formulir?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Anda yakin ingin menghapus formulir <span className="font-bold text-slate-900 dark:text-white">"{formToDelete.title}"</span>?</p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-semibold">⚠️ Formulir akan dihapus permanen dan tidak dapat dikembalikan!</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
                            <button onClick={() => setFormToDelete(null)} className="px-4 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors">Batal</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all hover:scale-105">Ya, Hapus Permanen</button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default FormsPage;
