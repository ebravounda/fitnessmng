import { useEffect } from "react";
import "@fontsource/chivo/400.css";
import "@fontsource/chivo/700.css";
import "@fontsource/chivo/900.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BusinessProvider } from "./context/BusinessContext";

// Layouts
import { AdminLayout } from "./layouts/AdminLayout";
import { PWALayout } from "./layouts/PWALayout";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminAccess from "./pages/admin/AdminAccess";
import AdminDevices from "./pages/admin/AdminDevices";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminGyms from "./pages/admin/AdminGyms";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminAccounting from "./pages/admin/AdminAccounting";
import KioskPage from "./pages/pwa/KioskPage";
import KioskDisplay from "./pages/pwa/KioskDisplay";
import AdminSchedules from "./pages/admin/AdminSchedules";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminGuests from "./pages/admin/AdminGuests";
import AdminSaaSPlans from "./pages/admin/AdminSaaSPlans";
import AdminPOS from "./pages/admin/AdminPOS";
import AdminIframes from "./pages/admin/AdminIframes";
import AdminBroadcast from "./pages/admin/AdminBroadcast";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminForms from "./pages/admin/AdminForms";
import AdminData from "./pages/admin/AdminData";
import AdminSecurity from "./pages/admin/AdminSecurity";
import AdminDeviceMonitor from "./pages/admin/AdminDeviceMonitor";
import AdminGamification from "./pages/admin/AdminGamification";
import AdminRoutines from "./pages/admin/AdminRoutines";
import AdminOnlineClasses from "./pages/admin/AdminOnlineClasses";
import TrainerDashboard from "./pages/admin/TrainerDashboard";

// PWA Pages
import MemberLogin from "./pages/pwa/MemberLogin";
import MemberHome from "./pages/pwa/MemberHome";
import MemberHistory from "./pages/pwa/MemberHistory";
import MemberStats from "./pages/pwa/MemberStats";
import MemberMembership from "./pages/pwa/MemberMembership";
import MemberProfile from "./pages/pwa/MemberProfile";
import MemberClasses from "./pages/pwa/MemberClasses";
import MemberNotifications from "./pages/pwa/MemberNotifications";
import MemberGuests from "./pages/pwa/MemberGuests";
import PaymentSuccess from "./pages/pwa/PaymentSuccess";
import PublicRegister from "./pages/pwa/PublicRegister";
import MemberGamification from "./pages/pwa/MemberGamification";
import MemberRoutines from "./pages/pwa/MemberRoutines";
import MemberOnlineClasses from "./pages/pwa/MemberOnlineClasses";

// Smart Dashboard: shows TrainerDashboard for trainers, AdminDashboard for others
const SmartDashboard = () => {
  const { admin } = useAuth();
  if (admin?.role === 'trainer') return <TrainerDashboard />;
  return <AdminDashboard />;
};

// Protected Route Components
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--gym-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <AdminLayout><ErrorBoundary>{children}</ErrorBoundary></AdminLayout>;
};

const MemberRoute = ({ children }) => {
  const { isAuthenticated, isMember, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--gym-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated || !isMember) {
    return <Navigate to="/app/login" replace />;
  }
  
  return <PWALayout><ErrorBoundary>{children}</ErrorBoundary></PWALayout>;
};

// Landing Page
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Hero background image with dark overlay */}
      <div className="absolute inset-0">
        <img src="/images/gym_hero_bg.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.85) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center top, rgba(255,102,0,0.08) 0%, transparent 60%)' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-3xl">
          {/* Logo */}
          <div className="mb-6">
            <img src="/logo192.png" alt="Gym24" className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl" style={{ boxShadow: '0 0 60px rgba(255,102,0,0.2), 0 0 120px rgba(255,102,0,0.05)' }} />
          </div>
          
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span style={{ color: '#FF6600', textShadow: '0 0 40px rgba(255,102,0,0.3)' }}>Gym</span><span className="text-white">24</span>
          </h1>
          <p className="text-white/50 text-base sm:text-lg mb-12 font-light tracking-wide max-w-md mx-auto">
            Control de acceso inteligente para tu negocio fitness
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a 
              href="/admin/login"
              className="group relative text-center text-base font-bold px-10 py-4 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ fontFamily: 'Outfit, sans-serif' }}
              data-testid="admin-access-btn"
            >
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #FF6600 0%, #CC5200 100%)' }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, #FF7722 0%, #FF6600 100%)' }} />
              <div className="absolute inset-[-1px] rounded-2xl opacity-50" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2), transparent)', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'xor', WebkitMaskComposite: 'xor', padding: '1px' }} />
              <span className="relative text-white flex items-center justify-center gap-2">
                Panel de Administracion
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </a>
            <a 
              href="/app/login"
              className="group px-10 py-4 rounded-2xl text-white/90 font-bold transition-all text-center hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm"
              style={{ fontFamily: 'Outfit, sans-serif', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              data-testid="member-access-btn"
            >
              <span className="flex items-center justify-center gap-2">
                Acceso Socios
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100 transition-all"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h.01M7 12h.01M7 17h.01"/></svg>
              </span>
            </a>
          </div>
          
          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {[
              { label: 'QR Dinamico', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z' },
              { label: 'RFID / Pulseras', icon: 'M2 12a10 10 0 1020 0 10 10 0 00-20 0zM12 8v8M8 12h8' },
              { label: '24/7 Acceso', icon: 'M12 2v10l4.5 4.5' },
              { label: 'Video Seguridad', icon: 'M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm"
                style={{ background: 'rgba(255,102,0,0.06)', border: '1px solid rgba(255,102,0,0.12)' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,102,0,0.15)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FF6600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon}/></svg>
                </div>
                <span className="text-xs font-semibold text-white/60" style={{ fontFamily: 'Outfit' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom subtle branding */}
        <div className="absolute bottom-6 text-center">
          <p className="text-white/20 text-[10px] tracking-widest uppercase" style={{ fontFamily: 'Outfit' }}>Powered by Gym24.app</p>
        </div>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute><SmartDashboard /></AdminRoute>} />
      <Route path="/admin/gyms" element={<AdminRoute><AdminGyms /></AdminRoute>} />
      <Route path="/admin/members" element={<AdminRoute><AdminMembers /></AdminRoute>} />
      <Route path="/admin/plans" element={<AdminRoute><AdminPlans /></AdminRoute>} />
      <Route path="/admin/classes" element={<AdminRoute><AdminClasses /></AdminRoute>} />
      <Route path="/admin/attendance" element={<AdminRoute><AdminAttendance /></AdminRoute>} />
      <Route path="/admin/accounting" element={<AdminRoute><AdminAccounting /></AdminRoute>} />
      <Route path="/admin/schedules" element={<AdminRoute><AdminSchedules /></AdminRoute>} />
      <Route path="/admin/staff" element={<AdminRoute><AdminStaff /></AdminRoute>} />
      <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
      <Route path="/admin/guests" element={<AdminRoute><AdminGuests /></AdminRoute>} />
      <Route path="/admin/access" element={<AdminRoute><AdminAccess /></AdminRoute>} />
      <Route path="/admin/devices" element={<AdminRoute><AdminDevices /></AdminRoute>} />
      <Route path="/admin/templates" element={<AdminRoute><AdminTemplates /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      <Route path="/admin/saas-plans" element={<AdminRoute><AdminSaaSPlans /></AdminRoute>} />
      <Route path="/admin/pos" element={<AdminRoute><AdminPOS /></AdminRoute>} />
      <Route path="/admin/iframes" element={<AdminRoute><AdminIframes /></AdminRoute>} />
      <Route path="/admin/broadcast" element={<AdminRoute><AdminBroadcast /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      <Route path="/admin/forms" element={<AdminRoute><AdminForms /></AdminRoute>} />
      <Route path="/admin/data" element={<AdminRoute><AdminData /></AdminRoute>} />
      <Route path="/admin/security" element={<AdminRoute><AdminSecurity /></AdminRoute>} />
      <Route path="/admin/device-monitor" element={<AdminRoute><AdminDeviceMonitor /></AdminRoute>} />
      <Route path="/admin/gamification" element={<AdminRoute><AdminGamification /></AdminRoute>} />
      <Route path="/admin/routines" element={<AdminRoute><AdminRoutines /></AdminRoute>} />
      <Route path="/admin/online-classes" element={<AdminRoute><AdminOnlineClasses /></AdminRoute>} />
      
      {/* PWA/Member Routes */}
      <Route path="/app/login" element={<MemberLogin />} />
      <Route path="/app" element={<MemberRoute><MemberHome /></MemberRoute>} />
      <Route path="/app/classes" element={<MemberRoute><MemberClasses /></MemberRoute>} />
      <Route path="/app/notifications" element={<MemberRoute><MemberNotifications /></MemberRoute>} />
      <Route path="/app/guests" element={<MemberRoute><MemberGuests /></MemberRoute>} />
      <Route path="/app/history" element={<MemberRoute><MemberHistory /></MemberRoute>} />
      <Route path="/app/stats" element={<MemberRoute><MemberStats /></MemberRoute>} />
      <Route path="/app/achievements" element={<MemberRoute><MemberGamification /></MemberRoute>} />
      <Route path="/app/routines" element={<MemberRoute><MemberRoutines /></MemberRoute>} />
      <Route path="/app/online-classes" element={<MemberRoute><MemberOnlineClasses /></MemberRoute>} />
      <Route path="/app/membership" element={<MemberRoute><MemberMembership /></MemberRoute>} />
      <Route path="/app/profile" element={<MemberRoute><MemberProfile /></MemberRoute>} />
      <Route path="/app/payment-success" element={<MemberRoute><PaymentSuccess /></MemberRoute>} />
      
      {/* Public Registration */}
      <Route path="/register/:gymId" element={<PublicRegister />} />
      
      {/* Kiosk Mode */}
      <Route path="/kiosk/:gymId" element={<KioskPage />} />
      <Route path="/display/:gymId" element={<KioskDisplay />} />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BusinessProvider>
        <AppRoutes />
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#18181B',
              border: '1px solid #27272A',
              color: '#FAFAFA',
            },
          }}
        />
      </BusinessProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
