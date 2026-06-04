import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_USERS } from '../graphql/queries';
import { User } from 'lucide-react';
import './MentionInput.css';

export default function MentionInput({ value, onChange, placeholder, disabled, isTextArea, className }) {
  const { data } = useQuery(GET_ALL_USERS);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [cursorPos, setCursorPos] = useState(null);
  
  const inputRef = useRef(null);

  const users = data?.getAllUsers || [];
  
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(suggestionQuery.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(suggestionQuery.toLowerCase()))
  ).slice(0, 5);

  useEffect(() => {
    if (isTextArea && inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      inputRef.current.style.overflowY = 'hidden';
    }
  }, [value, isTextArea]);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(e); // Pass the whole event if they need it, or wait, standard onChange usually expects event. Let's pass event or string. In existing code it's e => setText(e.target.value). So onChange(e) is better.

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
    <div className="mention-input-container">
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
