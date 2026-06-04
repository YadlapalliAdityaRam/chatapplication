import React from 'react';
import { Link } from 'react-router-dom';

const URL_REGEX = /^(https?:\/\/[^\s]+)$/i;
const MENTION_REGEX = /^@(\w+)$/;

export const renderFormattedText = (text) => {
  if (!text) return null;
  
  // Split by URLs and mentions
  const parts = text.split(/((?:https?:\/\/[^\s]+)|(?:@\w+))/g);
  
  return parts.map((part, index) => {
    if (URL_REGEX.test(part)) {
      // Ensure the URL is valid, if it's somehow just a scheme we don't render it as a link, but the regex enforces non-whitespace
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="formatted-link"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    
    const mentionMatch = part.match(MENTION_REGEX);
    if (mentionMatch) {
      const uname = mentionMatch[1];
      return (
        <Link 
          key={index} 
          to={`/profile/${uname}`} 
          className="mention-link" 
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    
    return <span key={index}>{part}</span>;
  });
};
