'use client';

import { useEffect, useState, useRef } from 'react';
import { Download, Loader2, Sparkles, AlertTriangle, ExternalLink, ChevronRight, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface ReportData {
  generated_at: string;
  executive_summary: {
    judul_laporan: string;
    periode: string;
    narasi: string;
    key_metrics: { label: string; value: string; trend: string }[];
  };
  sales_analysis: {
    ringkasan: string;
    total_volume: number;
    top_5: {
      rank: number;
      nama_produk: string;
      total_qty: number;
      persentase: string;
      alasan_naik: string;
      inovasi_kedepan: string;
    }[];
  };
  rnd_report: {
    ringkasan: string;
    produk_detail: {
      nama: string;
      kategori: string;
      fase: string;
      target_rilis: string;
      kecepatan_pengerjaan: string;
      potensi_produk: string;
      inovasi_kedepan: string;
    }[];
  };
  trending_recommendations: {
    ringkasan: string;
    produk_trending: {
      nama_produk: string;
      sumber_trend: string;
      alasan: string;
      potensi_untuk_perusahaan: string;
      estimasi_durasi: string;
    }[];
  };
  rnd_movement: {
    narasi_pergerakan: string;
    highlight_kemajuan: string;
    tantangan: string;
  };
  kesimpulan: {
    rangkuman: string;
    rekomendasi_utama: string[];
    catatan_penutup: string;
  };
  raw_data: {
    salesList: any[];
    rndList: any[];
    skuCount: number;
    rndCount: number;
    totalSalesVol: number;
    rndPhaseDistribution: Record<string, number>;
    topSalesAggregated: { name: string; total: number }[];
  };
}

const COLORS = ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7'];

const loadingSteps = [
  'Mengumpulkan semua data dari sistem...',
  'Menganalisis data penjualan & performa produk...',
  'Mengevaluasi pipeline R&D...',
  'Menganalisis tren pasar global & nasional...',
  'AI sedang menyusun laporan komprehensif...',
  'Finalisasi dokumen laporan...',
];

export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 3000);

    fetch('/api/ai/full-report')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Gagal memuat laporan');
        }
      })
      .catch(() => setError('Koneksi ke server gagal'))
      .finally(() => {
        clearInterval(interval);
        setLoading(false);
      });

    return () => clearInterval(interval);
  }, []);

  const handleDownloadPDF = () => window.print();

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-brand-primary animate-pulse" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Menyusun Laporan Lengkap...</h3>
        <div className="max-w-md w-full mt-4 space-y-2">
          {loadingSteps.map((step, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-500 ${i <= loadingStep ? 'opacity-100' : 'opacity-30'}`}>
              {i < loadingStep ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              ) : i === loadingStep ? (
                <Loader2 className="w-5 h-5 text-brand-primary animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
              )}
              <span className={i <= loadingStep ? 'text-gray-800 font-medium' : 'text-gray-400'}>{step}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-6">Powered by Gemini AI — Estimasi waktu: 15-30 detik</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Gagal Memuat Laporan</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-sm text-center">{error || 'Terjadi kesalahan. Coba refresh halaman.'}</p>
        <button onClick={() => window.location.reload()} className="mt-4 btn-primary text-sm">Coba Lagi</button>
      </div>
    );
  }

  const { executive_summary, sales_analysis, rnd_report, trending_recommendations, rnd_movement, kesimpulan, raw_data } = data;

  // Chart data
  const salesChartData = sales_analysis.top_5.map((s) => ({
    name: s.nama_produk.length > 20 ? s.nama_produk.substring(0, 20) + '...' : s.nama_produk,
    Volume: s.total_qty,
  }));

  const rndPieData = Object.entries(raw_data.rndPhaseDistribution).map(([name, value], i) => ({
    name, value, color: COLORS[i % COLORS.length],
  }));

  const topSalesBarData = raw_data.topSalesAggregated.slice(0, 10).map((s) => ({
    name: s.name.length > 18 ? s.name.substring(0, 18) + '...' : s.name,
    Penjualan: s.total,
  }));

  // Table of contents items
  const tocItems = [
    { num: '1', title: 'Ringkasan Eksekutif' },
    { num: '2', title: 'Analisis Penjualan — Top 5 Produk Teratas' },
    { num: '3', title: 'Laporan Perkembangan Produk R&D' },
    { num: '4', title: 'Rekomendasi Produk Trending' },
    { num: '5', title: 'Pergerakan & Kemajuan Divisi R&D' },
    { num: '6', title: 'Visualisasi Data' },
    { num: '7', title: 'Kesimpulan & Rekomendasi' },
  ];

  return (
    <div className="report-page-wrapper pb-20">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Divisi R&D</h1>
          <p className="text-sm text-gray-500 mt-1">Dokumen laporan lengkap — AI Generated</p>
        </div>
        <div className="flex gap-3">
          <a
            href="https://notebooklm.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
          >
            <ExternalLink className="w-4 h-4" /> Google NotebookLM
          </a>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 shadow-lg transition-all"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Document Container */}
      <div ref={reportRef} className="report-document">

        {/* ===== COVER ===== */}
        <div className="report-cover">
          <div className="report-cover-badge">
            <Sparkles className="w-3.5 h-3.5" /> AI-GENERATED REPORT
          </div>
          <h1 className="report-cover-title">{executive_summary.judul_laporan}</h1>
          <p className="report-cover-subtitle">PT. Shalee Berkah Jaya — Divisi Research & Development</p>
          <div className="report-cover-meta">
            <span>{today}</span>
            <span className="report-cover-divider">|</span>
            <span>{executive_summary.periode}</span>
          </div>
          <div className="report-cover-metrics">
            {executive_summary.key_metrics.map((m, i) => (
              <div key={i} className="report-cover-metric">
                <span className="report-cover-metric-value">{m.value}</span>
                <span className="report-cover-metric-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== TABLE OF CONTENTS ===== */}
        <div className="report-section">
          <h2 className="report-h2" style={{ borderBottom: 'none', marginBottom: '1rem' }}>Daftar Isi</h2>
          <div className="report-toc">
            {tocItems.map((item) => (
              <div key={item.num} className="report-toc-item">
                <span className="report-toc-num">Bab {item.num}</span>
                <span className="report-toc-title">{item.title}</span>
                <span className="report-toc-dots" />
              </div>
            ))}
          </div>
        </div>

        <div className="report-divider" />

        {/* ===== BAB 1: RINGKASAN EKSEKUTIF ===== */}
        <section className="report-section">
          <div className="report-chapter-label">Bab 1</div>
          <h2 className="report-h2">Ringkasan Eksekutif</h2>
          {executive_summary.narasi.split('\n').filter(Boolean).map((p, i) => (
            <p key={i} className="report-paragraph">{p}</p>
          ))}
        </section>

        <div className="report-divider" />

        {/* ===== BAB 2: ANALISIS PENJUALAN ===== */}
        <section className="report-section print-break-before">
          <div className="report-chapter-label">Bab 2</div>
          <h2 className="report-h2">Analisis Penjualan — Top 5 Produk Teratas</h2>
          {sales_analysis.ringkasan.split('\n').filter(Boolean).map((p, i) => (
            <p key={i} className="report-paragraph">{p}</p>
          ))}

          {/* Top 5 Chart */}
          {salesChartData.length > 0 && (
            <div className="report-chart-container">
              <h3 className="report-h3">Grafik Volume Penjualan — Top 5 Produk</h3>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={salesChartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }} width={160} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                    <Bar dataKey="Volume" fill="#1B4332" radius={[0, 4, 4, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="report-chart-caption">Gambar 2.1 — Volume penjualan top 5 produk (dalam pcs). Total volume keseluruhan: {sales_analysis.total_volume.toLocaleString()} pcs.</p>
            </div>
          )}

          {/* Per-product detail */}
          {sales_analysis.top_5.map((product, i) => (
            <div key={i} className="report-product-card">
              <h3 className="report-h3">
                <span className="report-rank-badge">#{product.rank}</span>
                {product.nama_produk}
                <span className="report-qty-badge">{product.total_qty.toLocaleString()} pcs ({product.persentase})</span>
              </h3>
              <div className="report-product-detail">
                <div>
                  <h4 className="report-h4">Analisis Penjualan</h4>
                  <p className="report-paragraph-sm">{product.alasan_naik}</p>
                </div>
                <div>
                  <h4 className="report-h4">Rekomendasi Inovasi</h4>
                  <p className="report-paragraph-sm">{product.inovasi_kedepan}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="report-divider" />

        {/* ===== BAB 3: R&D DEVELOPMENT ===== */}
        <section className="report-section print-break-before">
          <div className="report-chapter-label">Bab 3</div>
          <h2 className="report-h2">Laporan Perkembangan Produk R&D</h2>
          {rnd_report.ringkasan.split('\n').filter(Boolean).map((p, i) => (
            <p key={i} className="report-paragraph">{p}</p>
          ))}

          {rnd_report.produk_detail.map((product, i) => (
            <div key={i} className="report-rnd-card">
              <div className="report-rnd-header">
                <h3 className="report-h3" style={{ marginBottom: 0 }}>
                  {i + 1}. {product.nama}
                </h3>
                <div className="report-rnd-tags">
                  <span className="report-tag-category">{product.kategori}</span>
                  <span className="report-tag-phase">{product.fase}</span>
                  {product.target_rilis && <span className="report-tag-target">Target: {product.target_rilis}</span>}
                </div>
              </div>
              <div className="report-rnd-body">
                <div>
                  <h4 className="report-h4">Kecepatan Pengerjaan</h4>
                  <p className="report-paragraph-sm">{product.kecepatan_pengerjaan}</p>
                </div>
                <div>
                  <h4 className="report-h4">Potensi Produk</h4>
                  <p className="report-paragraph-sm">{product.potensi_produk}</p>
                </div>
                <div>
                  <h4 className="report-h4">Rekomendasi Inovasi</h4>
                  <p className="report-paragraph-sm">{product.inovasi_kedepan}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="report-divider" />

        {/* ===== BAB 4: TRENDING RECOMMENDATIONS ===== */}
        <section className="report-section print-break-before">
          <div className="report-chapter-label">Bab 4</div>
          <h2 className="report-h2">Rekomendasi Produk Trending</h2>
          {trending_recommendations.ringkasan.split('\n').filter(Boolean).map((p, i) => (
            <p key={i} className="report-paragraph">{p}</p>
          ))}

          <div className="report-trending-grid">
            {trending_recommendations.produk_trending.map((product, i) => (
              <div key={i} className="report-trending-card">
                <div className="report-trending-header">
                  <h3 className="report-h3" style={{ marginBottom: '0.25rem' }}>{product.nama_produk}</h3>
                  <div className="report-trending-source">
                    <span className="report-tag-source">{product.sumber_trend}</span>
                    <span className="report-tag-duration">{product.estimasi_durasi}</span>
                  </div>
                </div>
                <p className="report-paragraph-sm">{product.alasan}</p>
                <div className="report-trending-potential">
                  <h4 className="report-h4">Potensi untuk Perusahaan</h4>
                  <p className="report-paragraph-sm">{product.potensi_untuk_perusahaan}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="report-divider" />

        {/* ===== BAB 5: R&D MOVEMENT ===== */}
        <section className="report-section print-break-before">
          <div className="report-chapter-label">Bab 5</div>
          <h2 className="report-h2">Pergerakan & Kemajuan Divisi R&D</h2>
          {rnd_movement.narasi_pergerakan.split('\n').filter(Boolean).map((p, i) => (
            <p key={i} className="report-paragraph">{p}</p>
          ))}

          <div className="report-highlight-box">
            <h3 className="report-h3">Highlight Kemajuan</h3>
            {rnd_movement.highlight_kemajuan.split('\n').filter(Boolean).map((p, i) => (
              <p key={i} className="report-paragraph-sm">{p}</p>
            ))}
          </div>

          <div className="report-challenge-box">
            <h3 className="report-h3">Tantangan & Strategi</h3>
            {rnd_movement.tantangan.split('\n').filter(Boolean).map((p, i) => (
              <p key={i} className="report-paragraph-sm">{p}</p>
            ))}
          </div>
        </section>

        <div className="report-divider" />

        {/* ===== BAB 6: VISUALISASI ===== */}
        <section className="report-section print-break-before">
          <div className="report-chapter-label">Bab 6</div>
          <h2 className="report-h2">Visualisasi Data</h2>

          {/* R&D Phase Distribution Pie */}
          {rndPieData.length > 0 && (
            <div className="report-chart-container">
              <h3 className="report-h3">Distribusi Fase Development R&D</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={rndPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                      {rndPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="report-chart-caption">Gambar 6.1 — Distribusi produk berdasarkan fase development. Total: {raw_data.rndCount} produk R&D.</p>
            </div>
          )}

          {/* Top 10 Sales Bar */}
          {topSalesBarData.length > 0 && (
            <div className="report-chart-container">
              <h3 className="report-h3">Top 10 Produk — Volume Penjualan</h3>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={topSalesBarData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-35} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="Penjualan" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="report-chart-caption">Gambar 6.2 — Perbandingan volume penjualan top 10 produk (dalam pcs).</p>
            </div>
          )}

          {/* R&D Summary Table */}
          {raw_data.rndList.length > 0 && (
            <div className="report-chart-container">
              <h3 className="report-h3">Tabel Ringkasan Pipeline R&D</h3>
              <div className="overflow-x-auto">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama Produk</th>
                      <th>Kategori</th>
                      <th>Fase</th>
                      <th>Target Rilis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raw_data.rndList.map((r: any, i: number) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td className="font-medium">{r.nama_produk || '-'}</td>
                        <td>{r.kategori || '-'}</td>
                        <td><span className="report-table-badge">{r.fase_development || '-'}</span></td>
                        <td>{r.target_rilis || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="report-chart-caption">Tabel 6.1 — Daftar lengkap produk dalam pipeline R&D.</p>
            </div>
          )}
        </section>

        <div className="report-divider" />

        {/* ===== BAB 7: KESIMPULAN ===== */}
        <section className="report-section print-break-before">
          <div className="report-chapter-label">Bab 7</div>
          <h2 className="report-h2">Kesimpulan & Rekomendasi</h2>

          <h3 className="report-h3">Rangkuman</h3>
          {kesimpulan.rangkuman.split('\n').filter(Boolean).map((p, i) => (
            <p key={i} className="report-paragraph">{p}</p>
          ))}

          <h3 className="report-h3">Rekomendasi Strategis Utama</h3>
          <div className="report-recommendations">
            {kesimpulan.rekomendasi_utama.map((rec, i) => (
              <div key={i} className="report-rec-item">
                <div className="report-rec-num">{i + 1}</div>
                <p className="report-paragraph-sm" style={{ margin: 0 }}>{rec}</p>
              </div>
            ))}
          </div>

          <div className="report-closing-box">
            <h3 className="report-h3">Catatan Penutup</h3>
            {kesimpulan.catatan_penutup.split('\n').filter(Boolean).map((p, i) => (
              <p key={i} className="report-paragraph-sm">{p}</p>
            ))}
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <div className="report-footer">
          <div className="report-footer-line" />
          <p className="report-footer-text">CONFIDENTIAL — PT. Shalee Berkah Jaya | Divisi Research & Development</p>
          <p className="report-footer-text">Laporan ini di-generate secara otomatis oleh AI pada {today}</p>
          <p className="report-footer-text">Sistem R&D Intelligence — Powered by Gemini AI</p>
        </div>
      </div>
    </div>
  );
}
