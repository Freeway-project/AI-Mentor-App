'use client';

import { forwardRef, InputHTMLAttributes, useEffect, useMemo, useState } from 'react';

interface AnimatedPlaceholderInputProps extends InputHTMLAttributes<HTMLInputElement> {
  deletingSpeedMs?: number;
  pauseMs?: number;
  suggestions: string[];
  typingSpeedMs?: number;
}

type AnimationPhase = 'typing' | 'pausing' | 'deleting';

export const AnimatedPlaceholderInput = forwardRef<HTMLInputElement, AnimatedPlaceholderInputProps>(
  (
    {
      deletingSpeedMs = 36,
      pauseMs = 1400,
      placeholder,
      suggestions,
      typingSpeedMs = 62,
      value,
      ...props
    },
    ref
  ) => {
    const placeholderSuggestions = useMemo(
      () => suggestions.map(suggestion => suggestion.trim()).filter(Boolean),
      [suggestions]
    );

    const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [phase, setPhase] = useState<AnimationPhase>('typing');

    const hasValue = typeof value === 'string' ? value.length > 0 : value != null;
    const activeSuggestion = placeholderSuggestions[suggestionIndex] ?? '';

    useEffect(() => {
      if (hasValue || placeholderSuggestions.length === 0) {
        setDisplayedPlaceholder('');
        setPhase('typing');
        return;
      }

      const timeoutId = window.setTimeout(() => {
        if (phase === 'typing') {
          const nextValue = activeSuggestion.slice(0, displayedPlaceholder.length + 1);
          setDisplayedPlaceholder(nextValue);

          if (nextValue === activeSuggestion) {
            setPhase('pausing');
          }

          return;
        }

        if (phase === 'pausing') {
          setPhase('deleting');
          return;
        }

        const nextValue = activeSuggestion.slice(0, Math.max(displayedPlaceholder.length - 1, 0));
        setDisplayedPlaceholder(nextValue);

        if (nextValue.length === 0) {
          setSuggestionIndex(currentIndex => (currentIndex + 1) % placeholderSuggestions.length);
          setPhase('typing');
        }
      }, phase === 'pausing' ? pauseMs : phase === 'typing' ? typingSpeedMs : deletingSpeedMs);

      return () => window.clearTimeout(timeoutId);
    }, [
      activeSuggestion,
      deletingSpeedMs,
      displayedPlaceholder,
      hasValue,
      pauseMs,
      phase,
      placeholderSuggestions,
      typingSpeedMs,
    ]);

    return (
      <input
        ref={ref}
        placeholder={hasValue ? '' : displayedPlaceholder || placeholder}
        value={value}
        {...props}
      />
    );
  }
);

AnimatedPlaceholderInput.displayName = 'AnimatedPlaceholderInput';
