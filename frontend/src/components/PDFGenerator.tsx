import { useState, useRef } from 'react';
import { Download, Send, Eye, EyeOff } from 'lucide-react';
import { translateToHindi } from '../services/translationService';
import { generatePDF } from '../services/pdfService';
import { saveDocument } from '../services/documentService';
import PDFPreview from './PDFPreview';

type Language = 'english' | 'hinglish' | 'hindi';

export default function PDFGenerator() {
  const [language, setLanguage] = useState<Language>('english');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text');
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateToHindi(inputText, language);
      setTranslatedText(result);
      setShowPreview(true);
    } catch (error) {
      alert('Translation failed. Please try again.');
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!translatedText.trim()) {
      alert('Please translate text first');
      return;
    }

    setIsGenerating(true);
    try {
      // Generate PDF
      const pdfBlob = await generatePDF({
        headerText,
        bodyText: translatedText,
        footerText,
      });

      // Save document to database
      await saveDocument({
        input_text: inputText,
        input_language: language,
        translated_text: translatedText,
        header_text: headerText,
        footer_text: footerText,
      });

      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hindi-document-${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Reset form
      setInputText('');
      setTranslatedText('');
      setShowPreview(false);
      alert('PDF generated and saved successfully!');
    } catch (error) {
      alert('PDF generation failed. Please try again.');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Language Selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Input Language
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['english', 'hindi'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`py-2.5 px-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                language === lang
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Enter Text to Convert
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter or paste your text here..."
          className="w-full h-32 sm:h-40 p-4 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none resize-none font-hindi"
        />
        <p className="text-xs text-gray-500 mt-1">Character count: {inputText.length}</p>
      </div>

      {/* Translate Button */}
      <button
        onClick={handleTranslate}
        disabled={isTranslating || !inputText.trim()}
        className="w-full bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        <Send size={20} />
        {isTranslating ? 'Translating...' : 'Convert to Hindi'}
      </button>

      {/* Translation Preview Toggle */}
      {translatedText && (
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full bg-gray-200 text-gray-900 font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
        >
          {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
          {showPreview ? 'Hide' : 'Show'} Preview
        </button>
      )}

      {/* Preview Section */}
      {showPreview && translatedText && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>

          {/* Header/Footer Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Header (Top-Left)
              </label>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="Fixed header text..."
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
                placeholder="Fixed footer text..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-sm font-hindi"
              />
            </div>
          </div>

          {/* PDF Preview */}
          <div ref={previewRef} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
            <PDFPreview
              headerText={headerText}
              bodyText={translatedText}
              footerText={footerText}
            />
          </div>

          {/* Edited Translation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Edit Hindi Text (if needed)
            </label>
            <textarea
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              className="w-full h-24 p-3 border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none resize-none font-hindi"
            />
          </div>

          {/* Generate PDF Button */}
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Download size={20} />
            {isGenerating ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      )}
    </div>
  );
}
