import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Home, Brain, Target } from 'lucide-react';
import { Document, QuizQuestion } from '../types';
import { DocumentViewer } from './DocumentViewer';
import { Quiz } from './Quiz';
import { ThemeToggle } from './ThemeToggle';

interface LearningModeProps {
  document: Document;
  onBackToHome: () => void;
}

export const LearningMode: React.FC<LearningModeProps> = ({ document, onBackToHome }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [completedPages, setCompletedPages] = useState<Set<number>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizAutoAdvance, setQuizAutoAdvance] = useState(true); // Switch for auto-advance

  const currentPage = document.pages[currentPageIndex];
  const totalPages = document.pages.length;
  const overallProgress = (completedPages.size / totalPages) * 100;

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
  };

  const handleQuizReset = () => {
    const newCompletedPages = new Set(completedPages);
    newCompletedPages.delete(currentPageIndex);
    setCompletedPages(newCompletedPages);
  };

  const canNavigateToNext = () => {
    return completedPages.has(currentPageIndex);
  };

  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1 && canNavigateToNext()) {
      setCurrentPageIndex(prev => prev + 1);
      setShowQuiz(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
      setShowQuiz(false);
    }
  };

  // Fetch quiz questions from backend
  const fetchQuizQuestions = async () => {
    setLoadingQuiz(true);
    setQuizError(null);
    try {
      const res = await fetch('http://localhost:5000/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageContent: currentPage.content,
          pageNumber: currentPage.number,
          documentId: document.id,
        }),
      });
      if (!res.ok) throw new Error('Failed to fetch quiz');
      const data = await res.json();
      if (data.result === 'Not a quizable page' && quizAutoAdvance) {
        // Mark as completed and auto-advance
        const newCompletedPages = new Set(completedPages);
        newCompletedPages.add(currentPageIndex);
        setCompletedPages(newCompletedPages);
        setShowQuiz(false);
        setQuizQuestions(null);
        // Move to next page if possible
        if (currentPageIndex < document.pages.length - 1) {
          setCurrentPageIndex(currentPageIndex + 1);
        }
        setLoadingQuiz(false);
        return;
      }
      if (data.questions) {
        setQuizQuestions(data.questions);
        setShowQuiz(true);
      } else if (data.error) {
        setQuizError(data.error);
      } else {
        setQuizError('No quiz available for this page.');
      }
    } catch (err: any) {
      setQuizError(err.message || 'Error fetching quiz');
    } finally {
      setLoadingQuiz(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <ThemeToggle />

      {/* Header */}
      <div className="relative z-10 bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl border-b border-white/20 dark:border-dark-700/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="bg-gradient-blue rounded-2xl w-12 h-12 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 w-12 h-12 bg-blue-400/30 rounded-2xl blur-xl"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white dark:text-white font-geist">
                  Structured Learning
                </h1>
                <p className="text-white/70 dark:text-white/60 text-sm">
                  {document.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
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
              
              <button
                onClick={onBackToHome}
                className="
                  flex items-center space-x-2 px-4 py-2 rounded-xl
                  text-white/80 hover:text-white hover:bg-white/10
                  font-medium transition-all duration-200 group
                "
              >
                <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Auto-advance switch */}
        <div className="flex items-center mb-4">
          <label className="flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={quizAutoAdvance}
              onChange={() => setQuizAutoAdvance(v => !v)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2 text-white/80 dark:text-white/70 text-sm">
              Auto-advance on non-quizable page
            </span>
          </label>
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
            />

            {/* Navigation */}
            <div className="
              bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl rounded-3xl p-6
              border border-white/20 dark:border-dark-700/20
              shadow-glass dark:shadow-glass-dark
            ">
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPageIndex === 0}
                  className="
                    flex items-center space-x-2 px-6 py-3 rounded-2xl
                    text-white/80 hover:text-white hover:bg-white/10
                    font-medium transition-all duration-200 group
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                  <span>Previous</span>
                </button>

                {/* Page Progress */}
                <div className="text-center space-y-3">
                  <div className="text-white/70 text-sm font-medium">Page Progress</div>
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
                        className={`
                          w-3 h-3 rounded-full transition-all duration-300 transform hover:scale-125
                          ${i === currentPageIndex 
                            ? 'bg-blue-400 shadow-glow-blue' 
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
                    bg-gradient-blue hover:shadow-glow-blue text-white px-6 py-3 rounded-2xl
                    font-semibold transition-all duration-300 
                    transform hover:scale-105 hover:-translate-y-1
                    focus:outline-none focus:ring-4 focus:ring-blue-300/50
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    shadow-lg hover:shadow-xl
                  "
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center">
                    Next
                    <ChevronRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
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
              />
            ) : (
              <div className="
                bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl rounded-3xl p-6
                border border-white/20 dark:border-dark-700/20
                shadow-glass dark:shadow-glass-dark
                text-center animate-scale-in
                max-w-xs mx-auto flex flex-col items-center justify-center min-h-[340px]
              ">
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};