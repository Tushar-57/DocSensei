export interface Document {
  id: string;
  name: string;
  type: 'PDF' | 'Word';
  content: string;
  pages: Page[];
  uploadedAt: Date;
  fileUrl?: string; // URL to the uploaded file
}

export interface Page {
  id: string;
  number: number;
  content: string;
  quizQuestions?: QuizQuestion[];
  completed?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizState {
  currentQuestionIndex: number;
  correctAnswers: number;
  totalQuestions: number;
  isComplete: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export type AppMode = 'upload' | 'mode-selection' | 'learning' | 'free-reading';

export interface AppState {
  mode: AppMode;
  currentDocument: Document | null;
  currentPage: number;
  quizState: QuizState;
  chatMessages: ChatMessage[];
}