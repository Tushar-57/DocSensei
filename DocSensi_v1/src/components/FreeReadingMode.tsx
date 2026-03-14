import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Home, BookOpen, Compass } from 'lucide-react';
import { Document, ChatMessage } from '../types';
import { DocumentViewer } from './DocumentViewer';
import { ChatBot } from './ChatBot';
import { ThemeToggle } from './ThemeToggle';
import { PageSummary } from './PageSummary';
import { PageTools, PageBookmark } from './PageTools';

interface FreeReadingModeProps {
  document: Document;
  onBackToHome: () => void;
}

export const FreeReadingMode: React.FC<FreeReadingModeProps> = ({ document, onBackToHome }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Welcome! I'm your AI learning assistant for this document. Ask me anything about the content on the current page — I'll give you real answers based on what's written there.",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  // Vision OCR overrides: page index → extracted text (for scanned/image pages)
  const [contentOverrides, setContentOverrides] = useState<Record<number, string>>({});
  const [batchStartsLoading, setBatchStartsLoading] = useState<Record<number, boolean>>({});
  const [bookmarks, setBookmarks] = useState<PageBookmark[]>([]);

  const rawPages = document.pages;
  const pages = rawPages.map((p, i) =>
    contentOverrides[i] ? { ...p, content: contentOverrides[i] } : p
  );
  const currentPage = pages[currentPageIndex];
  const totalPages = pages.length;
  const readingProgress = ((currentPageIndex + 1) / totalPages) * 100;
  const BATCH_SIZE = Math.max(1, Math.min(Number(import.meta.env.VITE_EXTRACTION_BATCH_SIZE || 5), 10));
  const bookmarkStorageKey = `docsensei:bookmarks:${document.id}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(bookmarkStorageKey);
      if (!stored) {
        setBookmarks([]);
        return;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setBookmarks(parsed.filter((b) => typeof b?.page === 'number' && typeof b?.name === 'string'));
      }
    } catch {
      setBookmarks([]);
    }
  }, [bookmarkStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(bookmarkStorageKey, JSON.stringify(bookmarks));
    } catch {
      // Ignore localStorage write errors.
    }
  }, [bookmarkStorageKey, bookmarks]);

  const isPageResolved = (index: number) => {
    const base = rawPages[index]?.content || '';
    const override = contentOverrides[index] || '';
    return !!(override.trim() || base.trim());
  };

  const hydrateBatch = async (startIndex: number, showLoaderForCurrent: boolean) => {
    const startPage = rawPages[startIndex]?.number;
    if (!startPage || !document.fileUrl) return;
    if (batchStartsLoading[startPage]) return;

    setBatchStartsLoading(prev => ({ ...prev, [startPage]: true }));
    if (showLoaderForCurrent) setIsBatchLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/extract-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: document.fileUrl, startPage, batchSize: BATCH_SIZE }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.pages)) return;

      const nextOverrides: Record<number, string> = {};
      for (const item of data.pages) {
        const pageNo = Number(item?.pageNumber);
        const text = typeof item?.text === 'string' ? item.text : '';
        if (!pageNo || !text.trim()) continue;
        const idx = pageNo - 1;
        nextOverrides[idx] = text;
      }

      if (Object.keys(nextOverrides).length > 0) {
        setContentOverrides(prev => ({ ...prev, ...nextOverrides }));
      }
    } catch {
      // Keep existing content; user can continue with uploaded PDF mode.
    } finally {
      setBatchStartsLoading(prev => {
        const clone = { ...prev };
        delete clone[startPage];
        return clone;
      });
      if (showLoaderForCurrent) setIsBatchLoading(false);
    }
  };

  // On page change, hydrate current batch if needed; also prefetch upcoming batch.
  useEffect(() => {
    const needsCurrent = !isPageResolved(currentPageIndex);
    void hydrateBatch(currentPageIndex, needsCurrent);

    const nextBatchIndex = currentPageIndex + BATCH_SIZE;
    if (nextBatchIndex < rawPages.length && !isPageResolved(nextBatchIndex)) {
      void hydrateBatch(nextBatchIndex, false);
    }
  }, [currentPageIndex]);

  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsAILoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: currentPage?.content || '',
          documentName: document.name,
          history: chatMessages.slice(-6),
        }),
      });
      const data = await res.json();
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I could not generate a response. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiResponse]);
    } catch {
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered a connection error. Please check the backend is running and try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const jumpToPage = (pageIndex: number) => {
    setCurrentPageIndex(pageIndex);
  };

  const jumpToPageNumber = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPageIndex(pageNumber - 1);
  };

  const addBookmark = (name: string) => {
    if (!currentPage?.number) return;
    const bookmark: PageBookmark = {
      id: `${document.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      page: currentPage.number,
      name,
      createdAt: Date.now(),
    };
    setBookmarks((prev) => {
      const deduped = prev.filter((b) => !(b.page === bookmark.page && b.name === bookmark.name));
      return [bookmark, ...deduped].slice(0, 100);
    });
  };

  const renameBookmark = (id: string, name: string) => {
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, name } : b)));
  };

  const deleteBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <ThemeToggle />

      {/* Header */}
      <div className="relative z-30 bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl border-b border-white/20 dark:border-dark-700/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="bg-gradient-purple rounded-xl sm:rounded-2xl w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                  <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 bg-purple-400/30 rounded-xl sm:rounded-2xl blur-xl"></div>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-white dark:text-white font-geist truncate">
                  Flexible Exploration
                </h1>
                <p className="text-white/70 dark:text-white/60 text-xs sm:text-sm truncate">
                  {document.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
              {/* Reading Progress */}
              <div className="hidden md:flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-white/70" />
                <div className="text-right">
                  <div className="text-white font-medium text-sm">
                    Page {currentPageIndex + 1} of {totalPages}
                  </div>
                  <div className="text-white/60 text-xs">
                    {Math.round(readingProgress)}% Read
                  </div>
                </div>
                <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-purple rounded-full transition-all duration-500"
                    style={{ width: `${readingProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Page Summary Button */}
              <PageSummary
                pages={pages}
                pageNumber={currentPage.number}
              />

              <PageTools
                currentPage={currentPage.number}
                totalPages={totalPages}
                bookmarks={bookmarks}
                onJumpToPage={jumpToPageNumber}
                onAddBookmark={addBookmark}
                onRenameBookmark={renameBookmark}
                onDeleteBookmark={deleteBookmark}
              />
              
              <button
                onClick={onBackToHome}
                className="
                  flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-xl
                  text-white/80 hover:text-white hover:bg-white/10
                  font-medium transition-all duration-200 group
                "
              >
                <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                <span className="hidden sm:inline">Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Mobile progress bar — visible only on small screens */}
        <div className="md:hidden mb-4 flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/15">
          <div className="text-white text-xs font-medium whitespace-nowrap">
            Pg {currentPageIndex + 1}/{totalPages}
          </div>
          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-purple rounded-full transition-all duration-500"
              style={{ width: `${readingProgress}%` }}
            ></div>
          </div>
          <div className="text-white/60 text-xs whitespace-nowrap">
            {Math.round(readingProgress)}%
          </div>
        </div>

        <div className="space-y-6">
          {/* Document Viewer */}
          <DocumentViewer
            page={currentPage}
            totalPages={totalPages}
            document={document}
            isTextLoading={isBatchLoading}
          />

          {/* Navigation */}
          <div className="
            bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6
            border border-white/20 dark:border-dark-700/20
            shadow-glass dark:shadow-glass-dark
          ">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevPage}
                disabled={currentPageIndex === 0}
                className="
                  flex items-center space-x-1 sm:space-x-3 px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl
                  text-white/80 hover:text-white hover:bg-white/10
                  font-medium transition-all duration-200 group
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="hidden sm:inline">Previous Page</span>
                <span className="sm:hidden text-sm">Prev</span>
              </button>

              {/* Page Navigation */}
              <div className="text-center space-y-2 sm:space-y-3 hidden sm:block">
                <div className="text-white/70 text-sm font-medium">Quick Navigation</div>
                <div className="flex space-x-2 max-w-md overflow-x-auto">
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => jumpToPage(i)}
                      className={`
                        w-8 h-8 rounded-xl font-medium text-sm transition-all duration-300 
                        transform hover:scale-110 flex-shrink-0
                        ${i === currentPageIndex 
                          ? 'bg-purple-500 text-white shadow-glow' 
                          : 'bg-white/20 text-white/80 hover:bg-white/30 hover:text-white'
                        }
                      `}
                    >
                      {i + 1}
                    </button>
                  ))}
                  {totalPages > 10 && (
                    <span className="text-white/50 text-sm flex items-center">...</span>
                  )}
                </div>
                <div className="text-white/60 text-xs">
                  Click any page number to jump there
                </div>
              </div>

              {/* Mobile page indicator */}
              <div className="sm:hidden text-center">
                <div className="text-white font-medium text-sm">
                  {currentPageIndex + 1} / {totalPages}
                </div>
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPageIndex === totalPages - 1}
                className="
                  relative group/btn overflow-hidden
                  bg-gradient-purple hover:shadow-glow text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl
                  font-semibold transition-all duration-300 
                  transform hover:scale-105 hover:-translate-y-1
                  focus:outline-none focus:ring-4 focus:ring-purple-300/50
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  shadow-lg hover:shadow-xl
                "
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center">
                  <span className="hidden sm:inline">Next Page</span>
                  <span className="sm:hidden text-sm">Next</span>
                  <ChevronRight className="w-5 h-5 ml-1 sm:ml-3 group-hover/btn:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </div>
          </div>

          {/* AI Assistant Hint */}
          <div className="
            bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm
            border border-purple-400/20 rounded-3xl p-6
            animate-fade-in
          ">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MessageCircle className="w-8 h-8 text-purple-400 animate-pulse" />
                <div className="absolute inset-0 w-8 h-8 bg-purple-400/20 rounded-full blur-xl"></div>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">
                  Need help understanding the content?
                </p>
                <p className="text-white/80 text-sm">
                  Your AI learning assistant is ready to answer questions, provide explanations, 
                  and help you explore the material more deeply. Click the chat icon in the bottom-right corner!
                </p>
              </div>
              <div className="hidden sm:block">
                <div className="bg-purple-500/20 rounded-2xl p-3">
                  <MessageCircle className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ChatBot */}
      <ChatBot messages={chatMessages} onSendMessage={handleSendMessage} isLoading={isAILoading} />
    </div>
  );
};