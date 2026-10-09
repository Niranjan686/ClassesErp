import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Lock, Mail, ArrowRight, ShieldCheck,
  Building2, Smartphone, CheckCircle2, UserCheck
} from 'lucide-react';
import api from '../api';

const Login = () => {
  const [roleMode, setRoleMode] = useState('admin'); // 'admin' | 'superadmin'
  const [identifier, setIdentifier] = useState('admin@k001.com');
  const [password, setPassword] = useState('Class@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      setError(err.response?.data?.message || 'Invalid email/username or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-800">
      
      {/* Top Header */}
      <div className="w-full max-w-5xl flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">ClassTech</span>
            <span className="text-xs text-slate-400 font-medium ml-1.5 hidden sm:inline">Administration Cloud</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          <span>Student App: Available on iOS & Android</span>
        </div>
      </div>

      {/* Center Minimalist Login Card */}
      <div className="w-full max-w-md my-auto py-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-7 sm:p-9">
          
          {/* Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to ClassTech</h1>
            <p className="text-xs text-slate-500 mt-1.5">
              Select your role and enter credentials to access your administrative dashboard
            </p>
          </div>

          {/* Role Selector Tabs (Only Class Admin & Super Admin) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                roleMode === 'admin'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Class Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('superadmin')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                roleMode === 'superadmin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {roleMode === 'admin' ? 'Institute Email or Username' : 'Superadmin Username'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={roleMode === 'admin' ? 'e.g. admin@k001.com' : 'superadmin'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {loading ? 'Authenticating...' : `Sign In as ${roleMode === 'admin' ? 'Class Admin' : 'Super Admin'}`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Reminder */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium">Demo account:</span>
            <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {roleMode === 'admin' ? 'admin@k001.com / Class@123' : 'superadmin / Scanid@1234'}
            </span>
          </div>
        </div>

        {/* Mobile Notice Card */}
        <div className="mt-4 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-800">Student & Guardian Access</p>
            <p className="text-slate-500 text-[11px]">Students access attendance, notes, and tests via the mobile app.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 py-3 gap-2 border-t border-slate-200/60">
        <p>© 2026 ClassTech Technologies. Multi-Tenant Institute ERP.</p>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Support Desk</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
