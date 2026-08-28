import React, { useState, useEffect } from 'react';
import { User, Shield, Cpu, Activity, CheckCircle2, AlertCircle, RefreshCw, Key } from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import api from '../services/api.js';

export function Settings() {
  const { user } = useAuthStore();
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/health');
      setHealthData(res.data);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto space-y-6 overflow-y-auto pr-1">
      {/* Profile Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-600/30">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{user?.name}</h2>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Shield className="w-3 h-3" />
              <span>Role: {user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Provider Health & Diagnostics */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">AI Provider & Diagnostics</h3>
              <p className="text-xs text-slate-400">Status of Gemini LLM and deterministic fallback engine</p>
            </div>
          </div>
          <button
            onClick={fetchHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Active Generation Engine
            </p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${
                healthData?.aiProvider === 'gemini'
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
              }`}>
                {healthData?.aiProvider || 'Detecting...'}
              </span>
              {healthData?.geminiConfigured ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Gemini Key Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Activity className="w-4 h-4 text-emerald-400" /> Offline Extractive Fallback Mode
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              When Gemini API key is not supplied, the system seamlessly uses JS-native TF-IDF BM25 extractive synthesis for grading and offline development.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Server Telemetry
            </p>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">System Status:</span>
                <span className="text-emerald-400 font-bold uppercase">{healthData?.status || 'Healthy'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Node Runtime:</span>
                <span className="font-mono text-slate-300">{healthData?.nodeVersion || 'v24'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Uptime:</span>
                <span>{healthData?.uptimeSeconds ? `${healthData.uptimeSeconds} seconds` : 'Active'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RAG & Guardrail Parameters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">RAG & Guardrail Parameters</h3>
            <p className="text-xs text-slate-400">Runtime threshold configuration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <p className="text-slate-500 mb-1">Similarity Threshold</p>
            <p className="text-lg font-mono font-bold text-indigo-300">0.35</p>
            <p className="text-[10px] text-slate-500 mt-1">Minimum cosine score for grounding context</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <p className="text-slate-500 mb-1">Top-K Retrieval</p>
            <p className="text-lg font-mono font-bold text-cyan-300">5 Chunks</p>
            <p className="text-[10px] text-slate-500 mt-1">Maximum candidate chunks per query</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <p className="text-slate-500 mb-1">Guardrail ML Cutoff</p>
            <p className="text-lg font-mono font-bold text-amber-300">0.70 Confidence</p>
            <p className="text-[10px] text-slate-500 mt-1">TF-IDF probabilistic jailbreak threshold</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
