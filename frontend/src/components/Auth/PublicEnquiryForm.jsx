import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, GraduationCap, CheckCircle2, Phone, Mail, User, BookOpen, Clock, Send } from 'lucide-react';
import api from '../../api';

const PublicEnquiryForm = () => {
  const { instituteCode = 'DEMO01' } = useParams();
  const [institute, setInstitute] = useState(null);
  const [formData, setFormData] = useState({
    candidateName: '',
    mobileNo: '',
    email: '',
    courseName: 'JEE Main & Advanced 2-Year Integrated',
    qualification: '10th Standard',
    preferredTiming: 'Morning (08:00 AM - 12:00 PM)',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/auth/institute-lookup/${instituteCode}`)
      .then(res => {
        if (res.data.success) setInstitute(res.data.data);
      })
      .catch(() => {});
  }, [instituteCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/enquiries/public-submit', {
        ...formData,
        instituteCode,
        leadSource: 'Website Enquiry',
      });
      if (res.data.success) {
        setSubmitted(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-yellow-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{institute ? institute.name : 'Apex Scholars Academy'}</h1>
          <p className="text-xs sm:text-sm text-blue-100 font-medium mt-1">Admissions & Counseling Enquiry Desk 2026-2027</p>
        </div>

        <div className="p-6 sm:p-8">
          {submitted ? (
            <div className="py-12 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">Enquiry Submitted!</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Thank you, <b>{formData.candidateName}</b>. Our academic counselor will get in touch with you at <b>{formData.mobileNo}</b> to schedule your free demo class.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Submit Another Enquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold rounded-xl">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Candidate Full Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.candidateName}
                      onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                      className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact Number *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9820112345"
                      value={formData.mobileNo}
                      onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                      className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="rahul@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Academic Class / Standard</label>
                  <select
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="10th Standard">10th Standard</option>
                    <option value="11th Standard">11th Standard</option>
                    <option value="12th Standard">12th Standard</option>
                    <option value="Repeater / Dropper">Repeater / Dropper</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Interested Course Program *</label>
                <div className="relative">
                  <select
                    required
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="JEE Main & Advanced 2-Year Integrated">JEE Main & Advanced 2-Year Integrated</option>
                    <option value="NEET UG Medical Booster Elite">NEET UG Medical Booster Elite</option>
                    <option value="Class 10 CBSE Board Masterclass">Class 10 CBSE Board Masterclass</option>
                    <option value="Class 12 Science (PCM / PCB) Fast-Track">Class 12 Science (PCM / PCB) Fast-Track</option>
                  </select>
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specific Queries / Target Goal</label>
                <textarea
                  rows="3"
                  placeholder="Tell us about your target exams, doubts or preferred demo timing..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Submitting Enquiry...' : 'Request Free Counseling & Demo Lecture'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Powered by <b>ClassTech SaaS</b></span>
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              Institute Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicEnquiryForm;
