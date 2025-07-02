
"use client";

import { useState, useEffect } from 'react';
import { PenSquare, FileText, ScanText, Bot, Sparkles, ClipboardCheck } from 'lucide-react';

const defaultTexts = [
  "Analyzing your document...",
  "Extracting key achievements...",
  "Optimizing for recruiters...",
  "Polishing your professional story...",
  "Almost there...",
];

// List of icons to cycle through
const icons = [
  PenSquare,
  FileText,
  ScanText,
  Bot,
  Sparkles,
  ClipboardCheck,
];

interface CreativeLoaderProps {
  texts?: string[];
  className?: string;
  children?: React.ReactNode;
}

export function CreativeLoader({ texts = defaultTexts, className, children }: CreativeLoaderProps) {
  const [currentText, setCurrentText] = useState(texts[0]);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setCurrentText(prevText => {
        const currentIndex = texts.indexOf(prevText);
        const nextIndex = (currentIndex + 1) % texts.length;
        return texts[nextIndex];
      });
    }, 2000);

    const iconInterval = setInterval(() => {
        setCurrentIconIndex(prevIndex => (prevIndex + 1) % icons.length);
    }, 1500); // Change icon every 1.5 seconds

    return () => {
        clearInterval(textInterval);
        clearInterval(iconInterval);
    };
  }, [texts]);

  return (
    <div className={className}>
      <div className="relative w-10 h-10 mb-3 flex items-center justify-center">
        {icons.map((Icon, index) => (
          <Icon
            key={index}
            className={`w-10 h-10 text-primary absolute transition-opacity duration-500 ease-in-out ${
              index === currentIconIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-foreground mt-2 transition-opacity duration-500">{currentText}</p>
      {children}
    </div>
  );
}
