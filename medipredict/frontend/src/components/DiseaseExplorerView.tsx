import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface Disease {
  id: string;
  name: string;
  specialty: string;
  icd11_code: string;
  summary: string;
  pathophysiology: string;
  symptoms: string[];
  risk_factors: string[];
  diagnostic_tests: string[];
  prevention_and_lifestyle: string[];
  pubmed_references: { title: string; pmid: string; url: string }[];
}

export const DiseaseExplorerView: React.FC = () => {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('medipredict_bookmarked_diseases') || '[]');
    } catch {
      return [];
    }
  });

  const specialties = ['All', 'Endocrinology', 'Cardiology', 'Pulmonology', 'Neurology', 'Immunology', 'Nephrology'];

  const fetchDiseases = async () => {
    setLoading(true);
    try {
      const data = await api.listDiseases({
        search: search.trim() || undefined,
        specialty: selectedSpecialty !== 'All' ? selectedSpecialty : undefined,
      });
      setDiseases(data);
    } catch (err) {
      console.error('Failed to load diseases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiseases();
  }, [selectedSpecialty]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDiseases();
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = bookmarkedIds.includes(id)
      ? bookmarkedIds.filter(item => item !== id)
      : [...bookmarkedIds, id];
    setBookmarkedIds(updated);
    localStorage.setItem('medipredict_bookmarked_diseases', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 flex items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined text-9xl">biotech</span>
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-3">
            <span className="material-symbols-outlined text-sm">menu_book</span>
            Curated Clinical Reference Library
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">
            Disease Research Explorer
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed">
            Evidence-grounded disease profiles aligned with ICD-11 coding, clinical diagnostic criteria, laboratory investigation pathways, and peer-reviewed PubMed citations.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search diseases by name, symptom, or diagnostic test..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); fetchDiseases(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <span>Search</span>
          </button>
        </form>

        {/* Specialty Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">Specialty:</span>
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedSpecialty === spec
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spec}
            </button>
          ))}
          {bookmarkedIds.length > 0 && (
            <button
              onClick={() => {
                const bookmarked = diseases.filter(d => bookmarkedIds.includes(d.id));
                setDiseases(bookmarked);
              }}
              className="ml-auto inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium px-2 py-1 rounded bg-amber-50 border border-amber-200"
            >
              <span className="material-symbols-outlined text-sm">bookmark</span>
              Bookmarks ({bookmarkedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Disease Cards Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <span className="material-symbols-outlined animate-spin text-4xl text-blue-600 mb-2">progress_activity</span>
          <p className="text-slate-500 text-sm">Loading curated clinical profiles...</p>
        </div>
      ) : diseases.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-2">search_off</span>
          <h3 className="text-slate-700 font-medium">No matching disease profiles found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or switching specialties.
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedSpecialty('All'); fetchDiseases(); }}
            className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {diseases.map((d) => {
            const isBookmarked = bookmarkedIds.includes(d.id);
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDisease(d)}
                className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col p-5 group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-1.5">
                      {d.specialty}
                    </span>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-base">
                      {d.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                      {d.icd11_code}
                    </span>
                    <button
                      onClick={(e) => toggleBookmark(d.id, e)}
                      className={`p-1 rounded-full hover:bg-slate-100 transition-colors ${
                        isBookmarked ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Condition'}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {isBookmarked ? 'bookmark' : 'bookmark_border'}
                      </span>
                    </button>
                  </div>
                </div>

                <p className="text-slate-600 text-xs line-clamp-3 mb-4 leading-relaxed flex-1">
                  {d.summary}
                </p>

                {/* Key Symptoms */}
                <div className="mb-4">
                  <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                    Common Symptoms
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {d.symptoms.slice(0, 3).map((sym, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {sym}
                      </span>
                    ))}
                    {d.symptoms.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-50 font-medium">
                        +{d.symptoms.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                  <span className="inline-flex items-center gap-1">
                    <span>Clinical Profile & Citations</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {d.pubmed_references?.length || 0} citations
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disease Detail Modal */}
      {selectedDisease && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">medical_information</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{selectedDisease.name}</h2>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      ICD-11: {selectedDisease.icd11_code}
                    </span>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">{selectedDisease.specialty}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDisease(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overview</h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {selectedDisease.summary}
                </p>
              </div>

              {/* Pathophysiology */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pathophysiology & Disease Mechanism</h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  {selectedDisease.pathophysiology}
                </p>
              </div>

              {/* Two Column Layout: Symptoms & Risk Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-red-500 text-base">emergency</span>
                    Clinical Signs & Symptoms
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {selectedDisease.symptoms.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-blue-600 text-sm mt-0.5">check_circle</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-500 text-base">warning</span>
                    Known Risk Factors
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {selectedDisease.risk_factors.map((rf, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">priority_high</span>
                        <span>{rf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Diagnostic Tests & Lab Work */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-indigo-600 text-base">science</span>
                  Diagnostic Laboratory Workup & Tests
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDisease.diagnostic_tests.map((test, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium"
                    >
                      {test}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prevention & Evidence */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Prevention & Evidence-Based Interventions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
                  {selectedDisease.prevention_and_lifestyle.map((p, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5">health_and_safety</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peer-Reviewed PubMed Citations */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-600 text-base">library_books</span>
                  Evidence Citations (NCBI / PubMed)
                </h4>
                <div className="space-y-2">
                  {selectedDisease.pubmed_references.map((ref, idx) => (
                    <a
                      key={idx}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors flex items-center justify-between text-xs group"
                    >
                      <div className="flex-1 mr-3">
                        <div className="font-medium text-slate-800 group-hover:text-blue-700">{ref.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">PMID: {ref.pmid}</div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 text-sm">
                        open_in_new
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Clinical Advisory Disclaimer */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-600 text-base mt-0.5">verified_user</span>
                <div>
                  <strong>Educational & Clinical Reference Only:</strong> This information is synthesized from clinical guidelines and medical literature for scientific study. It does not constitute a formal diagnosis or personalized medical advice.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
