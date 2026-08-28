import React, { useState, useEffect } from 'react';
import DocumentUploader from '../../components/DocumentUploader/DocumentUploader.jsx';
import DocumentStatusTable from '../../components/DocumentStatusTable/DocumentStatusTable.jsx';
import api from '../../services/api.js';

export function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/documents');
      setDocuments(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    // Auto refresh if any document is in 'processing' state
    const interval = setInterval(() => {
      setDocuments((prev) => {
        const hasProcessing = prev.some((d) => d.status === 'processing');
        if (hasProcessing) {
          fetchDocuments();
        }
        return prev;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto space-y-6 overflow-y-auto pr-1">
      {/* Upload Component */}
      <DocumentUploader onUploadComplete={fetchDocuments} />

      {/* Ingested Documents Table */}
      <DocumentStatusTable
        documents={documents}
        onRefresh={fetchDocuments}
        loading={loading}
      />
    </div>
  );
}

export default Documents;
