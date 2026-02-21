
"use client";

import { useEffect, useRef } from 'react';

/**
 * Attaches an IntersectionObserver to the returned ref and adds the
 * `is-visible` class when the element enters the viewport.
 * Works with the CSS reveal / reveal-left / reveal-right / reveal-scale classes.
 */
export function useScrollReveal(
  rootMargin = '0px 0px -60px 0px',
  threshold = 0.12,
) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const targets = el.querySelectorAll<HTMLElement>(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale',
    );

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin, threshold },
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return containerRef;
}
