import React from 'react';
import { FileText, RefreshCw, Trash2, CheckCircle2, Clock, AlertTriangle, Database } from 'lucide-react';
import api from '../../services/api.js';

export function DocumentStatusTable({ documents = [], onRefresh, loading = false }) {
  const handleReindex = async (id) => {
    try {
      await api.post(`/admin/documents/${id}/reindex`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to reindex:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document and all its indexed vector chunks?')) {
      return;
    }
    try {
      await api.delete(`/admin/documents/${id}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Ingested Knowledge Base</h3>
            <p className="text-xs text-slate-400">{documents.length} document(s) in vector index</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Document</th>
              <th className="py-3 px-4">Topic Category</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Chunks</th>
              <th className="py-3 px-4">Uploaded</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {documents.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-500">
                  No documents found in knowledge base. Upload your first PDF above.
                </td>
              </tr>
            )}

            {documents.map((doc) => {
              let statusBadge = null;
              if (doc.status === 'indexed') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Indexed
                  </span>
                );
              } else if (doc.status === 'processing') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 animate-pulse">
                    <Clock className="w-3 h-3 text-indigo-400" /> Processing
                  </span>
                );
              } else {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-rose-950/60 text-rose-300 border border-rose-800/50" title={doc.errorMessage}>
                    <AlertTriangle className="w-3 h-3 text-rose-400" /> Failed
                  </span>
                );
              }

              return (
                <tr key={doc._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="max-w-[200px] truncate">
                        <p className="font-semibold text-slate-100 truncate">{doc.originalName || doc.filename}</p>
                        <p className="text-[10px] text-slate-500">
                          {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : 'PDF'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium border border-slate-700">
                      {doc.topicCategory || 'Other'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{statusBadge}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-indigo-300 font-semibold">
                      {doc.numChunks || 0}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {new Date(doc.createdAt || doc.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleReindex(doc._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                        title="Re-index document"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete document and chunks"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DocumentStatusTable;
