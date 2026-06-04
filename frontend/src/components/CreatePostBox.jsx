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
  const [image, setImage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const [createPost, { loading: creating }] = useMutation(CREATE_POST, {
    refetchQueries: [{ query: GET_POSTS }],
    onCompleted: () => {
      setText('');
      setImage('');
      setShowEmoji(false);
    }
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
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
    </div>
  );
}
