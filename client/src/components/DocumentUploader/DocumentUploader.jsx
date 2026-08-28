import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api.js';

const CATEGORIES = [
  'Admissions',
  'Departments',
  'Courses',
  'Fees',
  'Exams',
  'Academic Calendar',
  'Hostel',
  'Library',
  'Clubs',
  'Placements',
  'Scholarships',
  'Policies',
  'Events',
  'Other'
];

export function DocumentUploader({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('Admissions');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setSuccess(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('topicCategory', category);

    try {
      await api.post('/admin/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setFile(null);
      if (onUploadComplete) onUploadComplete();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100">Upload Campus Document</h3>
          <p className="text-xs text-slate-400">PDF, DOCX, or TXT documents are parsed and vectorized into MongoDB</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragActive 
              ? 'border-indigo-500 bg-indigo-950/20 scale-[1.01]' 
              : file 
              ? 'border-emerald-500/50 bg-emerald-950/10' 
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2">
            {file ? (
              <>
                <FileText className="w-10 h-10 text-emerald-400 animate-bounce" />
                <p className="text-sm font-semibold text-slate-200">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-slate-500" />
                <p className="text-sm text-slate-300 font-medium">
                  Drag & drop your document here, or <span className="text-indigo-400 underline">browse files</span>
                </p>
                <p className="text-[11px] text-slate-500">Supports PDF, DOCX, TXT up to 25MB</p>
              </>
            )}
          </div>
        </div>

        {/* Topic Category Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Topic Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={!file || uploading}
              className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all duration-200 ${
                !file || uploading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-[0.98]'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Ingesting & Embedding...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" /> Start Ingestion
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Document uploaded successfully and queued for sliding-window chunking & vector embedding.</span>
          </div>
        )}
      </form>
    </div>
  );
}

export default DocumentUploader;
