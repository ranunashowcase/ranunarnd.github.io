'use client';

import { useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function UploadExcelForm() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [successData, setSuccessData] = useState<{ filename: string; count: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('Pilih file Excel terlebih dahulu', 'error');
      return;
    }

    setLoading(true);
    setSuccessData(null);

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/trending-master/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Berhasil sinkron ${data.count} baris!`, 'success');
        setSuccessData({ filename: file.name, count: data.count });
        setFile(null); // Reset input
      } else {
        showToast(data.error || 'Gagal memproses file excel', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan koneksi saat upload. Silakan coba file berukuran lebih kecil.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {successData && (
        <div className="p-4 bg-green-50 rounded-xl border border-green-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <span className="text-green-600 font-bold">✓</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-800">Data Berhasil Masuk!</h3>
            <p className="text-sm text-green-700 mt-1">
              File <span className="font-semibold">{successData.filename}</span> telah diproses. Total <span className="font-semibold">{successData.count} baris</span> berhasil ditambahkan.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        <div className={`border-2 border-dashed ${file ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200'} rounded-xl p-6 text-center hover:bg-gray-50 transition-colors`}>
          <UploadCloud className={`w-10 h-10 ${file ? 'text-brand-primary' : 'text-gray-400'} mx-auto mb-3`} />
          <p className="text-sm text-gray-500 mb-2">
            Upload file Excel (.xlsx / .csv) yang berisi rekap Tren Master.
          </p>
          {file && (
            <p className="text-xs font-semibold text-brand-primary bg-brand-primary/10 inline-block px-3 py-1 rounded-full mb-4">
              File terpilih: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-brand-primary/10 file:text-brand-primary
              hover:file:bg-brand-primary/20 cursor-pointer mx-auto"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !file} 
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Memproses File (Jangan ditutup)...
            </>
          ) : (
            'Upload & Sinkronisasi Data'
          )}
        </button>
      </form>
    </div>
  );
}
