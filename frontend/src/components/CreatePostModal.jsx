import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { CREATE_POST } from '../graphql/mutations';
import { GET_POSTS } from '../graphql/queries';
import { motion } from 'framer-motion';
import { ImagePlus, Send, X, Smile, Keyboard } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import MentionInput from './MentionInput';
import './CreatePostModal.css';

export default function CreatePostModal({ onClose }) {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);

  const [createPost, { loading: creating }] = useMutation(CREATE_POST, {
    refetchQueries: [{ query: GET_POSTS }],
    onCompleted: () => {
      onClose();
    }
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onEmojiClick = (emojiObject) => {
    setText(prev => prev + emojiObject.emoji);
  };

  const handlePost = (e) => {
    e.preventDefault();
    if (!text && images.length === 0) return;
    createPost({ variables: { text, images } });
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
          <MentionInput 
            isTextArea={true}
            placeholder="What's on your mind?" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
          />
          {showEmoji && (
            <div className="emoji-picker-container">
              <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={300} />
            </div>
          )}

          {images.length > 0 && (
            <div className="preview-images-grid">
              {images.map((img, idx) => (
                <div key={idx} className="preview-image-item">
                  <img src={img} alt={`Preview ${idx}`} />
                  <button type="button" onClick={() => removeImage(idx)} className="remove-image-btn">×</button>
                </div>
              ))}
            </div>
          )}
          
          <div className="create-post-actions">
            <div className="left-actions">
              <label className="image-upload-btn">
                <input type="file" accept="image/*" multiple onChange={handleImageChange} hidden />
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
            <button type="submit" className="post-submit-btn" disabled={creating || (!text && images.length === 0)}>
              <Send size={16} /> Post
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
