
"use client";

import { useState, useEffect } from 'react';

export function useDynamicText(texts: string[], intervalMs = 2000) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % texts.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [texts, intervalMs]);

  // Reset index when texts change to avoid out of bounds
  useEffect(() => {
    setCurrentIndex(0);
  }, [texts]);


  return texts[currentIndex];
}
