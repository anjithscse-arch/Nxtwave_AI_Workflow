import React from 'react';
import { 
  ShieldCheck, 
  Database, 
  Filter, 
  Sparkles, 
  Bookmark, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2 
} from 'lucide-react';

const STAGE_CONFIG = [
  {
    key: 'guardrail',
    name: 'Guardrail Agent',
    description: 'Screens query for injection & jailbreak attacks (Rule + ML)',
    icon: ShieldCheck,
    activeColor: 'text-blue-400 border-blue-500/50 bg-blue-950/40'
  },
  {
    key: 'retrieval',
    name: 'Retrieval Agent',
    description: 'Generates embedding and searches top-k document vectors',
    icon: Database,
    activeColor: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/40'
  },
  {
    key: 'context',
    name: 'Context Agent',
    description: 'Enforces similarity threshold & formats grounding context',
    icon: Filter,
    activeColor: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40'
  },
  {
    key: 'generation',
    name: 'Generation Agent',
    description: 'Produces grounded response strictly from retrieved sources',
    icon: Sparkles,
    activeColor: 'text-purple-400 border-purple-500/50 bg-purple-950/40'
  },
  {
    key: 'citation',
    name: 'Citation Agent',
    description: 'Extracts and deduplicates document filenames and page numbers',
    icon: Bookmark,
    activeColor: 'text-indigo-400 border-indigo-500/50 bg-indigo-950/40'
  },
  {
    key: 'monitoring',
    name: 'Monitoring Agent',
    description: 'Audits pipeline transition events and persists ChatLog record',
    icon: Activity,
    activeColor: 'text-amber-400 border-amber-500/50 bg-amber-950/40'
  }
];

export function PipelineTimeline({ liveTimeline = {}, isGenerating = false }) {
  const hasEvents = Object.keys(liveTimeline).length > 0;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live RAG Pipeline Timeline
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time multi-agent execution telemetry
            </p>
          </div>
        </div>
        {isGenerating && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> Processing
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {STAGE_CONFIG.map((stage, idx) => {
          const event = liveTimeline[stage.key];
          const Icon = stage.icon;

          let status = 'idle';
          let statusBadge = null;
          let containerClass = 'border-slate-800 bg-slate-950/40 text-slate-500 opacity-60';

          if (event) {
            status = event.status;
            if (status === 'running') {
              containerClass = `border-indigo-500/60 bg-indigo-950/30 text-indigo-200 shadow-md ${stage.activeColor} animate-glow opacity-100`;
              statusBadge = (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> RUNNING
                </span>
              );
            } else if (status === 'success') {
              containerClass = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300 opacity-100';
              statusBadge = (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  {event.durationMs ? `${event.durationMs}ms` : 'DONE'}
                </span>
              );
            } else if (status === 'blocked') {
              containerClass = 'border-rose-500/60 bg-rose-950/30 text-rose-300 opacity-100';
              statusBadge = (
                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400">
                  <XCircle className="w-3 h-3" /> BLOCKED
                </span>
              );
            } else if (status === 'warning') {
              containerClass = 'border-amber-500/50 bg-amber-950/20 text-amber-300 opacity-100';
              statusBadge = (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                  <AlertTriangle className="w-3 h-3" /> REFUSED
                </span>
              );
            } else if (status === 'error') {
              containerClass = 'border-rose-500/50 bg-rose-950/20 text-rose-300 opacity-100';
              statusBadge = (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-400">
                  <XCircle className="w-3 h-3" /> ERROR
                </span>
              );
            }
          }

          return (
            <div
              key={stage.key}
              className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-300 ${containerClass}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-[11px] font-bold tracking-tight text-slate-200">
                      {stage.name}
                    </span>
                  </div>
                  {statusBadge}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                  {event?.message || stage.description}
                </p>
              </div>

              {event?.metadata && Object.keys(event.metadata).length > 0 && (
                <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-400">
                  {event.metadata.aiProvider && (
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-indigo-300">
                      {event.metadata.aiProvider}
                    </span>
                  )}
                  {event.metadata.chunkCount !== undefined && (
                    <span>Chunks: {event.metadata.chunkCount}</span>
                  )}
                  {event.metadata.highestScore !== undefined && (
                    <span>Sim: {(event.metadata.highestScore).toFixed(2)}</span>
                  )}
                  {event.metadata.blockReason && (
                    <span className="text-rose-400 font-mono font-bold">
                      {event.metadata.blockReason}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PipelineTimeline;
