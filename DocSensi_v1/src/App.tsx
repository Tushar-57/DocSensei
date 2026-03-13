import React, { useEffect, useState } from 'react';
import { DocumentUpload } from './components/DocumentUpload';
import { ModeSelection } from './components/ModeSelection';
import { LearningMode } from './components/LearningMode';
import { FreeReadingMode } from './components/FreeReadingMode';
import { Document, AppMode } from './types';

const APP_STORAGE_KEY = 'docsensei.app-state';

type StoredDocument = Omit<Document, 'uploadedAt'> & {
  uploadedAt: string;
};

interface StoredAppState {
  mode: AppMode;
  currentDocument: StoredDocument | null;
}

const isValidMode = (value: unknown): value is AppMode => {
  return value === 'upload' || value === 'mode-selection' || value === 'learning' || value === 'free-reading';
};

const toStoredDocument = (document: Document): StoredDocument => ({
  ...document,
  uploadedAt: document.uploadedAt.toISOString(),
});

const fromStoredDocument = (document: StoredDocument): Document => ({
  ...document,
  uploadedAt: new Date(document.uploadedAt),
});

const readStoredAppState = (): { mode: AppMode; currentDocument: Document | null } => {
  if (typeof window === 'undefined') {
    return { mode: 'upload', currentDocument: null };
  }

  try {
    const rawState = window.localStorage.getItem(APP_STORAGE_KEY);
    if (!rawState) {
      return { mode: 'upload', currentDocument: null };
    }

    const parsedState = JSON.parse(rawState) as Partial<StoredAppState>;
    const currentDocument = parsedState.currentDocument ? fromStoredDocument(parsedState.currentDocument) : null;
    const mode = isValidMode(parsedState.mode) ? parsedState.mode : 'upload';

    if (!currentDocument) {
      return { mode: 'upload', currentDocument: null };
    }

    return {
      mode: mode === 'upload' ? 'mode-selection' : mode,
      currentDocument,
    };
  } catch {
    return { mode: 'upload', currentDocument: null };
  }
};

function App() {
  const [appState, setAppState] = useState(() => readStoredAppState());
  const { mode, currentDocument } = appState;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!currentDocument) {
      window.localStorage.removeItem(APP_STORAGE_KEY);
      return;
    }

    const storedState: StoredAppState = {
      mode,
      currentDocument: toStoredDocument(currentDocument),
    };

    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(storedState));
  }, [mode, currentDocument]);

  const handleDocumentUploaded = (document: Document) => {
    setAppState({
      currentDocument: document,
      mode: 'mode-selection',
    });
  };

  const handleModeSelect = (selectedMode: 'learning' | 'free-reading') => {
    setAppState((currentState) => ({
      ...currentState,
      mode: selectedMode,
    }));
  };

  const handleBackToHome = () => {
    setAppState({
      currentDocument: null,
      mode: 'upload',
    });
  };

  const renderCurrentMode = () => {
    switch (mode) {
      case 'upload':
        return <DocumentUpload onDocumentUploaded={handleDocumentUploaded} />;
      
      case 'mode-selection':
        return (
          <ModeSelection 
            onModeSelect={handleModeSelect} 
            documentName={currentDocument?.name || ''} 
          />
        );
      
      case 'learning':
        return currentDocument ? (
          <LearningMode 
            document={currentDocument} 
            onBackToHome={handleBackToHome}
          />
        ) : null;
      
      case 'free-reading':
        return currentDocument ? (
          <FreeReadingMode 
            document={currentDocument} 
            onBackToHome={handleBackToHome}
          />
        ) : null;
      
      default:
        return <DocumentUpload onDocumentUploaded={handleDocumentUploaded} />;
    }
  };

  return (
    <div className="font-geist antialiased min-h-screen bg-white flex flex-col">
      <div className="flex-grow flex flex-col">
        {renderCurrentMode()}
      </div>
    </div>
  );
}

export default App;