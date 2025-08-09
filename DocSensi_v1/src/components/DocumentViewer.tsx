import React from 'react';
import { Page } from '../types';
import { CheckCircle, BookOpen } from 'lucide-react';

interface DocumentViewerProps {
  page: Page;
  totalPages: number;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ page, totalPages }) => {
  return (
    <div className="
      bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl rounded-3xl p-8
      border border-white/20 dark:border-dark-700/20
      shadow-glass dark:shadow-glass-dark
      transition-all duration-500 hover:shadow-xl
      animate-fade-in
    ">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="bg-gradient-blue rounded-2xl w-12 h-12 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="absolute inset-0 w-12 h-12 bg-blue-400/30 rounded-2xl blur-xl"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white dark:text-white font-geist">
              Page {page.number}
            </h2>
            <p className="text-white/60 dark:text-white/50">
              of {totalPages} pages
            </p>
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
          bg-white/5 dark:bg-dark-700/5 backdrop-blur-sm rounded-2xl p-8
          border border-white/10 dark:border-dark-600/10
          shadow-inner-glow
        ">
          <div className="prose prose-lg max-w-none">
            <p className="text-white/90 dark:text-white/80 leading-relaxed text-lg font-light">
              {page.content}
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-purple-400/30 rounded-full blur-sm"></div>
        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-400/20 rounded-full blur-sm"></div>
      </div>
    </div>
  );
};