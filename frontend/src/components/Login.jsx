import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap, Lock, Mail, ArrowRight, ShieldCheck,
  Building2, Smartphone, Sparkles, CheckCircle2, ChevronLeft,
  UserCheck, School
} from 'lucide-react';
import { FloatingEducationalElements } from './Common/EducationalSVGs';
import api from '../api';

const Login = () => {
  const [roleMode, setRoleMode] = useState('admin'); // 'admin' | 'superadmin'
  const [identifier, setIdentifier] = useState('admin@apex.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleSwitch = (role) => {
    setRoleMode(role);
    setError('');
    if (role === 'admin') {
      setIdentifier('admin@apex.com');
      setPassword('Admin@123');
    } else {
      setIdentifier('superadmin');
      setPassword('Demo@123');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        identifier: identifier.trim(),
        username: identifier.trim(),
        email: identifier.trim(),
        password: password.trim(),
      };

      const res = await api.post('/auth/login', payload);

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        if (res.data.user) localStorage.setItem('user', JSON.stringify(res.data.user));
        if (res.data.institute) localStorage.setItem('institute', JSON.stringify(res.data.institute));

        const userRole = res.data.user?.role;
        if (userRole === 'superadmin') {
          navigate('/super-admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please verify your email / username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-900 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Background Soft Glow & Floating Academic Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-50/70 via-sky-50/30 to-transparent pointer-events-none -z-10 blur-2xl"></div>
      <FloatingEducationalElements />

      {/* Top Header & Navigation */}
      <div className="w-full max-w-5xl flex items-center justify-between py-2 z-10">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1.5 font-display">
              ClassTech
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md my-auto z-10">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_15px_45px_-10px_rgba(0,0,0,0.06)] p-6 sm:p-8">
          
          {/* Card Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-3 shadow-sm">
              <School className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Sign in to ClassTech
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select your role to access your school operations portal.
            </p>
          </div>

          {/* Role Mode Segmented Switcher */}
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200/80 flex gap-1 mb-6">
            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                roleMode === 'admin'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Class / Branch Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('superadmin')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                roleMode === 'superadmin'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 animate-fadeIn">
              <span className="font-bold">•</span>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {roleMode === 'admin' ? 'Official Email Address / Username' : 'Superadmin Username'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={roleMode === 'admin' ? 'admin@apex.com' : 'superadmin'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In as {roleMode === 'admin' ? 'Class Administrator' : 'Super Admin'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Student Mobile App Gateway Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-100 px-3.5 py-2 rounded-xl transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Student / Parent Mobile Portal</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Footer System Status */}
      <div className="py-4 text-center text-xs text-slate-400 z-10">
        <span>© {new Date().getFullYear()} ClassTech EdTech Systems · High Security 256-Bit SSL</span>
      </div>

    </div>
  );
};

export default Login;
