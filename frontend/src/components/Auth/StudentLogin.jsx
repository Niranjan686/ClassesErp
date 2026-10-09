import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { Sparkles, ShieldCheck, GraduationCap, KeyRound, Smartphone, ArrowRight, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import api from '../../api';

const StudentLogin = () => {
  const [studentId, setStudentId] = useState('K001-2026-0001');
  const [password, setPassword] = useState('Demo@123');
  const [showPassword, setShowPassword] = useState(false);
  const [useOtp, setUseOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const containerRef = useRef(null);
  const formRef = useRef(null);
  const heroRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(heroRef.current, {
        opacity: 0,
        x: -30,
        duration: 0.7,
        ease: 'power3.out'
      });
      gsap.from(formRef.current, {
        opacity: 0,
        x: 30,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.1
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        identifier: studentId.trim(),
        studentIdentifier: studentId.trim(),
        username: studentId.trim(),
        password: useOtp ? undefined : password,
        otp: useOtp ? otp : undefined,
      };

      const res = await api.post('/auth/login', payload);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('student_token', res.data.token);
        localStorage.setItem('student_user', JSON.stringify(res.data.student || res.data.user));
        if (res.data.institute) {
          localStorage.setItem('student_institute', JSON.stringify(res.data.institute));
        }
        navigate('/student-portal');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Student ID or Credentials. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/40 to-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* Left Side: Modern Consumer App Hero */}
        <div ref={heroRef} className="lg:col-span-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-20 -top-20 w-60 h-60 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-xl shadow-lg">
                <GraduationCap className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">ClassTech Learning Hub</h2>
                <p className="text-xs text-blue-100 font-medium tracking-wider uppercase">Student & Parent Consumer App</p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-blue-100 backdrop-blur-sm border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> 2026 Learning Hub
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Your entire classroom in your pocket.
              </h1>
              <p className="text-sm text-blue-100/90 leading-relaxed">
                Join live video sessions, read watermarked lecture notes, track attendance heatmaps, and pay fees with 1 tap.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-3 pt-6 border-t border-white/15">
            <div className="flex items-center gap-2.5 text-xs text-blue-100 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Jitsi HD Live Video Classes</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-blue-100 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Smart QR Attendance & Leave Tracker</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-blue-100 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant Razorpay Fee Payment & PDF Receipts</span>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Student Login Form */}
        <div ref={formRef} className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Student Sign In</h3>
                <p className="text-xs text-slate-500 mt-1">Enter your Student ID / Mobile and Password</p>
              </div>
              <Link to="/login" className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
                Teacher / Admin Login →
              </Link>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Student ID or Registered Mobile
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. K001-2026-0001 or 9820110001"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <Smartphone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              {!useOtp ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseOtp(true)}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Login with OTP instead
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 absolute right-3.5 top-3.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      One-Time Password (OTP)
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseOtp(false)}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Login with Password
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 4 or 6-digit OTP (Demo: 1234)"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {loading ? 'Authenticating...' : 'Access Student Learning Hub'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>256-bit Encrypted Student Gateway</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">K001-2026-0001</span>
              <span>/</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">Demo@123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
