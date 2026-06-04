import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { CREATE_POST } from '../graphql/mutations';
import { GET_POSTS } from '../graphql/queries';
import { motion } from 'framer-motion';
import { ImagePlus, Send, X, Smile, Keyboard } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import './CreatePostModal.css';

export default function CreatePostModal({ onClose }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const [createPost, { loading: creating }] = useMutation(CREATE_POST, {
    refetchQueries: [{ query: GET_POSTS }],
    onCompleted: () => {
      onClose();
    }
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setText(prev => prev + emojiObject.emoji);
  };

  const handlePost = (e) => {
    e.preventDefault();
    if (!text && !image) return;
    createPost({ variables: { text, image } });
  };

  return (
    <div className="modal-overlay">
      <motion.div 
        className="create-post-modal"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="modal-header">
          <h3>Create Post</h3>
          <button onClick={onClose} className="close-btn"><X size={24} /></button>
        </div>
        <form onSubmit={handlePost}>
          <textarea 
            placeholder="What's on your mind?" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
          />
          {showEmoji && (
            <div className="emoji-picker-container">
              <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={300} />
            </div>
          )}

          {image && (
            <div className="preview-image-container">
              <img src={image} alt="Preview" className="preview-image" />
              <button type="button" onClick={() => setImage('')} className="remove-image">×</button>
            </div>
          )}
          
          <div className="create-post-actions">
            <div className="left-actions">
              <label className="image-upload-btn">
                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                <ImagePlus size={20} /> Photo
              </label>
              <button 
                type="button" 
                className="emoji-toggle-btn"
                onClick={() => setShowEmoji(!showEmoji)}
              >
                {showEmoji ? <><Keyboard size={20} /> Text Mode</> : <><Smile size={20} /> Emoji Mode</>}
              </button>
            </div>
            <button type="submit" className="post-submit-btn" disabled={creating || (!text && !image)}>
              <Send size={16} /> Post
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
