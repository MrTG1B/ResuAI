
"use client";

import { useEffect, useState, useCallback } from 'react';

/**
 * Returns a callback ref. Attach it to a container element.
 * When the element mounts, an IntersectionObserver is set up that adds
 * `is-visible` to all `.reveal*` children when they enter the viewport.
 *
 * Using a callback ref (instead of useRef) means the effect re-runs
 * whenever the element actually mounts — even if the component initially
 * renders a loading state and only mounts the real content later.
 */
export function useScrollReveal(
  rootMargin = '0px 0px -60px 0px',
  threshold = 0.12,
) {
  const [containerEl, setContainerEl] = useState<HTMLElement | null>(null);

  const containerRef = useCallback((node: HTMLElement | null) => {
    setContainerEl(node);
  }, []);

  useEffect(() => {
    if (!containerEl) return;

    const targets = containerEl.querySelectorAll<HTMLElement>(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale',
    );

    if (targets.length === 0) return;

    // Immediately reveal elements already in the viewport so there is no
    // flash of invisible content for above-the-fold sections.
    targets.forEach((t) => {
      const rect = t.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        t.classList.add('is-visible');
      }
    });

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

    targets.forEach((t) => {
      if (!t.classList.contains('is-visible')) {
        observer.observe(t);
      }
    });

    return () => observer.disconnect();
  }, [containerEl, rootMargin, threshold]);

  return containerRef;
}
