
import React, { useState, useEffect, Suspense, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { supabase } from './supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import SpinnerIcon from './components/icons/SpinnerIcon';
import { SettingsProvider, SettingsContext } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Helper for lazy loading with retry mechanism to handle slow/unstable internet connections
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error("Lazy load failed, retrying...", error);
      // Retry after 1s
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        return await componentImport();
      } catch (e) {
        // Retry again after 2s
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await componentImport();
      }
    }
  });

// Lazy load all pages to optimize bundle size and initial load time
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'));
const OrdersPage = lazyWithRetry(() => import('./pages/OrdersPage'));
const AbandonedCartsPage = lazyWithRetry(() => import('./pages/AbandonedCartsPage'));
const AdReportsPage = lazyWithRetry(() => import('./pages/AdReportsPage'));
const CSReportsPage = lazyWithRetry(() => import('./pages/CSReportsPage'));
const FormsPage = lazyWithRetry(() => import('./pages/FormsPage'));
const FormEditorPage = lazyWithRetry(() => import('./pages/FormEditorPage'));
const FormViewerPage = lazyWithRetry(() => import('./pages/FormViewerPage'));
// Landing page removed - root now handled by authentication route
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage'));
const CustomersPage = lazyWithRetry(() => import('./pages/CustomersPage'));
const PendingUsersPage = lazyWithRetry(() => import('./pages/PendingUsersPage'));
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage'));
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'));
const MyProfilePage = lazyWithRetry(() => import('./pages/MyProfilePage'));
const EarningsPage = lazyWithRetry(() => import('./pages/EarningsPage'));
const PendingDeletionsPage = lazyWithRetry(() => import('./pages/PendingDeletionsPage'));
const ProductsPage = lazyWithRetry(() => import('./pages/ProductsPage'));
const ProductAnalyticsPage = lazyWithRetry(() => import('./pages/ProductAnalyticsPage'));
const ProductFormPage = lazyWithRetry(() => import('./pages/ProductFormPage'));


const FormViewerWrapper: React.FC = () => {
    const { identifier } = useParams<{ identifier: string }>();
    if (!identifier) return <Navigate to="/" />;
    return <FormViewerPage identifier={identifier} />;
};

interface AuthenticatedAppProps {
  user: SupabaseUser;
  currentTheme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ user, currentTheme, toggleTheme }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { websiteSettings } = useContext(SettingsContext);
  const websiteName = websiteSettings?.siteName;

  useEffect(() => {
    if (websiteName) {
        document.title = websiteName;
    }
  }, [websiteName]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
        websiteName={websiteName}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          sidebarToggle={() => setSidebarOpen(!isSidebarOpen)}
          toggleTheme={toggleTheme}
          currentTheme={currentTheme}
          user={user}
          logout={handleLogout}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 md:p-6 lg:p-8">
          <Suspense fallback={<div className="flex justify-center items-center h-64"><SpinnerIcon className="w-10 h-10 animate-spin text-indigo-500" /></div>}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profil" element={<MyProfilePage />} />
                <Route path="/pesanan" element={<OrdersPage />} />
                <Route path="/keranjang-terabaikan" element={<AbandonedCartsPage />} />
                <Route path="/pelanggan" element={<CustomersPage />} />
                <Route path="/laporan-iklan" element={<AdReportsPage user={user} />} />
                <Route path="/laporan-cs" element={<CSReportsPage />} />
                <Route path="/penghasilan" element={<EarningsPage />} />
                <Route path="/formulir" element={<FormsPage />} />
                <Route path="/formulir/baru" element={<FormEditorPage />} />
                <Route path="/formulir/edit/:formId" element={<FormEditorPage />} />
                <Route path="/pengaturan-akun" element={<ProfilePage />} />
                <Route path="/pengaturan/website" element={<SettingsPage subPage="Pengaturan Website" />} />
                <Route path="/pengaturan/pengguna" element={<SettingsPage subPage="Manajemen Pengguna" />} />
                <Route path="/pengaturan/peran" element={<SettingsPage subPage="Manajemen Peran" />} />
                <Route path="/pengaturan/cs" element={<SettingsPage subPage="Manajemen CS" />} />
                <Route path="/pengaturan/jam-kerja" element={<SettingsPage subPage="Jam Kerja" />} />
                <Route path="/pengaturan/merek" element={<SettingsPage subPage="Merek" />} />
                <Route path="/pengaturan/pelacakan" element={<SettingsPage subPage="Pelacakan" />} />
                <Route path="/pengaturan/pending-users" element={<PendingUsersPage />} />
                <Route path="/pengaturan/template-pesan" element={<SettingsPage subPage="Template Pesan" />} />
                <Route path="/pengaturan/permintaan-hapus" element={<PendingDeletionsPage />} />
                <Route path="/pengaturan/cuan-rank" element={<SettingsPage subPage="CuanRank" />} />
                <Route path="/produk" element={<ProductsPage />} />
                <Route path="/produk/tambah" element={<ProductFormPage />} />
                <Route path="/produk/edit/:id" element={<ProductFormPage />} />
                <Route path="/analitik-produk" element={<ProductAnalyticsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

const AppContent: React.FC = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loadingAuthState, setLoadingAuthState] = useState(true);

  // Theme state moved here to apply globally (including Login page)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTheme = window.localStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
    }
    return 'light'; // Default to light mode
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    // Smart redirect for clean form URLs (?form_id=...)
    const params = new URLSearchParams(window.location.search);
    const formId = params.get('form_id');

    if (formId) {
        window.history.replaceState(null, '', window.location.pathname);
        window.location.hash = `/f/${formId}`;
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Check if user status is active in the users table
        validateUserStatus(session.user);
      } else {
        setUser(null);
      }
      setLoadingAuthState(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        validateUserStatus(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Validate user status before allowing access
  const validateUserStatus = async (authUser: SupabaseUser) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('status')
        .eq('id', authUser.id)
        .single();

      if (userData?.status === 'Aktif') {
        setUser(authUser);
      } else if (userData?.status === 'Tidak Aktif') {
        // Sign out if user is not active
        await supabase.auth.signOut();
        setUser(null);
        // You can set an error message here to show why logout happened
        console.warn('User akun belum disetujui oleh admin');
      } else {
        setUser(authUser); // Default: allow access if status unknown
      }
    } catch (error) {
      console.error('Error validating user status:', error);
      setUser(authUser); // Default: allow access on error
    }
  };

  if (loadingAuthState) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-xl text-slate-600 dark:text-slate-400 animate-pulse">Memuat...</div>
      </div>
    );
  }

  // Simple loading fallback for the lazy-loaded form
  const FormLoadingFallback = () => (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
       <div className="w-full max-w-lg bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-pulse">
          <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-md mb-4"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 mb-6"></div>
          <div className="space-y-3">
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
       </div>
    </div>
  );

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/f/:identifier" 
          element={
            <Suspense fallback={<FormLoadingFallback />}>
              <FormViewerWrapper />
            </Suspense>
          } 
        />
        <Route path="/*" element={
            <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900"><div className="text-xl text-slate-600 dark:text-slate-400 animate-pulse">Memuat Aplikasi...</div></div>}>
                {user ? (
                    <AuthenticatedApp 
                        user={user} 
                        currentTheme={theme} 
                        toggleTheme={toggleTheme} 
                    /> 
                ) : <LoginPage />}
            </Suspense>
        } />
      </Routes>
    </HashRouter>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <ToastProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ToastProvider>
  </LanguageProvider>
);


export default App;
