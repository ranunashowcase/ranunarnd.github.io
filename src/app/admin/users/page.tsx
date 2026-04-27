'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { UserPlus, Loader2, Shield, Eye, Users, Mail, Key } from 'lucide-react';

interface UserInfo {
  user_id: string;
  email: string;
  nama: string;
  role: 'admin' | 'viewer';
}

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', nama: '', role: 'viewer' as 'admin' | 'viewer' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me?users=true');
      const json = await res.json();
      if (json.success && json.users) {
        setUsers(json.users);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
    else setLoading(false);
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        showToast('User berhasil ditambahkan!', 'success');
        setShowForm(false);
        setForm({ email: '', password: '', nama: '', role: 'viewer' });
        fetchUsers();
      } else {
        showToast(json.error || 'Gagal menambahkan user', 'error');
      }
    } catch {
      showToast('Koneksi error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Shield className="w-12 h-12 text-gray-200 mb-4" />
        <h2 className="text-lg font-bold text-gray-600">Akses Ditolak</h2>
        <p className="text-sm text-gray-400 mt-1">Hanya admin yang bisa mengakses halaman ini</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola User</h1>
          <p className="text-sm text-gray-400 mt-1">Tambah dan kelola akses user sistem — {users.length} user terdaftar</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Tambah User
        </button>
      </div>

      {/* Add User Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 animate-slide-up">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-primary" />
            Tambah User Baru
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Nama lengkap"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="user@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Role
                </label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'viewer' })}
                >
                  <option value="viewer">Viewer (Hanya Lihat)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Batal</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><UserPlus className="w-4 h-4" /> Tambah User</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-white text-xs font-bold">
                        {u.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{u.nama}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                      u.role === 'admin' ? 'text-amber-700 bg-amber-50 border border-amber-100' : 'text-blue-600 bg-blue-50 border border-blue-100'
                    }`}>
                      {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {u.role === 'admin' ? 'Admin' : 'Viewer'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
