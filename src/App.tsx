import { useState } from 'react';
import { FileText, History } from 'lucide-react';
import PDFGenerator from './components/PDFGenerator';
import DocumentHistory from './components/DocumentHistory';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Hindi PDF Generator
          </h1>
          <p className="text-gray-600">Convert text to Hindi and generate PDF documents</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all ${
              activeTab === 'generator'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText size={20} />
            <span className="hidden sm:inline">Generator</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <History size={20} />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 min-h-[600px]">
          {activeTab === 'generator' ? <PDFGenerator /> : <DocumentHistory />}
        </div>
      </div>
    </div>
  );
}

export default App;
