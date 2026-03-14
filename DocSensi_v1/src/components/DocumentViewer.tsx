
import React, { useState, useRef, useEffect } from 'react';
import { Page as PageType, Document as DocType } from '../types';
import { CheckCircle, BookOpen } from 'lucide-react';
import { Document as PdfDocument, Page as PdfPage } from 'react-pdf';

interface DocumentViewerProps {
  page: PageType;
  totalPages: number;
  document?: DocType;
  pageNumber?: number;
  onPageChange?: (page: number) => void;
  isTextLoading?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  page,
  totalPages,
  document,
  pageNumber,
  onPageChange,
  isTextLoading = false,
}) => {
  // Toggle state: true = show rendered (PDF), false = show extracted text
  const [showRendered, setShowRendered] = useState(true);

  // Measure a non-scrolling wrapper so scrollbar appearance does not change page width.
  const pdfViewportRef = useRef<HTMLDivElement>(null);
  const [pdfWidth, setPdfWidth] = useState(700);
  const [pageAspectRatio, setPageAspectRatio] = useState(1.414);

  useEffect(() => {
    const updateWidth = () => {
      if (pdfViewportRef.current) {
        const width = Math.floor(pdfViewportRef.current.clientWidth);
        if (width > 0) setPdfWidth(width);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (pdfViewportRef.current) observer.observe(pdfViewportRef.current);
    return () => observer.disconnect();
  }, []);

  // If fileUrl is present, render the file (PDF/Word)
  const fileUrl = document?.fileUrl;
  const docType = document?.type;

  return (
    <div className="
      bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8
      border border-white/20 dark:border-dark-700/20
      shadow-glass dark:shadow-glass-dark
      transition-all duration-500 hover:shadow-xl
      animate-fade-in
    ">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-4 sm:mb-8 gap-3">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative flex-shrink-0">
            <div className="bg-gradient-blue rounded-xl sm:rounded-2xl w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-400/30 rounded-xl sm:rounded-2xl blur-xl"></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white dark:text-white font-geist">
              Page {page.number}
            </h2>
            <p className="text-white/60 dark:text-white/50 text-sm">
              of {totalPages} pages
            </p>
            {/* Toggle only for PDFs, right of page count */}
            {fileUrl && docType === 'PDF' && (
              <button
                className={`ml-2 px-4 py-1 rounded-full border-2 transition-colors duration-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400/50
                  ${showRendered ? 'bg-blue-600/80 text-white border-blue-400 hover:bg-blue-700' : 'bg-white/20 text-blue-400 border-blue-400 hover:bg-blue-100'}`}
                onClick={() => setShowRendered(v => !v)}
                title={showRendered ? 'Show extracted text' : 'Show uploaded PDF'}
              >
                {showRendered ? 'Show Extracted Text' : 'Show Uploaded PDF'}
              </button>
            )}
          </div>
        </div>
        {page.completed && (
          <div className="flex items-center space-x-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-2xl border border-green-500/30">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Completed</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative">
        <div className="
          bg-white/5 dark:bg-dark-700/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-8
          border border-white/10 dark:border-dark-600/10
          shadow-inner-glow
        ">
          {/* Toggle logic: for PDFs, show either rendered or extracted text. For Word, show link. For others, show text. */}
          {fileUrl && docType === 'PDF' ? (
            showRendered ? (
              <div ref={pdfViewportRef} className="pdf-viewer-viewport">
                <div className="pdf-viewer-scroller">
                  <div
                    className="pdf-page-shell"
                    style={{ minHeight: Math.max(320, Math.round(pdfWidth * pageAspectRatio)) }}
                  >
                    <PdfDocument
                      file={fileUrl}
                      loading={<div className="pdf-page-loading">Loading page...</div>}
                      onLoadSuccess={({ numPages }) => {
                        if (typeof page.number === 'number' && page.number > numPages && onPageChange) {
                          onPageChange(1);
                        }
                      }}
                    >
                      <PdfPage
                        pageNumber={page.number}
                        width={pdfWidth}
                        loading={null}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        onLoadSuccess={(loadedPage) => {
                          const viewport = loadedPage.getViewport({ scale: 1 });
                          if (viewport.width > 0 && viewport.height > 0) {
                            setPageAspectRatio(viewport.height / viewport.width);
                          }
                        }}
                      />
                    </PdfDocument>
                  </div>
                </div>
              </div>
            ) : (
              isTextLoading && !page.content.trim() ? (
                <div className="extracted-text-container dark:bg-dark-700/80 border dark:border-dark-600 flex items-center justify-center min-h-[300px]">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-white/80 text-sm">Extracting page text...</p>
                  </div>
                </div>
              ) : (
                <div className="extracted-text-container dark:bg-dark-700/80 border dark:border-dark-600">
                  <pre className="whitespace-pre-wrap text-gray-900 dark:text-white text-base font-geist leading-relaxed" style={{fontFamily: 'inherit'}}>{page.content}</pre>
                </div>
              )
            )
          ) : fileUrl && docType === 'Word' ? (
            <div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                Download and view Word document
              </a>
            </div>
          ) : (
            <div
              className="whitespace-pre-wrap text-white/90 dark:text-white/80 leading-relaxed text-base font-light"
              style={{ maxHeight: '75vh', overflowY: 'auto' }}
            >
              {page.content}
            </div>
          )}
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-purple-400/30 rounded-full blur-sm"></div>
        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-400/20 rounded-full blur-sm"></div>
      </div>
    </div>
  );
};