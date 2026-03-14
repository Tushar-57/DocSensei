import React, { useState } from 'react';
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
  one_liner: string;
  error?: string;
}

export const PageSummary: React.FC<PageSummaryProps> = ({ pages, pageNumber }) => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const fetchSummary = async () => {
    // If we already have a summary for this page, just open the panel
    if (summary) {
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
        setSummary(data);
      }
    } catch (err: any) {
      setError(err.message || 'Could not generate summary');
    } finally {
      setLoading(false);
    }
  };

  // Reset cached summary when page changes
  const [prevPage, setPrevPage] = useState(pageNumber);
  if (pageNumber !== prevPage) {
    setPrevPage(pageNumber);
    setSummary(null);
    setOpen(false);
    setError(null);
  }

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
      {open && (
        <div className="
          fixed inset-0 z-[60] flex items-center justify-center p-4
          bg-black/40 backdrop-blur-sm
          animate-fade-in
        " onClick={() => setOpen(false)}>
          <div
            className="
              relative w-full max-w-lg
              bg-white/15 dark:bg-dark-800/20 backdrop-blur-2xl rounded-3xl
              border border-white/25 dark:border-dark-700/25
              shadow-glass dark:shadow-glass-dark
              p-6 sm:p-8
              animate-scale-in
              max-h-[80vh] overflow-y-auto
            "
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-1 rounded-xl hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {loading ? (
              <div className="text-center py-12 space-y-4">
                <Loader2 className="w-10 h-10 text-amber-400 mx-auto animate-spin" />
                <p className="text-white/70 text-sm">Generating summary...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-red-400 font-medium">{error}</p>
                <button
                  onClick={fetchSummary}
                  className="text-white/60 hover:text-white text-sm underline"
                >
                  Try again
                </button>
              </div>
            ) : summary ? (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white font-geist leading-tight">
                      {summary.title}
                    </h3>
                    <p className="text-white/50 text-xs mt-1">Page {pageNumber} Summary</p>
                  </div>
                </div>

                {/* One-liner TL;DR */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3">
                  <p className="text-amber-200 text-sm font-medium leading-relaxed">
                    {summary.one_liner}
                  </p>
                </div>

                {/* Bullet points */}
                <ul className="space-y-3">
                  {summary.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="
                        mt-1.5 w-2 h-2 rounded-full flex-shrink-0
                        bg-gradient-to-r from-amber-400 to-orange-400
                      " />
                      <span className="text-white/85 text-sm leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>

                {!summary.is_content_page && (
                  <p className="text-white/40 text-xs italic text-center">
                    This page has limited learning content.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};
