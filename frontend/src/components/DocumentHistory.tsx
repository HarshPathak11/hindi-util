import { useEffect, useState } from 'react';
import { Trash2, Edit2, Download } from 'lucide-react';
import { getDocuments, deleteDocument } from '../services/documentService';
import { generatePDF } from '../services/pdfService';
import HistoryEditor from './HistoryEditor';

interface Document {
  id: string;
  input_text: string;
  input_language: string;
  translated_text: string;
  header_text: string;
  footer_text: string;
  created_at: string;
  updated_at: string;
}

export default function DocumentHistory() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
      alert('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await deleteDocument(id);
      setDocuments(documents.filter((doc) => doc.id !== id));
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const pdfBlob = await generatePDF({
        headerText: doc.header_text,
        bodyText: doc.translated_text,
        footerText: doc.footer_text,
      });

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hindi-document-${new Date(doc.created_at).getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF');
    }
  };

  if (editingDoc) {
    return (
      <HistoryEditor
        document={editingDoc}
        onSave={(updatedDoc) => {
          setDocuments(documents.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc)));
          setEditingDoc(null);
        }}
        onCancel={() => setEditingDoc(null)}
      />
    );
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No documents yet</p>
        <p className="text-gray-500 text-sm">Generate your first PDF to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Documents</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate font-hindi">
                {doc.translated_text.substring(0, 60)}...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(doc.created_at).toLocaleDateString()} -{' '}
                {doc.input_language.toUpperCase()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingDoc(doc)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-all"
                title="Edit"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleDownload(doc)}
                className="p-2 text-green-600 hover:bg-green-50 rounded transition-all"
                title="Download"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => handleDelete(doc.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-all"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
