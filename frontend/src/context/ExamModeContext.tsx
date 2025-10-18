'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

const ExamModeContext = createContext({ examMode: false, setExamMode: (v: boolean) => {} });

export const ExamModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [examMode, setExamMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('exam-mode', examMode);
    return () => document.body.classList.remove('exam-mode');
  }, [examMode]);

  return (
    <ExamModeContext.Provider value={{ examMode, setExamMode }}>
      {children}
    </ExamModeContext.Provider>
  );
};

export const useExamMode = () => useContext(ExamModeContext);

export default ExamModeContext;
