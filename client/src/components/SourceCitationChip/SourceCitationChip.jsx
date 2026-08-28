import React, { useState } from 'react';
import { FileText, ExternalLink, BookOpen } from 'lucide-react';

export function SourceCitationChip({ source }) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!source) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-indigo-300 border border-slate-700/60 hover:border-indigo-500/50 transition-all duration-200 shadow-sm"
      >
        <FileText className="w-3.5 h-3.5 text-indigo-400" />
        <span className="max-w-[140px] truncate">{source.filename}</span>
        <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-200 rounded text-[10px] font-semibold">
          p. {source.pageNumber || 1}
        </span>
      </button>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-72 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl text-left pointer-events-none animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate max-w-[170px]">{source.filename}</span>
            </div>
            {source.similarityScore !== undefined && (
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                {(source.similarityScore * 100).toFixed(0)}% match
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
            "{source.snippet || 'Grounded excerpt extracted for factual verification.'}"
          </p>
          <div className="mt-1.5 text-[10px] text-slate-400 flex justify-between">
            <span>Verified Page {source.pageNumber || 1}</span>
            <span className="text-indigo-400">Campus Official Source</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SourceCitationChip;
