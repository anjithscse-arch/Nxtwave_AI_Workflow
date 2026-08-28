import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Lock, 
  Activity, 
  Layers,
  BookOpen
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';

export function Landing() {
  const { isAuthenticated, user } = useAuthStore();

  const destination = isAuthenticated
    ? user?.role === 'admin' ? '/admin/documents' : '/chat'
    : '/login';

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="h-20 border-b border-slate-800/80 px-6 md:px-12 flex items-center justify-between backdrop-blur-md bg-slate-950/60 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              CampusMind
            </span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              RAG + Guardrails
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to={destination}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all duration-200"
            >
              <span>Go to {user?.role === 'admin' ? 'Admin Portal' : 'Chat Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 md:px-12 py-16 md:py-24 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 shadow-md">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Multi-Layer Autonomous Guardrail Architecture</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl leading-tight">
          Grounded College Intelligence with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
            Multi-Agent Guardrails
          </span>
        </h1>

        <p className="text-sm md:text-base text-slate-400 max-w-2xl mt-5 mb-8 leading-relaxed">
          Ask natural-language questions about admissions, fees, hostel curfew, exam timetables, and academic policies. Every response is strictly grounded in verified admin documents with page citations.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to={destination}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all"
          >
            <Bot className="w-5 h-5" />
            <span>Launch CampusMind Chat</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-md transition-all"
          >
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Admin Console</span>
          </Link>
        </div>

        {/* Live Architecture Flow Card */}
        <div className="mt-16 w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-left">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">6-Stage RAG Pipeline Architecture</h3>
                <p className="text-xs text-slate-400">Sequential deterministic validation & streaming execution</p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full">
              Atlas Vector Search
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { num: '01', name: 'Guardrail', desc: 'Rule + ML Injection Filter' },
              { num: '02', name: 'Retrieval', desc: 'Vector Cosine Search' },
              { num: '03', name: 'Context', desc: 'Thresholding & Refusal' },
              { num: '04', name: 'Generation', desc: 'Gemini / Fallback LLM' },
              { num: '05', name: 'Citation', desc: 'Page-level Attribution' },
              { num: '06', name: 'Monitoring', desc: 'Real-time Socket Audit' }
            ].map((stage, idx) => (
              <div key={idx} className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono font-bold text-indigo-400">{stage.num}</span>
                <div className="mt-2">
                  <h4 className="text-xs font-bold text-slate-200">{stage.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="px-6 md:px-12 py-16 max-w-6xl mx-auto border-t border-slate-800/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Standalone Guardrail Layer</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Two-layer protection: Layer 1 rule heuristics for instruction-overrides and encoded payloads; Layer 2 JS-native TF-IDF probabilistic ML classifier.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Strict Source Citations</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Every factual assertion is attributed to its source document filename and page number. If facts are absent, the system explicitly refuses rather than hallucinating.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Live Stage Telemetry</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Socket.IO live streaming lets students and administrators watch each agent stage transition live with execution timing and similarity scores.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        CampusMind - Full-Stack RAG-Based College Chatbot with Multi-Agent Guardrails.
      </footer>
    </div>
  );
}

export default Landing;
