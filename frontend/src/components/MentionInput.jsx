import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_USERS } from '../graphql/queries';
import { User } from 'lucide-react';
import './MentionInput.css';

export default function MentionInput({ value, onChange, placeholder, disabled, isTextArea, disableMentions, className }) {
  const { data } = useQuery(GET_ALL_USERS);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [cursorPos, setCursorPos] = useState(null);
  
  const inputRef = useRef(null);
  const hiddenRef = useRef(null);

  const users = data?.getAllUsers || [];
  
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(suggestionQuery.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(suggestionQuery.toLowerCase()))
  ).slice(0, 5);

  useLayoutEffect(() => {
    if (isTextArea && inputRef.current && hiddenRef.current) {
      const el = inputRef.current;
      const hiddenEl = hiddenRef.current;
      
      // Calculate height from the hidden clone (which has height: 0 and overflow: hidden)
      const newHeight = hiddenEl.scrollHeight;
      const maxHeight = 300; // Configurable max height
      
      if (newHeight <= maxHeight) {
        el.style.height = `${newHeight}px`;
        el.style.overflowY = 'hidden';
      } else {
        el.style.height = `${maxHeight}px`;
        el.style.overflowY = 'auto';
      }
    }
  }, [value, isTextArea]);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(e); 

    if (disableMentions) return;

    const cursor = e.target.selectionStart;
    
    const textBeforeCursor = val.slice(0, cursor);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      if (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === ' ' || textBeforeCursor[lastAtIndex - 1] === '\n') {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        if (!query.includes(' ') && !query.includes('\n')) {
          setSuggestionQuery(query);
          setShowSuggestions(true);
          setCursorPos(lastAtIndex);
          return;
        }
      }
    }
    
    setShowSuggestions(false);
  };

  const insertMention = (username) => {
    if (cursorPos === null) return;
    
    const beforeMention = value.slice(0, cursorPos);
    const afterMention = value.slice(inputRef.current.selectionStart);
    
    const newValue = `${beforeMention}@${username} ${afterMention}`;
    
    // Create a fake event object
    onChange({ target: { value: newValue } });
    setShowSuggestions(false);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const InputElement = isTextArea ? 'textarea' : 'input';

  return (
    <div className="mention-input-container" style={{ position: 'relative' }}>
      {isTextArea && (
        <textarea
          ref={hiddenRef}
          className={className || "mention-element"}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            height: '0',
            minHeight: '0',
            overflow: 'hidden',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: -1000,
            pointerEvents: 'none'
          }}
          value={value}
          readOnly
          tabIndex={-1}
        />
      )}
      
      <InputElement
        ref={inputRef}
        type={!isTextArea ? "text" : undefined}
        value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        disabled={disabled}
        className={className || "mention-element"}
      />
      
      {showSuggestions && filteredUsers.length > 0 && (
        <div className="mention-suggestions">
          {filteredUsers.map(u => (
            <div 
              key={u.id} 
              className="mention-suggestion-item"
              onClick={() => insertMention(u.username)}
            >
              <div className="mention-avatar" style={{ background: u.avatar ? 'transparent' : '#cbd5e1' }}>
                {u.avatar ? <img src={u.avatar} alt="avatar" /> : <User size={20} color="#ffffff" />}
              </div>
              <div className="mention-info">
                <strong>{u.name || u.username}</strong>
                <span>@{u.username}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
