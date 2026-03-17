import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Home, Brain, Target, BookMarked } from 'lucide-react';
import { Document, QuizQuestion } from '../types';
import { DocumentViewer } from './DocumentViewer';
import { Quiz } from './Quiz';
import { ThemeToggle } from './ThemeToggle';
import { PageSummary } from './PageSummary';
import { PageTools, PageBookmark } from './PageTools';
import { toBackendUrl } from '../utils/api';

interface LearningModeProps {
  document: Document;
  onBackToHome: () => void;
}

export const LearningMode: React.FC<LearningModeProps> = ({ document, onBackToHome }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [completedPages, setCompletedPages] = useState<Set<number>>(new Set());
  // Pages the user marked as read manually (no quiz) — shown with a different badge
  const [skippedPages, setSkippedPages] = useState<Set<number>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizAutoAdvance, setQuizAutoAdvance] = useState(true); // Switch for auto-advance
  const [pageValid, setPageValid] = useState(false); // Track if current page is valid for navigation
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  // Vision OCR overrides: page index → extracted text (for scanned/image pages)
  const [contentOverrides, setContentOverrides] = useState<Record<number, string>>({});
  const [batchStartsLoading, setBatchStartsLoading] = useState<Record<number, boolean>>({});
  const [bookmarks, setBookmarks] = useState<PageBookmark[]>([]);
  const [streak, setStreak] = useState(0);
  const [manualHardMode, setManualHardMode] = useState(false);
  const [showFireAnimation, setShowFireAnimation] = useState(false);

  const streakTier = Math.floor(streak / 3);
  const isHardMode = manualHardMode || streakTier > 0;

  const getDifficultyLevel = () => {
    if (!isHardMode) return 'normal';
    if (streakTier >= 4) return 'legendary';
    if (streakTier >= 3) return 'expert';
    if (streakTier >= 2) return 'advanced';
    return 'hard';
  };

  const difficultyLevel = getDifficultyLevel();

  const handleCorrectAnswer = () => {
    setStreak(prev => {
      const newStreak = prev + 1;
      if (newStreak % 3 === 0) {
        setShowFireAnimation(true);
        setTimeout(() => setShowFireAnimation(false), 2000);
      }
      return newStreak;
    });
  };

  const handleIncorrectAnswer = () => {
    setStreak(0);
  };


  const rawPages = Array.isArray(document.pages) ? document.pages : [];
  // Merge Vision OCR results into pages so all API calls use the resolved content
  const pages = rawPages.map((p, i) =>
    contentOverrides[i] ? { ...p, content: contentOverrides[i] } : p
  );
  const currentPage = pages[currentPageIndex] || { content: '', number: currentPageIndex + 1 };
  const totalPages = pages.length;
  const overallProgress = totalPages > 0 ? (completedPages.size / totalPages) * 100 : 0;
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
      const res = await fetch(toBackendUrl('/extract-pages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: document.fileUrl, startPage, batchSize: BATCH_SIZE, textLayerOnly: true }),
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

      const resolvedAfterBatch = isPageResolved(startIndex) || !!nextOverrides[startIndex]?.trim();
      if (showLoaderForCurrent && !resolvedAfterBatch) {
        const currentPageNo = rawPages[startIndex]?.number;
        if (currentPageNo) {
          const singleRes = await fetch(toBackendUrl('/extract-page'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUrl: document.fileUrl, pageNumber: currentPageNo }),
          });
          const singleData = await singleRes.json();
          const singleText = typeof singleData?.text === 'string' ? singleData.text : '';
          if (singleRes.ok && singleText.trim()) {
            setContentOverrides(prev => ({ ...prev, [startIndex]: singleText }));
          }
        }
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

  // Generate mock quiz questions for the current page
  const generateQuizQuestions = (): QuizQuestion[] => {
    return [
      {
        id: `q1-page-${currentPageIndex + 1}`,
        question: `Based on the content of page ${currentPageIndex + 1}, what is the primary learning objective being addressed?`,
        options: [
          'Understanding fundamental concepts through interactive engagement',
          'Memorizing specific facts and figures',
          'Completing tasks as quickly as possible',
          'Following predetermined learning paths'
        ],
        correctAnswer: 0,
        explanation: 'The content emphasizes deep understanding through interactive engagement rather than rote memorization.'
      },
      {
        id: `q2-page-${currentPageIndex + 1}`,
        question: `Which learning strategy is most emphasized in this section?`,
        options: [
          'Passive reading and note-taking',
          'Active participation and critical thinking',
          'Speed reading techniques',
          'Group discussion only'
        ],
        correctAnswer: 1,
        explanation: 'Active participation and critical thinking are key to effective learning and retention.'
      },
      {
        id: `q3-page-${currentPageIndex + 1}`,
        question: `What is the main benefit of the interactive approach described on this page?`,
        options: [
          'Faster completion of coursework',
          'Enhanced comprehension and long-term retention',
          'Reduced study time requirements',
          'Simplified content presentation'
        ],
        correctAnswer: 1,
        explanation: 'Interactive learning approaches significantly improve comprehension and help with long-term retention of knowledge.'
      },
      {
        id: `q4-page-${currentPageIndex + 1}`,
        question: `According to the content, what should be the primary focus when learning new material?`,
        options: [
          'Speed of completion',
          'Understanding underlying principles and connections',
          'Memorizing all details perfectly',
          'Following instructions exactly'
        ],
        correctAnswer: 1,
        explanation: 'Understanding underlying principles and making connections between concepts leads to deeper, more meaningful learning.'
      }
    ];
  };




  // No auto-show quiz. Quiz is started by button click.


  const handleQuizComplete = () => {
    const newCompletedPages = new Set(completedPages);
    newCompletedPages.add(currentPageIndex);
    setCompletedPages(newCompletedPages);
    setShowQuiz(false);
    setQuizQuestions(null);
    setPageValid(true);
  };

  const handleQuizReset = () => {
    const newCompletedPages = new Set(completedPages);
    newCompletedPages.delete(currentPageIndex);
    setCompletedPages(newCompletedPages);
    setPageValid(false);
  };

  // Mark as Read — user-initiated skip, tracked separately with a different badge
  const handleMarkAsRead = () => {
    const newCompleted = new Set(completedPages);
    newCompleted.add(currentPageIndex);
    setCompletedPages(newCompleted);
    const newSkipped = new Set(skippedPages);
    newSkipped.add(currentPageIndex);
    setSkippedPages(newSkipped);
    setShowQuiz(false);
    setQuizQuestions(null);
    setPageValid(true);
  };

  const canNavigateToNext = () => {
    return completedPages.has(currentPageIndex) && pageValid;
  };

  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1 && canNavigateToNext()) {
      const nextIndex = currentPageIndex + 1;
      setCurrentPageIndex(nextIndex);
      setShowQuiz(false);
      // If the next page is completed, set pageValid true, else false
      setPageValid(completedPages.has(nextIndex));
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      const prevIndex = currentPageIndex - 1;
      setCurrentPageIndex(prevIndex);
      setShowQuiz(false);
      setPageValid(completedPages.has(prevIndex));
    }
  };

  const jumpToPageNumber = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    const idx = pageNumber - 1;
    setCurrentPageIndex(idx);
    setShowQuiz(false);
    setPageValid(completedPages.has(idx));
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

  // Fetch quiz questions from backend
  const fetchQuizQuestions = async () => {
    setLoadingQuiz(true);
    setQuizError(null);
    try {
      // Defensive: ensure pages and currentPage are valid
      if (!Array.isArray(pages) || !currentPage || typeof currentPage.number !== 'number') {
        setQuizError('Invalid page data.');
        setLoadingQuiz(false);
        return;
      }
      const quizPayload = {
        pageContent: currentPage?.content || '',
        pageNumber: currentPage.number,
        documentId: document.id,
        isHardMode,
        difficultyLevel,
        streak,
      };
      console.log('[Quiz Fetch] Sending payload:', quizPayload);
      const res = await fetch(toBackendUrl('/generate-quiz'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizPayload),
      });
      if (!res.ok) throw new Error('Failed to fetch quiz');
      const data = await res.json();
      // Debug: log the received data structure
      console.log('[Quiz Fetch] Received data:', data);
      // Defensive: check for questions array
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        setShowQuiz(true);
        setPageValid(true);
      } else if (data.valid && (!data.questions || data.questions.length === 0)) {
        // If valid and no questions, mark as completed and allow next
        const newCompletedPages = new Set(completedPages);
        newCompletedPages.add(currentPageIndex);
        setCompletedPages(newCompletedPages);
        setShowQuiz(false);
        setQuizQuestions(null);
        setPageValid(true);
        if (quizAutoAdvance && currentPageIndex < totalPages - 1) {
          setCurrentPageIndex(currentPageIndex + 1);
          setPageValid(false);
        }
      } else if (data.valid === false && !data.error) {
        // Non-content page (title, table of contents, acknowledgment, index, etc.)
        // Auto-advance past it — no quiz needed for pages with no learning content
        const newCompletedPages = new Set(completedPages);
        newCompletedPages.add(currentPageIndex);
        setCompletedPages(newCompletedPages);
        setShowQuiz(false);
        setQuizQuestions(null);
        setPageValid(true);
        if (quizAutoAdvance && currentPageIndex < totalPages - 1) {
          setCurrentPageIndex(currentPageIndex + 1);
          setPageValid(false);
        }
      } else if (data.error) {
        // Handle LLM output parsing failure with a user-friendly message
        if (typeof data.error === 'string' && data.error.includes('OUTPUT_PARSING_FAILURE')) {
          setQuizError('The AI could not generate a valid quiz for this page. Please try again or check if the page has enough meaningful content.');
        } else {
          setQuizError(data.error);
        }
        setPageValid(false);
      } else {
        setQuizError('No quiz available for this page.');
        setPageValid(false);
      }
    } catch (err: any) {
      setQuizError(err.message || 'Error fetching quiz');
      setPageValid(false);
    } finally {
      setLoadingQuiz(false);
    }
  };

  return (
  <div className="min-h-screen bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden" style={{ overflow: 'hidden' }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <ThemeToggle />

      {/* Header */}
      <div className="relative z-30 bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl border-b border-white/20 dark:border-dark-700/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="bg-gradient-blue rounded-xl sm:rounded-2xl w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-400/30 rounded-xl sm:rounded-2xl blur-xl"></div>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-white dark:text-white font-geist truncate">
                  Structured Learning
                </h1>
                <p className="text-white/70 dark:text-white/60 text-xs sm:text-sm truncate">
                  {document.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
              {/* Overall Progress */}
              <div className="hidden md:flex items-center space-x-3">
                <Target className="w-5 h-5 text-white/70" />
                <div className="text-right">
                  <div className="text-white font-medium text-sm">
                    {completedPages.size}/{totalPages} Pages
                  </div>
                  <div className="text-white/60 text-xs">
                    {Math.round(overallProgress)}% Complete
                  </div>
                </div>
                <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-blue rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
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
            {completedPages.size}/{totalPages}
          </div>
          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-blue rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <div className="text-white/60 text-xs whitespace-nowrap">
            {Math.round(overallProgress)}%
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-3 sm:space-y-0 mb-4">
          <div className="flex items-center">
            <button
              type="button"
              role="switch"
              aria-checked={quizAutoAdvance}
              onClick={() => setQuizAutoAdvance(v => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${quizAutoAdvance ? 'bg-blue-500' : 'bg-white/20'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${quizAutoAdvance ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="ml-3 text-white/80 dark:text-white/70 text-sm select-none">
              Auto-advance past non-content pages (title, TOC, acknowledgments, index)
            </span>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              role="switch"
              aria-checked={manualHardMode}
              onClick={() => setManualHardMode(v => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400/50 ${manualHardMode ? 'bg-purple-500' : 'bg-white/20'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${manualHardMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="ml-3 text-white/80 dark:text-white/70 text-sm select-none flex items-center relative">
              Hard Mode (Scenario-based)
              <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-orange-200 uppercase tracking-wide">
                {difficultyLevel}
              </span>
              {streak > 0 && (
                <span className="ml-3 flex items-center text-orange-400 font-bold whitespace-nowrap">
                  <span 
                    className="origin-bottom inline-flex items-center justify-center transition-all duration-1000 ease-out streak-flame-core"
                    style={{ 
                      transform: `scale(${1 + streak * 0.15 + (showFireAnimation ? 0.8 : 0)})`, 
                      marginRight: `${streak * 4 + 4}px`,
                      marginLeft: `${streak * 4 + 4}px`
                    }}
                  >
                    <span className="streak-flame-aura" aria-hidden="true" />
                    <span className="animate-fire-alive inline-block origin-bottom">🔥</span>
                  </span>
                  <span className="ml-1 z-10 relative">Streak: {streak}</span>
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="grid xl:grid-cols-10 gap-8">
          {/* Document Viewer - 70% */}
          <div className="space-y-6 xl:col-span-7">
            <DocumentViewer 
              page={{
                ...currentPage,
                completed: completedPages.has(currentPageIndex)
              }} 
              totalPages={totalPages}
              document={document}
              isTextLoading={isBatchLoading}
              onBackToHome={onBackToHome}
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
                    flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl
                    text-white/80 hover:text-white hover:bg-white/10
                    font-medium transition-all duration-200 group
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden text-sm">Prev</span>
                </button>

                {/* Page Progress */}
                <div className="text-center space-y-2 sm:space-y-3">
                  <div className="text-white/70 text-xs sm:text-sm font-medium">Page Progress</div>
                  <div className="flex space-x-2">
                    {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if ((i === currentPageIndex) || completedPages.has(i)) {
                            setCurrentPageIndex(i);
                            setShowQuiz(false);
                          }
                        }}
                        title={
                          skippedPages.has(i) ? 'Marked as read (skipped quiz)'
                          : completedPages.has(i) ? 'Completed'
                          : `Page ${i + 1}`
                        }
                        className={`
                          w-3 h-3 rounded-full transition-all duration-300 transform hover:scale-125
                          ${i === currentPageIndex 
                            ? 'bg-blue-400 shadow-glow-blue' 
                            : skippedPages.has(i)
                              ? 'bg-white/50 cursor-pointer'
                              : completedPages.has(i)
                                ? 'bg-green-400 shadow-glow cursor-pointer'
                                : 'bg-white/30'
                          }
                          ${(i === currentPageIndex || completedPages.has(i)) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                        `}
                      />
                    ))}
                    {totalPages > 8 && (
                      <span className="text-white/50 text-xs">...</span>
                    )}
                  </div>
                  <div className="text-white/60 text-xs">
                    Page {currentPageIndex + 1} of {totalPages}
                  </div>
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPageIndex === totalPages - 1 || !canNavigateToNext()}
                  className="
                    relative group/btn overflow-hidden
                    bg-gradient-blue hover:shadow-glow-blue text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl
                    font-semibold transition-all duration-300 
                    transform hover:scale-105 hover:-translate-y-1
                    focus:outline-none focus:ring-4 focus:ring-blue-300/50
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    shadow-lg hover:shadow-xl
                  "
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center">
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden text-sm">Next</span>
                    <ChevronRight className="w-5 h-5 ml-1 sm:ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Quiz Section - 30% */}
          <div className="space-y-6 xl:col-span-3">
            {showQuiz && quizQuestions ? (
              <Quiz
                questions={quizQuestions}
                onQuizComplete={handleQuizComplete}
                onQuizReset={handleQuizReset}
                onCorrectAnswer={handleCorrectAnswer}
                onIncorrectAnswer={handleIncorrectAnswer}
              />
            ) : (
              <div className="
                bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl rounded-3xl p-6
                border border-white/20 dark:border-dark-700/20
                shadow-glass dark:shadow-glass-dark
                text-center animate-scale-in
                max-w-xs mx-auto flex flex-col items-center justify-center min-h-[340px]
              ">
                {skippedPages.has(currentPageIndex) ? (
                  // Already marked as read — show a neutral badge
                  <div className="space-y-4">
                    <div className="relative">
                      <BookMarked className="w-14 h-14 text-white/50 mx-auto" />
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed">
                      You marked this page as read without a quiz.
                    </p>
                    <button
                      onClick={() => {
                        // Allow retaking quiz
                        const newSkipped = new Set(skippedPages);
                        newSkipped.delete(currentPageIndex);
                        setSkippedPages(newSkipped);
                        const newCompleted = new Set(completedPages);
                        newCompleted.delete(currentPageIndex);
                        setCompletedPages(newCompleted);
                        setPageValid(false);
                      }}
                      className="text-white/50 hover:text-white/80 text-sm underline underline-offset-2 transition-colors duration-200"
                    >
                      Take the quiz instead
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 w-full">
                    <div className="relative">
                      <BookOpen className="w-16 h-16 text-purple-400 mx-auto animate-float" />
                      <div className="absolute inset-0 w-16 h-16 bg-purple-400/30 rounded-full blur-xl mx-auto"></div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-white dark:text-white font-geist">
                        Ready for a Knowledge Check?
                      </h3>
                      <p className="text-white/80 dark:text-white/70 leading-relaxed">
                        Test your understanding of this page before moving on!
                      </p>
                    </div>
                    {quizError && (
                      <div className="text-red-400 text-sm font-medium">{quizError}</div>
                    )}
                    <button
                      onClick={fetchQuizQuestions}
                      disabled={loadingQuiz}
                      className="
                        relative group/btn overflow-hidden
                        bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600
                        text-white px-8 py-4 rounded-2xl font-semibold text-lg
                        transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
                        focus:outline-none focus:ring-4 focus:ring-purple-300/50
                        shadow-xl hover:shadow-2xl
                        glitter-btn
                        disabled:opacity-60 disabled:cursor-not-allowed
                      "
                      style={{
                        boxShadow: '0 0 16px 2px #f472b6, 0 0 32px 4px #a78bfa',
                        backgroundSize: '200% 200%',
                        animation: loadingQuiz ? 'pulse 1s infinite' : 'glitter 2s infinite',
                      }}
                    >
                      <span className="relative flex items-center justify-center">
                        {loadingQuiz ? 'Loading...' : '✨ Start Quiz'}
                      </span>
                    </button>

                    {/* Mark as Read — subtle escape hatch, de-emphasised intentionally */}
                    <button
                      onClick={handleMarkAsRead}
                      className="
                        flex items-center justify-center gap-1.5 mx-auto
                        text-white/40 hover:text-white/70 text-sm
                        transition-colors duration-200
                      "
                      title="Skip the quiz and mark this page as read. Progress will show this page differently from quizzed pages."
                    >
                      <BookMarked className="w-3.5 h-3.5" />
                      Mark as read & skip quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};