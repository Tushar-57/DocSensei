import React from 'react';
import { BookOpen, MessageCircle, ArrowRight, Zap, Brain } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface ModeSelectionProps {
  onModeSelect: (mode: 'learning' | 'free-reading') => void;
  documentName: string;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onModeSelect, documentName }) => {
  return (
    <div className="min-h-screen bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <ThemeToggle />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-white dark:text-white mb-4 font-geist tracking-tight">
              Choose Your Learning Journey
            </h2>
            <p className="text-white/80 dark:text-white/70 text-xl max-w-2xl mx-auto leading-relaxed">
              How would you like to explore <span className="font-semibold text-white">"{documentName}"</span>?
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Learning Mode */}
            <div className="animate-slide-up group">
              <div className="
                relative h-full bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl rounded-3xl p-8
                border border-white/20 dark:border-dark-700/20
                shadow-glass dark:shadow-glass-dark
                hover:shadow-glow-blue transition-all duration-500
                transform hover:scale-[1.02] hover:-translate-y-2
              ">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-blue opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500"></div>
                
                <div className="relative z-10 text-center h-full flex flex-col">
                  {/* Icon */}
                  <div className="relative mb-8">
                    <div className="bg-gradient-blue rounded-3xl w-20 h-20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                      <Brain className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute inset-0 w-20 h-20 bg-blue-400/30 rounded-3xl blur-xl mx-auto group-hover:bg-blue-400/50 transition-all duration-300"></div>
                  </div>
                  
                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white dark:text-white mb-3 font-geist">
                        Structured Learning
                      </h3>
                      <p className="text-white/70 dark:text-white/60 text-lg leading-relaxed">
                        Master content through guided page-by-page navigation with interactive quizzes. 
                        Answer questions correctly to unlock the next section and track your progress.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {[
                        { icon: BookOpen, text: 'Page-by-page progression' },
                        { icon: Zap, text: 'Interactive quiz challenges' },
                        { icon: Brain, text: 'Knowledge retention tracking' }
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center text-white/80 dark:text-white/70 group-hover:text-white transition-colors duration-300">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-500/30 transition-colors duration-300">
                            <feature.icon className="w-4 h-4 text-blue-400" />
                          </div>
                          <span className="font-medium">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onModeSelect('learning')}
                    className="
                      relative group/btn overflow-hidden mt-8
                      bg-gradient-blue hover:shadow-glow-blue text-white px-8 py-4 rounded-2xl
                      font-semibold text-lg transition-all duration-300 
                      transform hover:scale-105 hover:-translate-y-1
                      focus:outline-none focus:ring-4 focus:ring-blue-300/50
                      shadow-xl hover:shadow-2xl w-full
                    "
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center justify-center">
                      Start Learning Journey
                      <ArrowRight className="w-5 h-5 ml-3 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Free Reading Mode */}
            <div className="animate-slide-up group" style={{ animationDelay: '0.1s' }}>
              <div className="
                relative h-full bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl rounded-3xl p-8
                border border-white/20 dark:border-dark-700/20
                shadow-glass dark:shadow-glass-dark
                hover:shadow-glow transition-all duration-500
                transform hover:scale-[1.02] hover:-translate-y-2
              ">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-purple opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500"></div>
                
                <div className="relative z-10 text-center h-full flex flex-col">
                  {/* Icon */}
                  <div className="relative mb-8">
                    <div className="bg-gradient-purple rounded-3xl w-20 h-20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute inset-0 w-20 h-20 bg-purple-400/30 rounded-3xl blur-xl mx-auto group-hover:bg-purple-400/50 transition-all duration-300"></div>
                  </div>
                  
                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white dark:text-white mb-3 font-geist">
                        Flexible Exploration
                      </h3>
                      <p className="text-white/70 dark:text-white/60 text-lg leading-relaxed">
                        Read at your own pace with an intelligent AI companion. Get instant answers, 
                        explanations, and insights as you explore the content freely.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {[
                        { icon: BookOpen, text: 'Self-paced navigation' },
                        { icon: MessageCircle, text: 'AI-powered assistance' },
                        { icon: Zap, text: 'Instant explanations' }
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center text-white/80 dark:text-white/70 group-hover:text-white transition-colors duration-300">
                          <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center mr-4 group-hover:bg-purple-500/30 transition-colors duration-300">
                            <feature.icon className="w-4 h-4 text-purple-400" />
                          </div>
                          <span className="font-medium">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onModeSelect('free-reading')}
                    className="
                      relative group/btn overflow-hidden mt-8
                      bg-gradient-purple hover:shadow-glow text-white px-8 py-4 rounded-2xl
                      font-semibold text-lg transition-all duration-300 
                      transform hover:scale-105 hover:-translate-y-1
                      focus:outline-none focus:ring-4 focus:ring-purple-300/50
                      shadow-xl hover:shadow-2xl w-full
                    "
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center justify-center">
                      Start Free Reading
                      <ArrowRight className="w-5 h-5 ml-3 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};