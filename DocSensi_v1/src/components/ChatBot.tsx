import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Minimize2, Maximize2, Sparkles, Bot } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatBotProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
      setIsTyping(true);
      // Simulate AI typing delay
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  return (
    <div className={`
      fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out
      ${isMinimized ? 'w-16 h-16' : 'w-96 h-[600px]'}
    `}>
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="
            relative group w-16 h-16 bg-gradient-purple rounded-2xl shadow-glass
            flex items-center justify-center text-white
            hover:shadow-glow transform hover:scale-110 transition-all duration-300
            animate-pulse-glow
          "
        >
          <MessageCircle className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute inset-0 w-16 h-16 bg-purple-400/30 rounded-2xl blur-xl group-hover:bg-purple-400/50 transition-all duration-300"></div>
          
          {/* Notification dot */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-white animate-bounce">
            <div className="w-full h-full bg-pink-400 rounded-full animate-ping"></div>
          </div>
        </button>
      ) : (
        <div className="
          bg-white/10 dark:bg-dark-800/10 backdrop-blur-xl rounded-3xl 
          border border-white/20 dark:border-dark-700/20
          shadow-glass dark:shadow-glass-dark
          flex flex-col h-full overflow-hidden
          animate-scale-in
        ">
          {/* Header */}
          <div className="bg-gradient-purple rounded-t-3xl p-4 flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
            <div className="relative flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 w-10 h-10 bg-white/10 rounded-2xl blur-sm"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold font-geist">AI Learning Assistant</h3>
                <p className="text-white/70 text-sm">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="
                relative text-white/80 hover:text-white hover:bg-white/20 
                p-2 rounded-xl transition-all duration-200 group
              "
            >
              <Minimize2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="relative">
                  <Sparkles className="w-12 h-12 text-purple-400 mx-auto animate-float" />
                  <div className="absolute inset-0 w-12 h-12 bg-purple-400/20 rounded-full blur-xl mx-auto"></div>
                </div>
                <div className="space-y-2">
                  <p className="text-white/80 dark:text-white/70 font-medium">Ready to assist!</p>
                  <p className="text-white/60 dark:text-white/50 text-sm">
                    Ask me anything about the document content
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  >
                    <div
                      className={`
                        max-w-[85%] p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300
                        ${message.sender === 'user'
                          ? 'bg-gradient-purple text-white border-purple-400/30 shadow-glow'
                          : 'bg-white/10 dark:bg-dark-700/10 text-white/90 dark:text-white/80 border-white/20 dark:border-dark-600/20'
                        }
                      `}
                    >
                      <p className="text-sm leading-relaxed font-medium">{message.text}</p>
                      <div className="text-xs opacity-60 mt-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start animate-slide-up">
                    <div className="bg-white/10 dark:bg-dark-700/10 border border-white/20 dark:border-dark-600/20 p-4 rounded-2xl backdrop-blur-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 dark:border-dark-600/10">
            <div className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="
                  flex-1 px-4 py-3 bg-white/10 dark:bg-dark-700/10 backdrop-blur-sm
                  border border-white/20 dark:border-dark-600/20 rounded-2xl
                  text-white placeholder-white/50 dark:placeholder-white/40
                  focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50
                  transition-all duration-200
                "
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="
                  relative group/btn overflow-hidden
                  bg-gradient-purple hover:shadow-glow text-white p-3 rounded-2xl
                  transition-all duration-300 transform hover:scale-105
                  focus:outline-none focus:ring-4 focus:ring-purple-300/50
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  shadow-lg hover:shadow-xl
                "
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <Send className="w-5 h-5 relative group-hover/btn:rotate-12 transition-transform duration-300" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};