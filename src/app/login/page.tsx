'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { Loader2, LogIn, Sparkles, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-[#0a1f16] to-[#08140f] relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand-secondary/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-primary/20 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-brand-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              top: `${15 + i * 15}%`,
              left: `${10 + i * 14}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md mx-4 relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl mb-6">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold text-white/80 tracking-wide">R&D Intelligence System</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Selamat Datang
          </h1>
          <p className="text-sm text-white/40">
            PT. Shalee Berkah Jaya — Masuk untuk melanjutkan
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
            <div className="p-2 bg-white/10 rounded-xl">
              <Shield className="w-5 h-5 text-brand-light" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Login</h2>
              <p className="text-[11px] text-white/30">Masukkan kredensial Anda</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light/50 focus:border-brand-light/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light/50 focus:border-brand-light/50 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-brand-secondary to-brand-primary hover:from-brand-accent hover:to-brand-secondary text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-white/20 mt-6">
            Hubungi Administrator untuk mendapatkan akun
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-white/15 mt-8">
          © {new Date().getFullYear()} PT. Shalee Berkah Jaya — R&D Division
        </p>
      </div>
    </div>
  );
}
