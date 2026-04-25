'use client';

import { useEffect, useState, useRef } from 'react';
import { FileText, Printer, Download, Loader2, Package, TrendingUp, FlaskConical, Sparkles, Calendar, BarChart3, Target, ArrowRight, Zap, PieChart, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';

interface ExecutiveData {
  summary: {
    judul: string;
    narasi_pembuka: string;
    highlight_rnd: string;
    rekomendasi_strategis: string;
    key_metrics: { label: string; value: string }[];
  };
  raw_data: {
    salesCount: number;
    skuCount: number;
    rndCount: number;
    totalSalesVol: number;
    rndList: any[];
    salesList: any[];
  };
}

export default function ReportPage() {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/ai/executive-summary')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json.data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-brand-primary animate-pulse" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Menyusun Executive Summary...</h3>
        <p className="text-sm text-gray-500 mt-2 text-center max-w-sm">
          AI sedang menganalisis keseluruhan data operasional, penjualan, dan R&D untuk membuat narasi laporan.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Gagal Memuat Laporan</h3>
        <p className="text-sm text-gray-500 mt-2">Terjadi kesalahan saat AI menyusun laporan. Coba refresh halaman.</p>
      </div>
    );
  }

  const { summary, raw_data } = data;

  // Process data for charts
  const topSalesChartData = raw_data.salesList
    .sort((a, b) => (Number(b.Qty) || Number(b.qty) || 0) - (Number(a.Qty) || Number(a.qty) || 0))
    .slice(0, 5)
    .map(s => ({
      name: (s['Nama Produk'] || s.nama_barang || '').substring(0, 15) + '...',
      Volume: Number(s.Qty) || Number(s.qty) || 0
    }));

  const rndPhaseCount: Record<string, number> = {};
  raw_data.rndList.forEach(r => {
    const phase = r.fase_development || 'Lainnya';
    rndPhaseCount[phase] = (rndPhaseCount[phase] || 0) + 1;
  });
  
  const COLORS = ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2'];
  const rndPieData = Object.keys(rndPhaseCount).map((key, index) => ({
    name: key,
    value: rndPhaseCount[key],
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6 pb-20">
      {/* Controls (hidden in print) */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Laporan R&D dan Market Intelligence</p>
        </div>
        <button onClick={handlePrint} className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-5 rounded-xl shadow-lg transition-all flex items-center gap-2">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      <div ref={reportRef} className="report-content print:m-0 print:p-0">
        
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Hero / Header Banner (Spans 3 columns) */}
          <div className="col-span-1 md:col-span-3 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1913] via-[#143327] to-[#1B4332] text-white p-8 md:p-10 shadow-2xl">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wider text-emerald-200 mb-6">
                  <Sparkles className="w-3.5 h-3.5" /> AI EXECUTIVE SYNTHESIS
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                  {summary.judul}
                </h1>
                <p className="text-emerald-100/80 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {today}
                </p>
              </div>
              
              <div className="flex gap-4">
                {summary.key_metrics.slice(0, 2).map((metric, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[120px]">
                    <p className="text-xs text-white/60 font-medium uppercase tracking-wider mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Main Executive Narrative (Spans 2 columns) */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm h-full flex flex-col justify-center">
              <div className="prose prose-emerald max-w-none">
                <p className="text-lg text-gray-800 leading-relaxed font-medium mb-6">
                  <span className="text-3xl text-brand-primary font-serif font-bold mr-2 float-left leading-none mt-1">"</span>
                  {summary.narasi_pembuka}
                </p>
                <div className="h-px w-16 bg-brand-primary/20 my-6"></div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-800 mb-3 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" /> Fokus R&D Saat Ini
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {summary.highlight_rnd}
                </p>
                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-800 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Rekomendasi Strategis
                  </h3>
                  <p className="text-emerald-900 font-medium leading-relaxed">
                    {summary.rekomendasi_strategis}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Metrics & Charts Side Panel (Spans 1 column) */}
          <div className="col-span-1 space-y-6">
            {/* Quick Stats Stack */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1B4332] text-white rounded-3xl p-5 shadow-sm">
                <Package className="w-6 h-6 text-emerald-400 mb-3" />
                <p className="text-3xl font-bold">{raw_data.skuCount}</p>
                <p className="text-xs text-emerald-200 mt-1 font-medium">Live Products</p>
              </div>
              <div className="bg-brand-accent text-emerald-950 rounded-3xl p-5 shadow-sm">
                <Zap className="w-6 h-6 text-emerald-800 mb-3" />
                <p className="text-3xl font-bold">{raw_data.rndCount}</p>
                <p className="text-xs text-emerald-800 mt-1 font-medium">Active R&D</p>
              </div>
            </div>

            {/* R&D Phase Chart */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600" /> Distribusi Fase R&D
              </h3>
              <div className="h-[200px] w-full">
                {rndPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={rndPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {rndPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">Belum ada data R&D</div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Top Sales Chart (Spans 2 columns) */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> Performa Penjualan Teratas
                </h3>
                <p className="text-sm text-gray-500 mt-1">Top 5 Produk penyumbang volume tertinggi</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Total Volume</p>
                <p className="text-2xl font-bold text-brand-primary">{raw_data.totalSalesVol.toLocaleString()} <span className="text-sm font-normal text-gray-500">pcs</span></p>
              </div>
            </div>
            
            <div className="h-[250px] w-full">
              {topSalesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSalesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 11, fontWeight: 500 }} width={120} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6' }} />
                    <Bar dataKey="Volume" fill="#1B4332" radius={[0, 6, 6, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">Belum ada data penjualan</div>
              )}
            </div>
          </div>

          {/* 5. Recent R&D Log (Spans 1 column) */}
          <div className="col-span-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-600" /> Pipeline R&D Terkini
            </h3>
            <div className="space-y-4">
              {raw_data.rndList.slice(-4).reverse().map((r, i) => (
                <div key={i} className="flex gap-4 items-start relative group">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-400 mt-2 z-10 relative">
                    <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20"></div>
                  </div>
                  {i !== raw_data.rndList.slice(-4).length - 1 && (
                    <div className="absolute top-3 left-[3px] w-[2px] h-[120%] bg-gray-100"></div>
                  )}
                  <div className="flex-1 bg-gray-50 hover:bg-emerald-50 rounded-2xl p-4 transition-colors border border-gray-100 hover:border-emerald-100">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{r.nama_produk || 'Project Tanpa Nama'}</h4>
                    </div>
                    <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full mb-2">
                      {r.fase_development || 'Ideasi'}
                    </span>
                    {r.target_rilis && (
                      <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-gray-400" /> Target: {r.target_rilis}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {raw_data.rndList.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">Belum ada pipeline R&D</p>
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* Footer Print Only */}
      <div className="hidden print:block text-center mt-8 text-[10px] text-gray-400">
        <p>CONFIDENTIAL — PT. Shalee Berkah Jaya R&D Intelligence System</p>
        <p>Generated via AI on {today}</p>
      </div>

    </div>
  );
}
