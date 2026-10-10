import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Lock, Mail, ArrowRight, ShieldCheck,
  Building2, Smartphone, Sparkles, Layers, Cpu
} from 'lucide-react';
import api from '../api';

const Login = () => {
  const [roleMode, setRoleMode] = useState('admin'); // 'admin' | 'superadmin'
  const [identifier, setIdentifier] = useState('admin@k001.com');
  const [password, setPassword] = useState('Class@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 3D Card Tilt State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleRoleSwitch = (role) => {
    setRoleMode(role);
    setError('');
    if (role === 'admin') {
      setIdentifier('admin@k001.com');
      setPassword('Class@123');
    } else {
      setIdentifier('superadmin');
      setPassword('Scanid@1234');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-100 relative overflow-hidden">
      
      {/* 3D Ambient Glowing Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="w-full max-w-5xl flex items-center justify-between py-2 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 border border-white/20 transform transition-transform hover:scale-105">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-xl text-white tracking-tight flex items-center gap-1.5">
              ClassTech <span className="text-[10px] uppercase font-extrabold bg-blue-500/20 border border-blue-400/30 text-blue-300 px-2 py-0.5 rounded-full">3D ERP</span>
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Next-Gen Multi-Tenant Cloud</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 bg-white/5 border border-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-inner">
          <Smartphone className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
          <span className="hidden sm:inline">Dedicated Student Mobile App Available</span>
          <span className="sm:hidden">Student App</span>
        </div>
      </div>

      {/* Center 3D Tilt Card */}
      <div className="w-full max-w-md my-auto py-6 z-10" style={{ perspective: 1000 }}>
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: tilt.x === 0 && tilt.y === 0 ? 'all 0.5s ease' : 'none',
          }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] p-7 sm:p-9 relative group"
        >
          {/* Subtle Top 3D Light Sheen */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
          
          {/* Title & Badge */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-300 mb-3">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>Unified Institutional Portal</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Admin & Superadmin Access</h1>
            <p className="text-xs text-slate-400 mt-1.5">
              Secure biometric & cloud access for coaching operations
            </p>
          </div>

          {/* 3D Segmented Role Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={`py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
                roleMode === 'admin'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Class Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('superadmin')}
              className={`py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
                roleMode === 'superadmin'
                  ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md shadow-slate-900/50 border border-white/10 scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Super Admin</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-medium text-rose-300 flex items-center gap-2 animate-shake">
              <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {roleMode === 'admin' ? 'Institute Email or Username' : 'Superadmin Username'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={roleMode === 'admin' ? 'admin@k001.com' : 'superadmin'}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            {/* 3D Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <span>Authenticating with Cloud...</span>
              ) : (
                <>
                  <span>Sign In as {roleMode === 'admin' ? 'Class Admin' : 'Super Admin'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Hint */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-medium">Test credentials:</span>
            <span className="font-mono font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg">
              {roleMode === 'admin' ? 'admin@k001.com / Class@123' : 'superadmin / Scanid@1234'}
            </span>
          </div>
        </div>

        {/* 3D Student App Floating Notice Card */}
        <div className="mt-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-3 transform transition-all hover:translate-y-[-2px]">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span>Student & Parent Portal</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">APP ONLY</span>
            </p>
            <p className="text-slate-400 text-[11px] mt-0.5">Students log in via mobile number + OTP on the mobile app.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 py-3 gap-2 border-t border-white/5 z-10">
        <p>© 2026 ClassTech ERP Technologies • Multi-Tenant Engine</p>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hover:text-slate-300 cursor-pointer">Security Protocol</span>
          <span className="hover:text-slate-300 cursor-pointer">Terms & Compliance</span>
          <span className="hover:text-slate-300 cursor-pointer">Status: 99.99% Uptime</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
