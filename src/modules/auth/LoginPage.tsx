import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '../../shared/store/auth.store';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'superadmin@opsflow.com', password: 'Admin@2024' },
  { label: 'Admin', email: 'admin@opsflow.com', password: 'Admin@2024' },
  { label: 'Team Lead', email: 'teamlead@opsflow.com', password: 'Employee@2024' },
  { label: 'Employee', email: 'sara@opsflow.com', password: 'Employee@2024' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Bg blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-[420px]">
        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <Zap size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">OpsFlow ERP</h1>
            <p className="text-sm text-slate-400 mt-1">Enterprise Operations Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary hover:opacity-90 text-white font-semibold text-sm transition shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 size={15} className="animate-spin" />Signing in...</> : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6">
            <div className="text-xs text-center text-slate-500 mb-3 font-medium">Quick Demo Access</div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(a => (
                <button key={a.label} type="button"
                  onClick={() => { setEmail(a.email); setPassword(a.password); }}
                  className="px-3 py-2 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition">
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          © {new Date().getFullYear()} OpsFlow ERP — Internal Use Only
        </p>
      </div>
    </div>
  );
}
