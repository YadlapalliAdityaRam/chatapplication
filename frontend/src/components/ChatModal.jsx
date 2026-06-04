import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_CONVERSATION } from '../graphql/queries';
import { SEND_MESSAGE, BLOCK_USER } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { X, Send, ImagePlus, ShieldAlert } from 'lucide-react';
import { timeAgo } from '../utils/formatTime';
import MentionInput from './MentionInput';
import ConfirmModal from './ConfirmModal';
import { ChatSkeleton } from './SkeletonLoader';
import './ChatModal.css';

export default function ChatModal({ withUser, onClose }) {
  const { username: currentUser } = useAuth();
  const [text, setText] = useState('');
  const [media, setMedia] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const messagesEndRef = useRef(null);

  const { data, loading, refetch } = useQuery(GET_CONVERSATION, {
    variables: { withUser },
    pollInterval: 2000, // Short-polling for "live" chat
    fetchPolicy: 'network-only'
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    onCompleted: () => {
      setText('');
      setMedia('');
      refetch();
    }
  });

  const [blockUser] = useMutation(BLOCK_USER, {
    onCompleted: () => refetch()
  });

  const conversation = data?.getConversation;
  const messages = conversation?.messages || [];
  const isBlocked = conversation?.blocked;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMedia(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text && !media) return;
    sendMessage({ variables: { toUsername: withUser, text, media } });
  };

  const handleBlockUser = () => {
    blockUser({ variables: { username: withUser, block: !isBlocked } });
  };

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal">
        <div className="chat-header">
          <div className="chat-header-info">
            <h3>Chat with @{withUser}</h3>
          </div>
          <div className="chat-header-actions">
            <button onClick={() => setShowBlockConfirm(true)} className="chat-block-btn" title={isBlocked ? "Unblock User" : "Block User"}>
            <ShieldAlert size={20} color={isBlocked ? "#e0245e" : "currentColor"} />
          </button>
            <button onClick={onClose} className="close-btn"><X size={24} /></button>
          </div>
        </div>

        <div className="chat-messages">
          {loading ? (
            <ChatSkeleton />
          ) : messages.length === 0 ? (
            <div className="no-messages">Say hi to {withUser}!</div>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender === currentUser;
              return (
                <div key={msg.id} className={`chat-message ${isMine ? 'mine' : 'theirs'}`}>
                  {msg.media && <img src={msg.media} alt="Shared media" className="chat-media" />}
                  {msg.text && <p className="chat-text">{msg.text}</p>}
                  <span className="chat-time">{timeAgo(msg.createdAt)}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {isBlocked ? (
          <div className="blocked-notice">
            You have blocked this user. Unblock to send messages.
          </div>
        ) : (
          <form className="chat-input-area" onSubmit={handleSend}>
            {media && (
              <div className="chat-media-preview">
                <img src={media} alt="Preview" />
                <button type="button" onClick={() => setMedia('')}>×</button>
              </div>
            )}
            <div className="chat-input-row">
              <label className="chat-media-btn">
                <input type="file" accept="image/*" onChange={handleMediaChange} hidden />
                <ImagePlus size={20} />
              </label>
              <MentionInput 
                placeholder="Type a message..." 
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={sending}
                isTextArea={true}
              />
              <button type="submit" className="chat-send-btn" disabled={sending || (!text && !media)}>
                <Send size={20} />
              </button>
            </div>
          </form>
        )}
      </div>

      {showBlockConfirm && (
        <ConfirmModal 
          title={isBlocked ? "Unblock User" : "Block User"}
          message={`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} ${withUser}?`}
          confirmText={isBlocked ? "Unblock" : "Block"}
          onConfirm={() => {
            setShowBlockConfirm(false);
            handleBlockUser();
          }}
          onCancel={() => setShowBlockConfirm(false)}
        />
      )}
    </div>
  );
}
