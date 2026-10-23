import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface ClinvarVariant {
  variant_id: string;
  hgvs_c: string;
  hgvs_p: string;
  classification: string;
  review_status: string;
  phenotype: string;
}

interface Gene {
  id: string;
  symbol: string;
  name: string;
  entrez_id: number;
  chromosome: string;
  cytoband: string;
  inheritance_pattern: string;
  summary: string;
  associated_conditions: string[];
  acmg_actionable: boolean;
  clinvar_variants: ClinvarVariant[];
  clinical_recommendations: string[];
}

export const GeneticsExplorerView: React.FC = () => {
  const [genes, setGenes] = useState<Gene[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedInheritance, setSelectedInheritance] = useState<string>('All');
  const [selectedGene, setSelectedGene] = useState<Gene | null>(null);

  const inheritanceOptions = ['All', 'Autosomal Dominant', 'Autosomal Recessive', 'Co-dominant / Multifactorial'];

  const fetchGenes = async () => {
    setLoading(true);
    try {
      const data = await api.listGenes({
        search: search.trim() || undefined,
        inheritance: selectedInheritance !== 'All' ? selectedInheritance : undefined,
      });
      setGenes(data);
    } catch (err) {
      console.error('Failed to load genes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenes();
  }, [selectedInheritance]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGenes();
  };

  const getVariantCountByClassification = (variants: ClinvarVariant[], type: string) => {
    return variants.filter((v) => v.classification.toLowerCase().includes(type.toLowerCase())).length;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 flex items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined text-9xl">genetics</span>
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-3">
            <span className="material-symbols-outlined text-sm">hub</span>
            ClinVar & NCBI Gene Evidence Hub
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">
            Gene & Genetics Explorer
          </h1>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Investigate genomic variants, ClinVar classifications, ACMG secondary findings recommendations, and chromosomal loci for clinically actionable genetic markers.
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
              placeholder="Search gene symbol (e.g., BRCA1, CFTR, APOE, LDLR) or condition..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); fetchGenes(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <span>Search Genes</span>
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">Inheritance:</span>
          {inheritanceOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setSelectedInheritance(opt)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedInheritance === opt
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Genes Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <span className="material-symbols-outlined animate-spin text-4xl text-emerald-600 mb-2">progress_activity</span>
          <p className="text-slate-500 text-sm">Querying NCBI Gene & ClinVar repositories...</p>
        </div>
      ) : genes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-2">dna</span>
          <h3 className="text-slate-700 font-medium">No matching genes found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Try searching for known markers such as BRCA1, CFTR, APOE, or LDLR.
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedInheritance('All'); fetchGenes(); }}
            className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {genes.map((gene) => {
            const pathogenicCount = getVariantCountByClassification(gene.clinvar_variants, 'Pathogenic');
            const vusCount = getVariantCountByClassification(gene.clinvar_variants, 'Uncertain');
            const benignCount = getVariantCountByClassification(gene.clinvar_variants, 'Benign');

            return (
              <div
                key={gene.id}
                onClick={() => setSelectedGene(gene)}
                className="bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col p-5 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 font-mono">
                        {gene.symbol}
                      </span>
                      {gene.acmg_actionable && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ACMG SF v3.2
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">{gene.name}</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[11px] font-mono font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                      Chr {gene.chromosome} ({gene.cytoband})
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">NCBI: {gene.entrez_id}</div>
                  </div>
                </div>

                <p className="text-slate-600 text-xs line-clamp-3 mb-4 leading-relaxed">
                  {gene.summary}
                </p>

                {/* Associated Conditions */}
                <div className="mb-4">
                  <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                    Associated Phenotypes
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {gene.associated_conditions.map((cond, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 text-[11px] font-medium"
                      >
                        {cond}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Variant Breakdown Metric Bar */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-2">
                    <span>Curated ClinVar Variants</span>
                    <span className="font-mono text-slate-500">{gene.clinvar_variants.length} total</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-red-50 border border-red-100 rounded p-1.5">
                      <div className="font-bold text-red-700">{pathogenicCount}</div>
                      <div className="text-[10px] text-red-500">Pathogenic</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded p-1.5">
                      <div className="font-bold text-amber-700">{vusCount}</div>
                      <div className="text-[10px] text-amber-500">VUS</div>
                    </div>
                    <div className="bg-slate-100 border border-slate-200 rounded p-1.5">
                      <div className="font-bold text-slate-700">{benignCount}</div>
                      <div className="text-[10px] text-slate-500">Benign / LB</div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-medium group-hover:translate-x-1 transition-transform">
                  <span className="inline-flex items-center gap-1">
                    <span>Examine ClinVar Variants & ACMG Guidance</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {gene.inheritance_pattern}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gene Detail Modal */}
      {selectedGene && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-mono font-bold text-lg">
                  DNA
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{selectedGene.symbol}</h2>
                    <span className="text-slate-500 text-xs font-normal">({selectedGene.name})</span>
                    {selectedGene.acmg_actionable && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ACMG Actionable
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>Locus: Chr {selectedGene.chromosome} ({selectedGene.cytoband})</span>
                    <span>•</span>
                    <span>Inheritance: {selectedGene.inheritance_pattern}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedGene(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Biological Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Biological Function & Significance</h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {selectedGene.summary}
                </p>
              </div>

              {/* ClinVar Variants Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-base">format_list_bulleted</span>
                    ClinVar Curated Variants ({selectedGene.clinvar_variants.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">NCBI ClinVar Database</span>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Variant ID</th>
                        <th className="py-2.5 px-3">HGVS.c (cDNA)</th>
                        <th className="py-2.5 px-3">HGVS.p (Protein)</th>
                        <th className="py-2.5 px-3">Classification</th>
                        <th className="py-2.5 px-3">Review Status</th>
                        <th className="py-2.5 px-3">Phenotype</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedGene.clinvar_variants.map((v, i) => {
                        const isPathogenic = v.classification.toLowerCase().includes('pathogenic');
                        const isVus = v.classification.toLowerCase().includes('uncertain');
                        return (
                          <tr key={i} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{v.variant_id}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{v.hgvs_c}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{v.hgvs_p}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isPathogenic
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : isVus
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {v.classification}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{v.review_status}</td>
                            <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={v.phenotype}>{v.phenotype}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Clinical Recommendations */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-teal-600 text-base">recommend</span>
                  Clinical Surveillance & ACMG Guidance
                </h4>
                <div className="space-y-2">
                  {selectedGene.clinical_recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-teal-50/60 border border-teal-100 text-xs text-teal-900 flex items-start gap-2">
                      <span className="material-symbols-outlined text-teal-700 text-sm mt-0.5">verified</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* NCBI Gene Link */}
              <div className="pt-2 flex justify-between items-center text-xs">
                <a
                  href={`https://www.ncbi.nlm.nih.gov/gene/${selectedGene.entrez_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  <span>Open Official NCBI Gene Record ({selectedGene.symbol})</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
                <span className="text-slate-400 text-[11px]">
                  Requires clinical genetic counselor confirmation
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
