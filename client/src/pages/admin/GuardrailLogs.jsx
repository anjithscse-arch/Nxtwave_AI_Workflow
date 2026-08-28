import React, { useState, useEffect } from 'react';
import { ShieldAlert, Filter, RefreshCw, AlertTriangle, ShieldCheck, FileSpreadsheet, Lock } from 'lucide-react';
import api from '../../services/api.js';

export function GuardrailLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [totalBlocked, setTotalBlocked] = useState(0);
  const [selectedReason, setSelectedReason] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/guardrail-logs', {
        params: { reason: selectedReason || undefined }
      });
      setLogs(res.data.data.logs || []);
      setStats(res.data.data.stats || {});
      setTotalBlocked(res.data.data.totalBlocked || 0);
    } catch (err) {
      console.error('Failed to load guardrail logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedReason]);

  const categories = [
    { key: 'INSTRUCTION_OVERRIDE', label: 'Instruction Override', color: 'text-blue-400 bg-blue-950/60 border-blue-800/40' },
    { key: 'ROLE_PLAY_JAILBREAK', label: 'Role-Play Jailbreak', color: 'text-purple-400 bg-purple-950/60 border-purple-800/40' },
    { key: 'PROMPT_EXTRACTION', label: 'Prompt Extraction', color: 'text-amber-400 bg-amber-950/60 border-amber-800/40' },
    { key: 'ENCODED_PAYLOAD', label: 'Encoded Payload', color: 'text-rose-400 bg-rose-950/60 border-rose-800/40' },
    { key: 'ML_FLAGGED', label: 'ML Classifier Flagged', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40' }
  ];

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto space-y-6 overflow-y-auto pr-1">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">Guardrail Audit Logs</h2>
              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Active Security Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live audit trail of detected prompt-injection and jailbreak attempts
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Category Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((cat) => (
          <div
            key={cat.key}
            onClick={() => setSelectedReason(selectedReason === cat.key ? '' : cat.key)}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
              selectedReason === cat.key
                ? 'bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500'
                : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cat.color}`}>
              {cat.label}
            </span>
            <p className="text-xl font-mono font-bold text-slate-100 mt-2">
              {stats[cat.key] || 0}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Blocked Attempts</p>
          </div>
        ))}
      </div>

      {/* Log Records Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-200">
              {selectedReason ? `Filtered by: ${selectedReason}` : `All Blocked Logs (${totalBlocked} total)`}
            </span>
            {selectedReason && (
              <button
                onClick={() => setSelectedReason('')}
                className="text-[10px] text-indigo-400 hover:underline ml-2"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Reason Category</th>
                <th className="py-3 px-4">Blocked Prompt</th>
                <th className="py-3 px-4">Originating User</th>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-500">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No blocked requests match the criteria.
                  </td>
                </tr>
              )}

              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/50">
                      {log.blockReason}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-slate-200 truncate font-mono text-[11px] bg-slate-950/60 p-1.5 rounded border border-slate-800" title={log.content}>
                      {log.content}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-300">
                      {log.sessionId?.userId?.name || log.sessionId?.userId?.email || 'Anonymous Student'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    <span className="truncate max-w-[120px] block" title={log.sessionId?.title}>
                      {log.sessionId?.title || 'Session'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GuardrailLogs;
