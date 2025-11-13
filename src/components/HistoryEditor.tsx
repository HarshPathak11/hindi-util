import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { updateDocument } from '../services/documentService';
import PDFPreview from './PDFPreview';

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

interface HistoryEditorProps {
  document: Document;
  onSave: (doc: Document) => void;
  onCancel: () => void;
}

export default function HistoryEditor({ document, onSave, onCancel }: HistoryEditorProps) {
  const [translatedText, setTranslatedText] = useState(document.translated_text);
  const [headerText, setHeaderText] = useState(document.header_text);
  const [footerText, setFooterText] = useState(document.footer_text);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateDocument(document.id, {
        translated_text: translatedText,
        header_text: headerText,
        footer_text: footerText,
      });
      onSave(updated);
    } catch (error) {
      console.error('Failed to save document:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Edit Document</h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Header (Top-Left)
          </label>
          <input
            type="text"
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-sm font-hindi"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Footer (Bottom-Right)
          </label>
          <input
            type="text"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-sm font-hindi"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hindi Text
        </label>
        <textarea
          value={translatedText}
          onChange={(e) => setTranslatedText(e.target.value)}
          className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none resize-none font-hindi"
        />
      </div>

      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
        <PDFPreview
          headerText={headerText}
          bodyText={translatedText}
          footerText={footerText}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-900 font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-400 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
