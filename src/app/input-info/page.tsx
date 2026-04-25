'use client';

import { useEffect, useState } from 'react';
import { BrainCircuit, Send, Loader2, FileText, Clock, Tag, BookOpen, Upload } from 'lucide-react';
import { InputInformation } from '@/types';
import { useToast } from '@/components/ui/Toast';

export default function InputInfoPage() {
  const [entries, setEntries] = useState<InputInformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    judul: '',
    kategori_info: 'Trend Pasar',
    sumber: 'Gemini Deep Research',
    konten: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [inputType, setInputType] = useState<'text' | 'pdf'>('pdf'); // default to PDF based on user preference

  const categories = [
    'Trend Pasar',
    'Competitor Analysis',
    'Consumer Behavior',
    'Ingredient Research',
    'Market Size & Data',
    'Social Media Trend',
    'Marketplace Insight',
    'Lainnya',
  ];

  const sources = [
    'Gemini Deep Research',
    'ChatGPT Research',
    'Manual Research',
    'Industry Report',
    'News Article',
    'Social Media Monitoring',
    'Lainnya',
  ];

  const fetchEntries = () => {
    setLoading(true);
    fetch('/api/input-info')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setEntries(json.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.judul) {
      showToast('Judul wajib diisi', 'error');
      return;
    }
    
    if (inputType === 'text' && !form.konten) {
      showToast('Konten teks wajib diisi', 'error');
      return;
    }

    if (inputType === 'pdf' && !file) {
      showToast('File PDF wajib diupload', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('judul', form.judul);
      formData.append('kategori_info', form.kategori_info);
      formData.append('sumber', form.sumber);
      
      if (inputType === 'pdf' && file) {
        formData.append('file', file);
      } else {
        formData.append('konten', form.konten);
      }

      const res = await fetch('/api/input-info', {
        method: 'POST',
        body: formData, // fetch will automatically set the correct multipart/form-data headers
      });
      
      const data = await res.json();
      if (data.success) {
        showToast('Data berhasil disimpan! AI sekarang punya konteks lebih kaya.', 'success');
        setForm({ judul: '', kategori_info: 'Trend Pasar', sumber: 'Gemini Deep Research', konten: '' });
        setFile(null);
        fetchEntries();
      } else {
        showToast(data.error || 'Gagal menyimpan', 'error');
      }
    } catch {
      showToast('Koneksi error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      'Trend Pasar': 'bg-blue-50 text-blue-600 border-blue-100',
      'Competitor Analysis': 'bg-red-50 text-red-600 border-red-100',
      'Consumer Behavior': 'bg-green-50 text-green-600 border-green-100',
      'Ingredient Research': 'bg-purple-50 text-purple-600 border-purple-100',
      'Market Size & Data': 'bg-amber-50 text-amber-600 border-amber-100',
      'Social Media Trend': 'bg-pink-50 text-pink-600 border-pink-100',
      'Marketplace Insight': 'bg-cyan-50 text-cyan-600 border-cyan-100',
    };
    return colors[cat] || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Input Informasi (Knowledge Base)</h1>
        <p className="text-sm text-gray-400 mt-1">
          Tambahkan hasil deep research berbasis teks atau PDF File untuk memperkaya otak AI
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-3">
        <BrainCircuit className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-indigo-800">Sistem Ekstraksi Otomatis</h3>
          <p className="text-xs text-indigo-600/70 mt-1 leading-relaxed">
            Upload file riset dalam bentuk <strong>PDF</strong>. Sistem akan langsung membaca isi dari PDF tersebut, mengekstrak teks pentingnya saja, dan menyimpan teks tersebut secara permanen. File asli akan dibuang untuk menghemat server.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 sticky top-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-primary" />
                Input Data Riset Baru
              </h2>
            </div>

            {/* Input Type Toggles */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setInputType('pdf')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  inputType === 'pdf' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="w-3 h-3" /> Upload PDF
              </button>
              <button
                type="button"
                onClick={() => setInputType('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  inputType === 'text' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-3 h-3" /> Paste Teks
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Judul Riset <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Trend Kurma 2024 di Indonesia"
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label flex items-center gap-1"><Tag className="w-3 h-3" /> Kategori</label>
                  <select className="form-select" value={form.kategori_info} onChange={(e) => setForm({ ...form, kategori_info: e.target.value })}>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label flex items-center gap-1"><BookOpen className="w-3 h-3" /> Sumber</label>
                  <select className="form-select" value={form.sumber} onChange={(e) => setForm({ ...form, sumber: e.target.value })}>
                    {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {inputType === 'pdf' ? (
                <div>
                  <label className="form-label">Upload File PDF <span className="text-red-500">*</span></label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept=".pdf"
                      required={inputType === 'pdf'}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="flex justify-center text-sm text-gray-600">
                        <span className="relative font-medium text-brand-primary">
                          Pilih file PDF
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Maksimal 10MB</p>
                    </div>
                  </div>
                  {file && (
                    <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      ✅ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="form-label">Konten Teks Riset <span className="text-red-500">*</span></label>
                  <textarea
                    className="form-input min-h-[200px] resize-y"
                    placeholder="Paste hasil deep research berupa teks/data di sini..."
                    value={form.konten}
                    onChange={(e) => setForm({ ...form, konten: e.target.value })}
                    required={inputType === 'text'}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{form.konten.length} karakter</p>
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {inputType === 'pdf' ? 'Mengekstrak PDF...' : 'Menyimpan...'}</>
                ) : (
                  <><Send className="w-4 h-4" /> Simpan ke Database AI</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Entries */}
        <div className="lg:col-span-3">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            Data Riset Tersimpan ({entries.length})
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
              <BrainCircuit className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Belum ada data riset</p>
              <p className="text-xs text-gray-300 mt-1">Upload PDF pertama Anda untuk memperkaya AI</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...entries].reverse().map((entry, i) => (
                <div key={entry.info_id || i} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 hover:shadow-card-hover transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{entry.judul}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${getCategoryColor(entry.kategori_info)}`}>
                          {entry.kategori_info}
                        </span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{entry.sumber}</span>
                      </div>
                    </div>
                    {entry.created_at && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0 ml-3">
                        <Clock className="w-3 h-3" />
                        {new Date(entry.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-mono bg-gray-50 p-3 rounded-lg border border-gray-100 line-clamp-4">
                    {entry.konten}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
