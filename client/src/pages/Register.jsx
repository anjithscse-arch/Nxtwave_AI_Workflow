import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Mail, Lock, User, ArrowRight, AlertCircle, Loader2, Shield } from 'lucide-react';
import useAuthStore from '../store/authStore.js';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register({ name, email, password, role });
    if (res.success) {
      if (role === 'admin') {
        navigate('/admin/documents');
      } else {
        navigate('/chat');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-center items-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="absolute w-[450px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-xl shadow-indigo-600/30 mb-3">
            <Bot className="w-7 h-7" />
          </Link>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-400 mt-1">Get instant answers grounded in campus documentation</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) clearError();
                }}
                placeholder="Alex Student"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs md:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>

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
                placeholder="alex@campusmind.edu"
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
                minLength={6}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                placeholder="At least 6 characters"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs md:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Role</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                role === 'student'
                  ? 'border-indigo-500 bg-indigo-950/30 text-indigo-200'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={role === 'student'}
                  onChange={() => setRole('student')}
                  className="hidden"
                />
                <User className="w-4 h-4" />
                <span>Student</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                role === 'admin'
                  ? 'border-indigo-500 bg-indigo-950/30 text-indigo-200'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={() => setRole('admin')}
                  className="hidden"
                />
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
              </>
            ) : (
              <>
                <span>Register</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
