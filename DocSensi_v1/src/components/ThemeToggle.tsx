import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'dark' || (!theme && systemPrefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="
        fixed top-6 right-6 z-50 p-3 rounded-2xl
        bg-white/20 dark:bg-dark-800/20 backdrop-blur-md
        border border-white/30 dark:border-dark-700/30
        shadow-glass dark:shadow-glass-dark
        hover:bg-white/30 dark:hover:bg-dark-700/30
        transition-all duration-300 transform hover:scale-110
        group
      "
    >
      <div className="relative w-6 h-6">
        <Sun className={`
          absolute inset-0 w-6 h-6 text-yellow-500 transition-all duration-300
          ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
        `} />
        <Moon className={`
          absolute inset-0 w-6 h-6 text-blue-400 transition-all duration-300
          ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
        `} />
      </div>
    </button>
  );
};