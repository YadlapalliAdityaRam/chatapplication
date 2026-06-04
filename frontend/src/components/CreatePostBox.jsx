import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { CREATE_POST } from '../graphql/mutations';
import { GET_POSTS, GET_ME } from '../graphql/queries';
import { ImagePlus, Send, Smile, Keyboard, User } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../context/AuthContext';
import MentionInput from './MentionInput';
import './CreatePostBox.css';

export default function CreatePostBox() {
  const { username } = useAuth();
  const { data: meData } = useQuery(GET_ME);
  const myAvatar = meData?.getMe?.avatar;
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);

  const [createPost, { loading: creating }] = useMutation(CREATE_POST, {
    refetchQueries: [{ query: GET_POSTS }],
    onCompleted: () => {
      setText('');
      setImages([]);
      setShowEmoji(false);
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
    <div className="create-post-box card">
      <form onSubmit={handlePost}>
        <div className="create-post-input-wrapper">
          <div className="create-post-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: myAvatar ? 'transparent' : '#cbd5e1' }}>
            {myAvatar ? (
              <img src={myAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={24} color="#ffffff" />
            )}
          </div>
          <MentionInput 
            isTextArea={true}
            placeholder="What's on your mind?" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
          />
        </div>
        
        {showEmoji && (
          <div className="emoji-picker-container">
            <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={300} />
          </div>
        )}

        {images.length > 0 && (
          <div className="preview-images-container" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 0' }}>
            {images.map((img, idx) => (
              <div key={idx} className="preview-image-wrapper" style={{ position: 'relative', flexShrink: 0 }}>
                <img src={img} alt={`Preview ${idx}`} style={{ height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                <button type="button" onClick={() => removeImage(idx)} className="remove-image" style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}>×</button>
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
    </div>
  );
}
