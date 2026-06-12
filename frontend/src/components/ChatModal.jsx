import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
import { io } from 'socket.io-client';
import { GET_CONVERSATION } from '../graphql/queries';
import { SEND_MESSAGE, BLOCK_USER } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { X, Send, ImagePlus, ShieldAlert } from 'lucide-react';
import { timeAgo } from '../utils/formatTime';
import MentionInput from './MentionInput';
import ConfirmModal from './ConfirmModal';
import { ChatSkeleton } from './SkeletonLoader';
import { renderFormattedText } from '../utils/renderText';
import './ChatModal.css';

export default function ChatModal({ withUser, onClose }) {
  const { username: currentUser } = useAuth();
  const [text, setText] = useState('');
  const [media, setMedia] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const messagesEndRef = useRef(null);

  const client = useApolloClient();

  const { data, loading, refetch } = useQuery(GET_CONVERSATION, {
    variables: { withUser },
    fetchPolicy: 'cache-and-network', // Serve cache instantly, refresh silently in background
    notifyOnNetworkStatusChange: false // Prevent re-renders on background network checks
  });

  // True initial load = no cached data yet AND network is fetching
  const isInitialLoad = loading && !data;

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

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_GRAPHQL_URI ? import.meta.env.VITE_GRAPHQL_URI.replace('/graphql', '') : 'http://localhost:5000';
    const socket = io(SOCKET_URL);
    
    socket.emit('join', currentUser);

    socket.on('newMessage', (payload) => {
      if (payload.withUser === withUser) {
        const existingData = client.readQuery({
          query: GET_CONVERSATION,
          variables: { withUser }
        });
        
        if (existingData && existingData.getConversation) {
          const existingMessages = existingData.getConversation.messages;
          if (!existingMessages.find(m => m.id === payload.message.id)) {
            client.writeQuery({
              query: GET_CONVERSATION,
              variables: { withUser },
              data: {
                getConversation: {
                  ...existingData.getConversation,
                  messages: [...existingMessages, payload.message]
                }
              }
            });
            setTimeout(scrollToBottom, 50);
          }
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, withUser, client]);

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
          {isInitialLoad ? (
            <ChatSkeleton />
          ) : messages.length === 0 ? (
            <div className="no-messages">Say hi to {withUser}!</div>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender === currentUser;
              return (
                <div key={msg.id} className={`chat-message ${isMine ? 'mine' : 'theirs'}`}>
                  {msg.media && <img src={msg.media} alt="Shared media" className="chat-media" />}
                  {msg.text && <p className="chat-text">{renderFormattedText(msg.text)}</p>}
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
