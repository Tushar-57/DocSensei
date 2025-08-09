import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Zap } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizProps {
  questions: QuizQuestion[];
  onQuizComplete: () => void;
  onQuizReset: () => void;
}

export const Quiz: React.FC<QuizProps> = ({ questions, onQuizComplete, onQuizReset }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswerCorrect = selectedAnswer === currentQuestion.correctAnswer;
  const progressPercentage = (correctAnswers / 3) * 100;

  useEffect(() => {
    if (correctAnswers >= 3) {
      setTimeout(() => onQuizComplete(), 1000);
    }
  }, [correctAnswers, onQuizComplete]);

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;

    setShowResult(true);
    const newAnsweredQuestions = new Set(answeredQuestions);
    newAnsweredQuestions.add(currentQuestionIndex);
    setAnsweredQuestions(newAnsweredQuestions);

    if (isAnswerCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setCorrectAnswers(0);
    setAnsweredQuestions(new Set());
    onQuizReset();
  };

  if (correctAnswers >= 3) {
    return (
      <div className="
        bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl rounded-3xl p-8
        border border-white/20 dark:border-dark-700/20
        shadow-glass dark:shadow-glass-dark
        animate-scale-in
      ">
        <div className="text-center space-y-6">
          <div className="relative">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto animate-bounce-subtle" />
            <div className="absolute inset-0 w-20 h-20 bg-yellow-400/30 rounded-full blur-xl mx-auto"></div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-3xl font-bold text-white dark:text-white font-geist">
              Outstanding Work!
            </h3>
            <p className="text-white/80 dark:text-white/70 text-lg leading-relaxed">
              You've successfully answered {correctAnswers} questions correctly. 
              You're ready to advance to the next page!
            </p>
          </div>

          <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4">
            <p className="text-green-400 font-medium">
              ✨ Page unlocked! Continue your learning journey.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="
      bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl rounded-3xl p-8
      border border-white/20 dark:border-dark-700/20
      shadow-glass dark:shadow-glass-dark
      animate-fade-in
    ">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="bg-gradient-purple rounded-2xl w-12 h-12 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 w-12 h-12 bg-purple-400/30 rounded-2xl blur-xl"></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white dark:text-white font-geist">
                Knowledge Check
              </h3>
              <p className="text-white/60 dark:text-white/50">
                Answer 3 questions correctly to continue
              </p>
            </div>
          </div>
          
          <button
            onClick={handleReset}
            className="
              flex items-center space-x-2 px-4 py-2 rounded-xl
              text-white/70 hover:text-white hover:bg-white/10
              transition-all duration-200 group
            "
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            <span className="font-medium">Reset</span>
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70 dark:text-white/60">Progress</span>
            <span className="text-white font-medium">{correctAnswers}/3 correct</span>
          </div>
          <div className="relative w-full h-3 bg-white/10 dark:bg-dark-700/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-purple rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/30 rounded-full animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="space-y-6">
        <div className="bg-white/5 dark:bg-dark-700/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 dark:border-dark-600/10">
          <div className="flex items-start space-x-4 mb-4">
            <div className="bg-purple-500/20 text-purple-400 rounded-xl w-8 h-8 flex items-center justify-center font-bold text-sm">
              {currentQuestionIndex + 1}
            </div>
            <div className="flex-1">
              <p className="text-white/90 dark:text-white/80 text-lg leading-relaxed font-medium">
                {currentQuestion.question}
              </p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !showResult && setSelectedAnswer(index)}
              disabled={showResult}
              className={`
                w-full text-left p-4 rounded-2xl border-2 transition-all duration-300
                transform hover:scale-[1.01] hover:-translate-y-0.5
                ${selectedAnswer === index 
                  ? showResult
                    ? isAnswerCorrect
                      ? 'border-green-400/50 bg-green-500/20 shadow-glow text-green-100'
                      : 'border-red-400/50 bg-red-500/20 shadow-glow text-red-100'
                    : 'border-purple-400/50 bg-purple-500/20 shadow-glow text-white'
                  : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white'
                }
                ${showResult && index === currentQuestion.correctAnswer && selectedAnswer !== index
                  ? 'border-green-400/50 bg-green-500/20 text-green-100'
                  : ''
                }
                disabled:cursor-default
              `}
            >
              <div className="flex items-center justify-between">
                <span className="flex-1 font-medium">{option}</span>
                <div className="flex items-center space-x-2">
                  {showResult && selectedAnswer === index && (
                    isAnswerCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )
                  )}
                  {showResult && index === currentQuestion.correctAnswer && selectedAnswer !== index && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Explanation */}
        {showResult && currentQuestion.explanation && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 animate-slide-down">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-500/20 rounded-xl w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-sm font-bold">💡</span>
              </div>
              <div>
                <p className="text-blue-100 font-medium mb-1">Explanation</p>
                <p className="text-blue-200/80 leading-relaxed">{currentQuestion.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10 dark:border-dark-600/10">
        <div className="text-white/60 dark:text-white/50 text-sm">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        
        {!showResult ? (
          <button
            onClick={handleAnswerSubmit}
            disabled={selectedAnswer === null}
            className="
              relative group/btn overflow-hidden
              bg-gradient-purple hover:shadow-glow text-white px-6 py-3 rounded-2xl
              font-semibold transition-all duration-300 
              transform hover:scale-105 hover:-translate-y-1
              focus:outline-none focus:ring-4 focus:ring-purple-300/50
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              shadow-lg hover:shadow-xl
            "
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center">
              Submit Answer
              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
            </span>
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="
              relative group/btn overflow-hidden
              bg-gradient-blue hover:shadow-glow-blue text-white px-6 py-3 rounded-2xl
              font-semibold transition-all duration-300 
              transform hover:scale-105 hover:-translate-y-1
              focus:outline-none focus:ring-4 focus:ring-blue-300/50
              shadow-lg hover:shadow-xl
            "
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center">
              Next Question
              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
};