import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bot, Mail, Lock, ArrowRight, AlertCircle, Loader2, ShieldCheck, UserCheck } from 'lucide-react';
import useAuthStore from '../store/authStore.js';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/chat';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    if (res.success) {
      if (res.user.role === 'admin') {
        navigate('/admin/documents');
      } else {
        navigate(from === '/login' ? '/chat' : from);
      }
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    const res = await login(demoEmail, demoPassword);
    if (res.success) {
      if (res.user.role === 'admin') {
        navigate('/admin/documents');
      } else {
        navigate('/chat');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-center items-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background radial aura */}
      <div className="absolute w-[450px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-xl shadow-indigo-600/30 mb-3">
            <Bot className="w-7 h-7" />
          </Link>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Sign In to CampusMind</h1>
          <p className="text-xs text-slate-400 mt-1">Access verified campus knowledge and chat assistant</p>
        </div>

        {/* Quick Demo Logins */}
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
            Quick Demo Accounts:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin.dev@campusmind.internal', 'CampusAdmin#Secure2026!')}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('student.dev@campusmind.internal', 'CampusStudent#Secure2026!')}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Student Demo</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) clearError();
                }}
                placeholder="name@campusmind.edu"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs md:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs md:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
