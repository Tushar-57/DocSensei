import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Home, BookOpen, Compass } from 'lucide-react';
import { Document, ChatMessage } from '../types';
import { DocumentViewer } from './DocumentViewer';
import { ChatBot } from './ChatBot';
import { ThemeToggle } from './ThemeToggle';

interface FreeReadingModeProps {
  document: Document;
  onBackToHome: () => void;
}

export const FreeReadingMode: React.FC<FreeReadingModeProps> = ({ document, onBackToHome }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Welcome to your personalized reading experience! I'm here to help you understand the content, answer questions, and provide insights as you explore the document. Feel free to ask me anything!",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);

  const currentPage = document.pages[currentPageIndex];
  const totalPages = document.pages.length;
  const readingProgress = ((currentPageIndex + 1) / totalPages) * 100;

  const handleSendMessage = (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(message, currentPageIndex + 1),
        sender: 'ai',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1200);
  };

  const generateAIResponse = (userMessage: string, pageNumber: number): string => {
    const responses = [
      `Great question about page ${pageNumber}! This section focuses on key concepts that build upon previous material. Let me break down the main ideas for you.`,
      `I can see why that part might be interesting. The content on this page introduces important principles that connect to broader themes throughout the document.`,
      `That's an insightful observation! This particular section emphasizes practical applications of the theoretical concepts we've been exploring.`,
      `Excellent point! The author presents this information in a way that encourages critical thinking about the subject matter.`,
      `This is indeed a crucial part of the document. The concepts here form the foundation for understanding more advanced topics that come later.`,
      `I'm glad you asked about that! This section provides valuable context that helps illuminate the broader narrative of the document.`,
      `That's a thoughtful question. The material on this page demonstrates how different concepts interconnect and support each other.`,
      `You've identified an important theme! This content showcases practical examples that make abstract concepts more concrete and understandable.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
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

  return (
    <div className="min-h-screen bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <ThemeToggle />

      {/* Header */}
      <div className="relative z-10 bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl border-b border-white/20 dark:border-dark-700/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="bg-gradient-purple rounded-2xl w-12 h-12 flex items-center justify-center">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 w-12 h-12 bg-purple-400/30 rounded-2xl blur-xl"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white dark:text-white font-geist">
                  Flexible Exploration
                </h1>
                <p className="text-white/70 dark:text-white/60 text-sm">
                  {document.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
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
        <div className="space-y-6">
          {/* Document Viewer */}
          <DocumentViewer page={currentPage} totalPages={totalPages} />

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
                  flex items-center space-x-3 px-6 py-3 rounded-2xl
                  text-white/80 hover:text-white hover:bg-white/10
                  font-medium transition-all duration-200 group
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                <span>Previous Page</span>
              </button>

              {/* Page Navigation */}
              <div className="text-center space-y-3">
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

              <button
                onClick={handleNextPage}
                disabled={currentPageIndex === totalPages - 1}
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
                  Next Page
                  <ChevronRight className="w-5 h-5 ml-3 group-hover/btn:translate-x-1 transition-transform duration-300" />
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
      <ChatBot messages={chatMessages} onSendMessage={handleSendMessage} />
    </div>
  );
};