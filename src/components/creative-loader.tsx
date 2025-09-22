
"use client";

import { useState, useEffect } from 'react';
import { PenSquare, FileText, ScanText, Bot, Sparkles, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Array of brand colors to cycle through
const brandColors = [
    'text-primary', // Orange-Yellow
    'text-[#F71B3D]', // Red
    'text-[#45B8AC]', // Teal
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
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative w-10 h-10 mb-3 flex items-center justify-center">
        {icons.map((Icon, index) => {
          const colorClass = brandColors[index % brandColors.length];
          return (
            <Icon
                key={index}
                className={cn(
                    'w-10 h-10 absolute transition-all duration-500 ease-in-out',
                    colorClass,
                    index === currentIconIndex ? 'opacity-100 transform scale-100 rotate-0' : 'opacity-0 transform scale-75 -rotate-12'
                )}
            />
          )
        })}
      </div>
      <p className="text-sm text-foreground mt-2 transition-opacity duration-500">{currentText}</p>
      {children}
    </div>
  );
}
