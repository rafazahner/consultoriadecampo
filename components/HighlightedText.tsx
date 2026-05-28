
import React from 'react';
import { normalizeText } from '../utils/searchUtils';

interface HighlightedTextProps {
  text: string;
  highlight: string;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const normalizedText = normalizeText(text);
  const normalizedHighlight = normalizeText(highlight);

  const startIndex = normalizedText.indexOf(normalizedHighlight);
  if (startIndex === -1) {
    return <span>{text}</span>;
  }

  const before = text.substring(0, startIndex);
  const match = text.substring(startIndex, startIndex + highlight.length);
  const after = text.substring(startIndex + highlight.length);

  return (
    <span>
      {before}
      {match}
      {after}
    </span>
  );
};