import React, { useState } from 'react';
import { DocumentUpload } from './components/DocumentUpload';
import { ModeSelection } from './components/ModeSelection';
import { LearningMode } from './components/LearningMode';
import { FreeReadingMode } from './components/FreeReadingMode';
import { Document, AppMode } from './types';

function App() {
  const [mode, setMode] = useState<AppMode>('upload');
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);

  const handleDocumentUploaded = (document: Document) => {
    setCurrentDocument(document);
    setMode('mode-selection');
  };

  const handleModeSelect = (selectedMode: 'learning' | 'free-reading') => {
    setMode(selectedMode);
  };

  const handleBackToHome = () => {
    setMode('upload');
    setCurrentDocument(null);
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