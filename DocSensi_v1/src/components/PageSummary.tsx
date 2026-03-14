import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, X, Sparkles, Loader2 } from 'lucide-react';
import { toBackendUrl } from '../utils/api';

interface PageSummaryProps {
  pages: { content: string }[];
  pageNumber: number;
}

interface SummaryData {
  title: string;
  bullets: string[];
  is_content_page: boolean;
  example?: string;
  one_liner: string;
  error?: string;
}

export const PageSummary: React.FC<PageSummaryProps> = ({ pages, pageNumber }) => {
  const [summaryCache, setSummaryCache] = useState<Record<number, SummaryData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Close panel if page changes
  const [prevPage, setPrevPage] = useState(pageNumber);
  if (pageNumber !== prevPage) {
    setPrevPage(pageNumber);
    setOpen(false);
    setError(null);
  }

  const fetchSummary = async () => {
    // If we already have a summary for this page, just open the panel and no fetch
    if (summaryCache[pageNumber]) {
      setOpen(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const res = await fetch(toBackendUrl('/summarize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: pages.map(p => p.content),
          pageNumber,
        }),
      });
      if (!res.ok) throw new Error('Failed to fetch summary');
      const data: SummaryData = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSummaryCache(prev => ({ ...prev, [pageNumber]: data }));
      }
    } catch (err: any) {
      setError(err.message || 'Could not generate summary');
    } finally {
      setLoading(false);
    }
  };

  const currentSummary = summaryCache[pageNumber];

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={fetchSummary}
        disabled={loading}
        className="
          flex items-center gap-2 px-4 py-2 rounded-2xl
          bg-gradient-to-r from-amber-500/80 to-orange-500/80
          hover:from-amber-500 hover:to-orange-500
          text-white font-semibold text-sm
          transition-all duration-300 transform hover:scale-105
          shadow-lg hover:shadow-xl
          disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
        "
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{loading ? 'Summarising...' : 'Page Summary'}</span>
        <span className="sm:hidden">{loading ? '...' : 'Summary'}</span>
      </button>

      {/* Summary Panel */}
      {open && typeof window !== 'undefined' && createPortal(
        <div className="
          fixed top-0 left-0 w-full h-[100dvh] z-[9999] flex items-center justify-center p-4 sm:p-6
          bg-black/60 backdrop-blur-sm
          animate-fade-in
        " onClick={() => setOpen(false)}>
          <div
            className="
              relative w-full max-w-lg mx-auto
              bg-dark-900/90 dark:bg-dark-800/95 backdrop-blur-2xl rounded-3xl
              border border-white/10 dark:border-dark-700/50
              shadow-2xl
              p-6 sm:p-8
              animate-scale-in
              max-h-[85vh] overflow-y-auto
            "
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {loading ? (
              <div className="text-center py-12 space-y-4">
                <Loader2 className="w-10 h-10 text-amber-400 mx-auto animate-spin" />
                <p className="text-white/70 text-sm">Generating summary...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 space-y-3 mt-4">
                <p className="text-red-400 font-medium">{error}</p>
                <button
                  onClick={fetchSummary}
                  className="text-white/60 hover:text-white text-sm underline"
                >
                  Try again
                </button>
              </div>
            ) : currentSummary ? (
              <div className="space-y-6 mt-2">
                {/* Header */}
                <div className="flex items-start gap-4 pr-8">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl w-12 h-12 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-white font-geist leading-tight">
                      {currentSummary.title}
                    </h3>
                    <p className="text-white/50 text-sm mt-1.5 font-medium">Page {pageNumber} Summary</p>
                  </div>
                </div>

                {/* One-liner TL;DR */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-5 shadow-inner">
                  <p className="text-amber-200 text-sm sm:text-base font-medium leading-relaxed">
                    {currentSummary.one_liner}
                  </p>
                </div>

                {/* Bullet points */}
                <ul className="space-y-4">
                  {currentSummary.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-3.5">
                      <span className="
                        mt-2 w-2 h-2 rounded-full flex-shrink-0
                        bg-gradient-to-r from-amber-400 to-orange-400
                        shadow-[0_0_8px_rgba(251,191,36,0.5)]
                      " />
                      <span className="text-white/90 text-sm sm:text-base leading-relaxed font-inter">{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Example (optional) */}
                {currentSummary.example && currentSummary.example.trim() !== '' && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 mt-4">
                    <p className="text-white/60 text-xs uppercase tracking-wider font-bold mb-2">Example</p>
                    <p className="text-white/80 text-sm italic leading-relaxed">
                      {currentSummary.example}
                    </p>
                  </div>
                )}

                {!currentSummary.is_content_page && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-white/40 text-xs sm:text-sm italic text-center">
                      This page has limited learning content.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
