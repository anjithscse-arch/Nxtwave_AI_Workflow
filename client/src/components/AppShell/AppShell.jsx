import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bot, 
  MessageSquare, 
  History, 
  Settings, 
  FileText, 
  ShieldAlert, 
  Bell, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import NotificationsDrawer from '../NotificationsDrawer/NotificationsDrawer.jsx';

export function AppShell({ children }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const navLinks = [
    { to: '/chat', label: 'Chat Console', icon: MessageSquare },
    { to: '/history', label: 'History', icon: History },
    ...(isAdmin ? [
      { to: '/admin/documents', label: 'Documents', icon: FileText, badge: 'Admin' },
      { to: '/admin/guardrail-logs', label: 'Guardrail Logs', icon: ShieldAlert, badge: 'Security' }
    ] : []),
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                CampusMind
              </span>
              <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                RAG v1.0
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
                {link.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    link.badge === 'Security' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2.5">
          {/* Notifications Button */}
          <button
            onClick={() => setNotifDrawerOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors relative"
            title="System Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500"></span>
          </button>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-left leading-tight hidden lg:block">
              <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[10px] text-indigo-400 font-medium capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-2 z-30 animate-fade-in">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold ${
                  isActive ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-rose-400 font-semibold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Page Body */}
      <main className="flex-1 flex flex-col p-3 md:p-6 overflow-hidden">
        {children}
      </main>

      {/* Notifications Slide-over Drawer */}
      <NotificationsDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
      />
    </div>
  );
}

export default AppShell;
