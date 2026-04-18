'use client';

import { useEffect, useState } from 'react';
import { Flame, Loader2, Box, Layout, DollarSign, PlayCircle, ExternalLink, BrainCircuit, Clock, ShieldAlert, TrendingUp, Lightbulb, Plus, Star, Trash2 } from 'lucide-react';
import { getDirectImageUrl, getTikTokEmbedUrl } from '@/lib/utils';
import Link from 'next/link';

interface TrendItem {
  timestamp: string;
  tipe_trend: string;
  nama_produk: string;
  ukuran_gramasi: string;
  harga_referensi: string;
  link_medsos: string;
  foto_url: string;
  ai_analisis: string;
  ai_referensi: string;
  ai_durasi: string;
  ai_resiko: string;
  ai_keuntungan: string;
  ai_skor: number;
}

export default function TrendViralPage() {
  const [data, setData] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Trend Produk' | 'Trend Packaging Unik'>('All');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products/market-watch');
      const json = await res.json();
      if (json.success) setData(json.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (timestamp: string, nama: string) => {
    if (!confirm(`Hapus produk "${nama}" dari daftar trending?`)) return;
    setDeleting(timestamp);
    try {
      const res = await fetch(`/api/products/market-watch?timestamp=${encodeURIComponent(timestamp)}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setData((prev) => prev.filter((d) => d.timestamp !== timestamp));
        setExpanded(null);
      } else {
        alert('Gagal menghapus: ' + (json.error || 'Unknown error'));
      }
    } catch {
      alert('Gagal menghapus data');
    } finally {
      setDeleting(null);
    }
  };

  const filteredData = filter === 'All' ? data : data.filter((d) => d.tipe_trend === filter);

  function getScoreColor(score: number) {
    if (score >= 75) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flame className="w-6 h-6 text-brand-primary" />
            Produk Trending
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Pantau produk & packaging pesaing yang sedang viral — dianalisis AI secara otomatis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
            {['All', 'Trend Produk', 'Trend Packaging Unik'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filter === f
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {f === 'All' ? 'Semua' : f.replace('Trend ', '')}
              </button>
            ))}
          </div>
          <Link href="/admin/products/market-watch" className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Input Baru
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Flame className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">Belum Ada Data Trend</h3>
          <p className="text-sm text-gray-400 mb-4">Mulai kumpulkan referensi viral pertama Anda.</p>
          <Link href="/admin/products/market-watch" className="btn-primary inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Input Market Watch
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredData.map((item, idx) => {
            const isPackaging = item.tipe_trend === 'Trend Packaging Unik';
            const tiktokEmbed = getTikTokEmbedUrl(item.link_medsos);
            const isExpanded = expanded === idx;

            return (
              <div key={idx} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                {/* Header Strip */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/50">
                   <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${isPackaging ? 'bg-pink-500' : 'bg-brand-primary'}`}>
                        {isPackaging ? <Box className="w-3.5 h-3.5" /> : <Layout className="w-3.5 h-3.5" />}
                        {isPackaging ? 'Packaging Unik' : 'Produk Viral'}
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                         {item.timestamp ? new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                      </span>
                   </div>
                   {item.ai_skor > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Skor Kelayakan</span>
                        <div className={`px-3 py-1 rounded-full border bg-white flex items-center gap-1 border-gray-200 shadow-sm ${getScoreColor(item.ai_skor)}`}>
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-black">{item.ai_skor}</span>
                          <span className="text-[10px] font-bold opacity-70">/100</span>
                        </div>
                      </div>
                    )}
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(item.timestamp, item.nama_produk)}
                      disabled={deleting === item.timestamp}
                      className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Hapus produk ini"
                    >
                      {deleting === item.timestamp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row p-6 gap-8">
                  {/* Left: Media Block (Smaller Width) */}
                  <div className="w-full lg:w-[240px] flex-shrink-0 flex flex-col gap-3">
                    <div className="w-full aspect-[9/16] bg-black rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center">
                      {tiktokEmbed ? (
                        <iframe
                          src={tiktokEmbed}
                          className="w-full h-full border-none absolute inset-0"
                          allowFullScreen
                          scrolling="no"
                          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        ></iframe>
                      ) : item.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.foto_url.startsWith('/') ? item.foto_url : getDirectImageUrl(item.foto_url)}
                          alt={item.nama_produk}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="text-gray-500 flex flex-col items-center">
                          <PlayCircle className="w-12 h-12 mb-3 opacity-30" />
                          <span className="text-[10px] font-medium text-gray-400">No Media</span>
                        </div>
                      )}
                    </div>
                    {item.link_medsos && (
                      <a href={item.link_medsos} target="_blank" rel="noopener noreferrer" className="btn-ghost flex items-center justify-center w-full bg-blue-50 text-blue-600 hover:bg-blue-100 py-2.5 rounded-xl transition-colors">
                        <ExternalLink className="w-4 h-4 mr-1.5" /> Buka Video Asli
                      </a>
                    )}
                  </div>

                  {/* Right: Content Block */}
                  <div className="flex-1 flex flex-col min-w-0 justify-between">
                    <div>
                      <h2 className="text-3xl font-black text-gray-900 leading-tight mb-6">{item.nama_produk}</h2>

                      {/* Quick Info Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"><Box className="w-3.5 h-3.5"/> Ukuran Granulasi</p>
                          <p className="text-base font-bold text-gray-900">{item.ukuran_gramasi || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5"/> Harga Referensi</p>
                          <p className="text-base font-bold text-gray-900">{item.harga_referensi || '-'}</p>
                        </div>
                      </div>

                      {/* Prediksi Durasi (Which AI makes very long sometimes) */}
                      {item.ai_durasi && (
                        <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 relative overflow-hidden group">
                          {/* Pattern Background */}
                          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
                          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500 delay-100" />
                          
                          <div className="flex gap-4 relative z-10">
                            <div className="p-2.5 bg-white text-blue-500 rounded-xl flex-shrink-0 h-fit shadow-sm border border-blue-100/50">
                              <Clock className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-1.5">Estimasi Durasi Trend</h3>
                              <p className="text-sm text-blue-900/80 leading-relaxed max-w-2xl">{item.ai_durasi}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Referensi Produk Serupa - Visual Cards */}
                    {item.ai_referensi && (() => {
                      // Try to parse AI referensi as JSON array
                      let refs: { nama: string; brand: string; harga: string; deskripsi: string }[] = [];
                      try {
                        const jsonMatch = item.ai_referensi.match(/\[[\s\S]*\]/);
                        if (jsonMatch) {
                          refs = JSON.parse(jsonMatch[0]);
                        }
                      } catch {
                        // fallback: not valid JSON
                      }

                      return (
                        <div className="mt-6">
                          <h3 className="text-[11px] font-black text-purple-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-purple-500" />
                            Produk & Brand Serupa di Pasaran
                          </h3>

                          {refs.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                              {refs.map((ref, refIdx) => (
                                <div key={refIdx} className="bg-white border border-purple-100 rounded-2xl p-4 hover:shadow-md hover:border-purple-200 transition-all group">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <p className="text-sm font-bold text-gray-900 leading-tight">{ref.nama}</p>
                                      <p className="text-xs text-purple-600 font-semibold">{ref.brand}</p>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg whitespace-nowrap">{ref.harga}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{ref.deskripsi}</p>
                                  <div className="flex gap-2">
                                    <a
                                      href={`https://www.tiktok.com/search?q=${encodeURIComponent(ref.nama + ' ' + ref.brand)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-[10px] font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                    >
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.38-6.22V8.89a8.18 8.18 0 0 0 3.84.96V6.69Z"/></svg>
                                      Cari di TikTok
                                    </a>
                                    <a
                                      href={`https://www.tokopedia.com/search?q=${encodeURIComponent(ref.nama)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      Cek Harga
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Fallback: show as plain text if AI didn't return JSON */
                            <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100">
                              <p className="text-sm text-purple-900/80 leading-relaxed whitespace-pre-line">{item.ai_referensi}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}


                    {/* Button Accordion */}
                    <div className="mt-8">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : idx)}
                        className={`group flex items-center justify-between w-full p-5 rounded-2xl border-2 font-bold transition-all ${
                          isExpanded 
                            ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' 
                            : 'bg-white text-gray-700 border-gray-100 hover:border-brand-primary/30 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-white/20' : 'bg-brand-accent/10 text-brand-accent group-hover:bg-brand-accent/20'}`}>
                            <BrainCircuit className="w-5 h-5" />
                          </div>
                          Buka Detail Riset Pasar & Rekomendasi R&D
                        </span>
                        <span className={`text-sm transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dropdown Deep Analysis AI */}
                {isExpanded && (
                  <div className="border-t-2 border-dashed border-gray-100 p-8 bg-gray-50/50 animate-slide-up">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       {/* Kiri: Analisis & Referensi */}
                       <div className="space-y-6">
                         {item.ai_analisis && (
                           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                             <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2.5 mb-4 pb-4 border-b border-gray-50">
                               <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                 <BrainCircuit className="w-4 h-4 text-indigo-500" />
                               </div>
                               Analisis Mendalam AI
                             </h3>
                             <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line text-justify">{item.ai_analisis}</p>
                           </div>
                         )}


                       </div>

                       {/* Kanan: Resiko & Keuntungan */}
                       <div className="space-y-6">
                         {item.ai_keuntungan && (
                           <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/60">
                             <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2.5 mb-4 pb-4 border-b border-emerald-100/50">
                               <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                 <TrendingUp className="w-4 h-4 text-emerald-500" />
                               </div>
                               Potensi Keuntungan Manufaktur
                             </h3>
                             <ul className="text-sm text-emerald-900/80 leading-relaxed whitespace-pre-line text-justify list-inside">
                               {item.ai_keuntungan}
                             </ul>
                           </div>
                         )}

                         {item.ai_resiko && (
                           <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100/60">
                             <h3 className="text-sm font-bold text-red-800 flex items-center gap-2.5 mb-4 pb-4 border-b border-red-100/50">
                               <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                 <ShieldAlert className="w-4 h-4 text-red-500" />
                               </div>
                               Ancaman & Resiko Pasar
                             </h3>
                             <ul className="text-sm text-red-900/80 leading-relaxed whitespace-pre-line text-justify list-inside">
                               {item.ai_resiko}
                             </ul>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
