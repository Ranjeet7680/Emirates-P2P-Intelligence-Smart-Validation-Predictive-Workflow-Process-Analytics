import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface Paper {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  pubdate: string;
  doi?: string;
  url: string;
  mesh_terms?: string[];
  collection_name?: string;
}

export const MedicalResearchView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [query, setQuery] = useState<string>('cardiovascular risk prediction artificial intelligence');
  const [results, setResults] = useState<Paper[]>([]);
  const [savedPapers, setSavedPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [citationModal, setCitationModal] = useState<{ pmid: string; title: string; style: string; citationText: string } | null>(null);
  const [citationLoading, setCitationLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const presetQueries = [
    'Cardiovascular risk prediction artificial intelligence',
    'Type 2 diabetes microvascular biomarkers HbA1c',
    'CRISPR Cas9 gene editing clinical trials oncology',
    'Hypertension resistant aldosterone guidelines',
    'Epigenetics aging DNA methylation clock',
  ];

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await api.searchPubMed(searchQuery, 10);
      setResults(data);
    } catch (err: any) {
      console.error('PubMed search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPapers = async () => {
    try {
      const data = await api.getSavedPapers();
      setSavedPapers(data);
    } catch (err) {
      console.error('Failed to load saved papers:', err);
    }
  };

  useEffect(() => {
    handleSearch('cardiovascular risk prediction artificial intelligence');
    loadSavedPapers();
  }, []);

  const handleSavePaper = async (paper: Paper) => {
    try {
      await api.savePaper(paper, 'Clinical Evidence Library');
      setNotification(`Saved "${paper.title.slice(0, 40)}..." to your library!`);
      setTimeout(() => setNotification(null), 3000);
      loadSavedPapers();
    } catch (err: any) {
      setNotification(`Failed to save paper: ${err.message}`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleOpenCitation = async (pmid: string, title: string, style = 'apa') => {
    setCitationLoading(true);
    setCitationModal({ pmid, title, style, citationText: 'Generating formatted citation...' });
    try {
      const data = await api.getCitation(pmid, style);
      setCitationModal({ pmid, title, style, citationText: data.citation || data.formatted_citation });
    } catch (err: any) {
      setCitationModal({ pmid, title, style, citationText: `Citation generation error: ${err.message}` });
    } finally {
      setCitationLoading(false);
    }
  };

  const switchCitationStyle = async (newStyle: string) => {
    if (!citationModal) return;
    setCitationLoading(true);
    try {
      const data = await api.getCitation(citationModal.pmid, newStyle);
      setCitationModal({ ...citationModal, style: newStyle, citationText: data.citation || data.formatted_citation });
    } catch (err: any) {
      setCitationModal({ ...citationModal, style: newStyle, citationText: `Citation error: ${err.message}` });
    } finally {
      setCitationLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification('Citation copied to clipboard!');
    setTimeout(() => setNotification(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 flex items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined text-9xl">school</span>
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-3">
            <span className="material-symbols-outlined text-sm">menu_book</span>
            National Library of Medicine (NCBI / PubMed) Integration
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">
            Medical Research Intelligence
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed">
            Query over 36 million citations from PubMed and MEDLINE with real-time abstract extraction, MeSH semantic indexing, and automated APA / BibTeX bibliographic formatting.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('search')}
          className={`pb-3 inline-flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'search'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">search</span>
          <span>PubMed Search ({results.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('saved'); loadSavedPapers(); }}
          className={`pb-3 inline-flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'saved'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">bookmarks</span>
          <span>Saved Research Library ({savedPapers.length})</span>
        </button>
      </div>

      {activeTab === 'search' ? (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  search
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter medical search query or MeSH keywords..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">manage_search</span>
                    <span>Query PubMed</span>
                  </>
                )}
              </button>
            </form>

            {/* Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">
                Topics:
              </span>
              {presetQueries.map((pq, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(pq); handleSearch(pq); }}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap text-[11px]"
                >
                  {pq}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          {loading ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <span className="material-symbols-outlined animate-spin text-4xl text-blue-600 mb-2">progress_activity</span>
              <p className="text-slate-500 text-sm">Retrieving peer-reviewed citations via PubMed E-Utilities...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-2">article</span>
              <h3 className="text-slate-700 font-medium">No citations found</h3>
              <p className="text-slate-500 text-sm mt-1">Try broadening your search query or MeSH medical keywords.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((paper) => (
                <div
                  key={paper.pmid}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors leading-snug inline-flex items-center gap-1.5 group"
                      >
                        <span>{paper.title}</span>
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 text-sm">open_in_new</span>
                      </a>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="font-medium text-slate-700">{paper.authors.join(', ')}</span>
                        <span>•</span>
                        <span className="italic">{paper.journal}</span>
                        <span>•</span>
                        <span>{paper.pubdate}</span>
                        <span>•</span>
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">PMID: {paper.pmid}</span>
                        {paper.doi && (
                          <span className="font-mono text-slate-400 text-[10px]">DOI: {paper.doi}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenCitation(paper.pmid, paper.title)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        title="Generate Citation"
                      >
                        <span className="material-symbols-outlined text-sm">format_quote</span>
                        <span>Cite</span>
                      </button>
                      <button
                        onClick={() => handleSavePaper(paper)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        title="Save to Library"
                      >
                        <span className="material-symbols-outlined text-sm">bookmark_add</span>
                        <span>Save</span>
                      </button>
                    </div>
                  </div>

                  {/* Abstract snippet */}
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                    {paper.abstract}
                  </p>

                  {/* MeSH Terms */}
                  {paper.mesh_terms && paper.mesh_terms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {paper.mesh_terms.map((term, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium"
                        >
                          #{term}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Saved Papers Tab */
        <div className="space-y-4">
          {savedPapers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-2">collections_bookmark</span>
              <h3 className="text-slate-700 font-medium">Your research collection is empty</h3>
              <p className="text-slate-500 text-sm mt-1">
                Save papers from the PubMed search tab to build your referenced collection.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedPapers.map((paper) => (
                <div
                  key={paper.pmid}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1">
                        {paper.collection_name || 'Clinical Library'}
                      </div>
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors block"
                      >
                        {paper.title}
                      </a>
                      <div className="text-xs text-slate-500 mt-1">
                        {paper.authors.join(', ')} • <em>{paper.journal}</em> • PMID: {paper.pmid}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenCitation(paper.pmid, paper.title)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">format_quote</span>
                      <span>Cite</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {paper.abstract}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Citation Generator Modal */}
      {citationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl">format_quote</span>
                <h3 className="font-bold text-slate-900 text-base">Citation Generator</h3>
              </div>
              <button
                onClick={() => setCitationModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium line-clamp-1">
              {citationModal.title}
            </p>

            {/* Citation Formats */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-400 text-[10px] uppercase">Format:</span>
              {(['apa', 'bibtex', 'vancouver'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => switchCitationStyle(fmt)}
                  className={`px-3 py-1 rounded-md transition-colors uppercase ${
                    citationModal.style === fmt
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {/* Formatted Text Box */}
            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                {citationLoading ? 'Generating citation...' : citationModal.citationText}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCitationModal(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => copyToClipboard(citationModal.citationText)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                <span>Copy Citation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
