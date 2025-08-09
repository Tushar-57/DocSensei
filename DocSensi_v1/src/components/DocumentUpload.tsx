
import React, { useRef, useState, useEffect } from 'react';

// Responsive InfoFooter component
const InfoFooter: React.FC = () => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (window.innerWidth < 640) setOpen(false);
  }, []);

  return (
    <div
      className={`bg-white/70 dark:bg-dark-800/80 backdrop-blur-md border border-white/30 dark:border-dark-700/30 rounded-t-2xl shadow-xl px-4 sm:px-6 py-3 sm:py-5 max-w-2xl w-full m-2 sm:m-4 pointer-events-auto transition-all duration-300 ${open ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-60'} flex flex-col`}
      style={{ minWidth: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg sm:text-xl font-semibold text-left text-gray-900 dark:text-white tracking-tight">How Doc Sensei Works</h2>
        <button
          className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring"
          aria-label={open ? 'Hide info' : 'Show info'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" /></svg>
          )}
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 text-base font-bold border-2 border-purple-200">1</div>
              <div className="w-1 h-6 bg-purple-100" />
            </div>
            <p className="text-gray-800 dark:text-gray-100 text-base">Upload your PDF or Word document securely.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-base font-bold border-2 border-blue-200">2</div>
              <div className="w-1 h-6 bg-blue-100" />
            </div>
            <p className="text-gray-800 dark:text-gray-100 text-base">Choose a mode: <span className="font-semibold text-purple-500">Learning</span> for guided Q&amp;A with AI Tutor, or <span className="font-semibold text-blue-500">Free Reading</span> with AI.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 text-green-600 text-base font-bold border-2 border-green-200">3</div>
            </div>
            <p className="text-gray-800 dark:text-gray-100 text-base"><span className="font-semibold text-red-500">Interact</span>, <span className="font-semibold text-blue-500">Ask Questions</span>, and get <u>instant insights from your document !</u></p>
          </div>
        </div>
      )}
    </div>
  );
};

import { Upload, FileText, File, Sparkles } from 'lucide-react';
import { Document } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface DocumentUploadProps {
  onDocumentUploaded: (document: Document) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentUploaded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    const fileType = file.type;
    const isValidType = 
      fileType === 'application/pdf' || 
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword';

    if (!isValidType) {
      alert('Please upload a PDF or Word document.');
      return;
    }

    setIsUploading(true);

    // Simulate document processing with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Create mock document with pages
    const mockDocument: Document = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: fileType.includes('pdf') ? 'PDF' : 'Word',
      content: 'Document content loaded successfully',
      pages: generateMockPages(),
      uploadedAt: new Date(),
    };

    setIsUploading(false);
    onDocumentUploaded(mockDocument);
  };

  const generateMockPages = (): any[] => {
    const pages = [];
    for (let i = 1; i <= 12; i++) {
      pages.push({
        id: `page-${i}`,
        number: i,
        content: `This is the content of page ${i}. It contains comprehensive educational material covering advanced topics in science, mathematics, literature, and critical thinking. Students engage with interactive content designed to enhance understanding through practical examples, detailed explanations, and thought-provoking questions that encourage deeper learning and retention.`,
        completed: false,
      });
    }
    return pages;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <ThemeToggle />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-lg w-full mb-36">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse" />
                <div className="absolute inset-0 w-12 h-12 bg-yellow-400/20 rounded-full blur-xl"></div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 mb-2">
              <img src="/src/assets/images/logo.png" alt="Doc Sensei Logo" className="w-20 h-20 rounded-full shadow-lg border border-white/20 bg-white/80 dark:bg-dark-800/80 object-contain" />
              <h1 className="text-5xl font-bold text-white dark:text-white font-geist tracking-tight drop-shadow-lg">Doc Sensei</h1>
            </div>
          {/* Info Steps Section in Footer */}
          <footer className="fixed bottom-0 left-0 w-full flex justify-center z-50 pointer-events-none">
            {/* Responsive/collapsible info footer */}
            <InfoFooter />
          </footer>

            <p className="text-white/80 dark:text-white/70 text-xl font-light">
              Your AI powered mentor for document exploration
            </p>
          </div>

          {/* Upload Card */}
          <div
            className={`
              relative group transition-all duration-500 animate-slide-up
              ${isDragOver ? 'scale-105' : 'hover:scale-[1.02]'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={`
              bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl rounded-3xl p-8
              border border-white/20 dark:border-dark-700/20
              shadow-glass dark:shadow-glass-dark
              transition-all duration-500
              ${isDragOver ? 'border-purple-400/50 bg-purple-500/10 shadow-glow' : ''}
              ${isUploading ? 'opacity-70 pointer-events-none' : ''}
            `}>
              <div className="text-center">
                {isUploading ? (
                  <div className="space-y-6">
                    <div className="relative">
                      <Upload className="w-16 h-16 text-purple-400 mx-auto animate-bounce-subtle" />
                      <div className="absolute inset-0 w-16 h-16 bg-purple-400/20 rounded-full blur-xl mx-auto"></div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xl font-medium text-white dark:text-white">
                        Processing your document...
                      </p>
                      <p className="text-white/70 dark:text-white/60">
                        Analyzing content and preparing interactive features
                      </p>
                    </div>
                    <div className="relative w-full h-2 bg-white/20 dark:bg-dark-700/20 rounded-full overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-purple rounded-full">
                        <div className="h-full bg-white/30 rounded-full animate-shimmer"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* File type icons */}
                    <div className="flex justify-center space-x-6 mb-8">
                      <div className="relative group/icon">
                        <FileText className="w-14 h-14 text-purple-400 group-hover/icon:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 w-14 h-14 bg-purple-400/20 rounded-full blur-xl group-hover/icon:bg-purple-400/30 transition-all duration-300"></div>
                      </div>
                      <div className="relative group/icon">
                        <File className="w-14 h-14 text-blue-400 group-hover/icon:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 w-14 h-14 bg-blue-400/20 rounded-full blur-xl group-hover/icon:bg-blue-400/30 transition-all duration-300"></div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-2xl font-semibold text-white dark:text-white font-geist">
                        Upload Your Document
                      </h3>
                      <p className="text-white/70 dark:text-white/60 text-lg leading-relaxed">
                        Drag and drop your PDF or Word document here, or click to browse your files
                      </p>
                    </div>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="
                        relative group/btn overflow-hidden
                        bg-gradient-purple hover:shadow-glow text-white px-8 py-4 rounded-2xl
                        font-semibold text-lg transition-all duration-300 
                        transform hover:scale-105 hover:-translate-y-1
                        focus:outline-none focus:ring-4 focus:ring-purple-300/50
                        shadow-xl hover:shadow-2xl
                      "
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative flex items-center justify-center">
                        <Upload className="w-5 h-5 mr-3 group-hover/btn:rotate-12 transition-transform duration-300" />
                        Choose File
                      </span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="hidden"
                    />

                    <div className="flex items-center justify-center space-x-4 text-sm text-white/60 dark:text-white/50">
                      <span>Supported formats:</span>
                      <div className="flex space-x-2">
                        <span className="px-3 py-1 bg-white/10 dark:bg-dark-700/10 rounded-full">PDF</span>
                        <span className="px-3 py-1 bg-white/10 dark:bg-dark-700/10 rounded-full">Word</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};