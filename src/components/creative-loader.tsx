
"use client";

import { useState, useEffect } from 'react';
import { PenSquare } from 'lucide-react';

const defaultTexts = [
  "Analyzing your document...",
  "Extracting key achievements...",
  "Optimizing for recruiters...",
  "Polishing your professional story...",
  "Almost there...",
];

interface CreativeLoaderProps {
  texts?: string[];
  className?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function CreativeLoader({ texts = defaultTexts, className, icon, children }: CreativeLoaderProps) {
  const [currentText, setCurrentText] = useState(texts[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText(prevText => {
        const currentIndex = texts.indexOf(prevText);
        const nextIndex = (currentIndex + 1) % texts.length;
        return texts[nextIndex];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [texts]);

  return (
    <div className={className}>
      {icon || <PenSquare className="w-10 h-10 mb-3 text-primary animate-spin" />}
      <p className="text-sm text-foreground mt-2 transition-opacity duration-500">{currentText}</p>
      {children}
    </div>
  );
}
