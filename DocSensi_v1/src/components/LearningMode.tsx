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

  const [quizQuestions] = useState(() => generateQuizQuestions());

  useEffect(() => {
    // Show quiz automatically when entering a new page that hasn't been completed
    if (!completedPages.has(currentPageIndex)) {
      const timer = setTimeout(() => {
        setShowQuiz(true);
      }, 3000); // Show quiz after 3 seconds of reading
      return () => clearTimeout(timer);
    }
  }, [currentPageIndex, completedPages]);

  const handleQuizComplete = () => {
    const newCompletedPages = new Set(completedPages);
    newCompletedPages.add(currentPageIndex);
    setCompletedPages(newCompletedPages);
    setShowQuiz(false);
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
        <div className="grid xl:grid-cols-2 gap-8">
          {/* Document Viewer */}
          <div className="space-y-6">
            <DocumentViewer 
              page={{
                ...currentPage,
                completed: completedPages.has(currentPageIndex)
              }} 
              totalPages={totalPages} 
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
                          if (i <= currentPageIndex || completedPages.has(i)) {
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
                              : 'bg-white/30 hover:bg-white/50'
                          }
                          ${(i <= currentPageIndex || completedPages.has(i)) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
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

          {/* Quiz Section */}
          <div className="space-y-6">
            {showQuiz || !completedPages.has(currentPageIndex) ? (
              <Quiz
                questions={quizQuestions}
                onQuizComplete={handleQuizComplete}
                onQuizReset={handleQuizReset}
              />
            ) : (
              <div className="
                bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl rounded-3xl p-8
                border border-white/20 dark:border-dark-700/20
                shadow-glass dark:shadow-glass-dark
                text-center animate-scale-in
              ">
                <div className="space-y-6">
                  <div className="relative">
                    <BookOpen className="w-16 h-16 text-green-400 mx-auto animate-float" />
                    <div className="absolute inset-0 w-16 h-16 bg-green-400/30 rounded-full blur-xl mx-auto"></div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-white dark:text-white font-geist">
                      Page Mastered!
                    </h3>
                    <p className="text-white/80 dark:text-white/70 leading-relaxed">
                      Excellent work! You've successfully completed this page. 
                      You can now advance to the next section or review the quiz.
                    </p>
                  </div>

                  <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4">
                    <p className="text-green-400 font-medium">
                      ✨ Ready to continue your learning journey!
                    </p>
                  </div>

                  <button
                    onClick={() => setShowQuiz(true)}
                    className="
                      relative group/btn overflow-hidden
                      bg-gradient-purple hover:shadow-glow text-white px-6 py-3 rounded-2xl
                      font-semibold transition-all duration-300 
                      transform hover:scale-105 hover:-translate-y-1
                      focus:outline-none focus:ring-4 focus:ring-purple-300/50
                      shadow-lg hover:shadow-xl
                    "
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative">Review Quiz</span>
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