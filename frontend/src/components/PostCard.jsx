import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { TOGGLE_LIKE, ADD_COMMENT, DELETE_POST, DELETE_COMMENT } from '../graphql/mutations';
import { GET_POSTS, GET_USER_PROFILE } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageSquare, Share2, Trash2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo } from '../utils/formatTime';
import { Link } from 'react-router-dom';
import MentionInput from './MentionInput';
import ConfirmModal from './ConfirmModal';

const renderTextWithMentions = (text) => {
  if (!text) return null;
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      const uname = part.substring(1);
      return (
        <Link key={index} to={`/profile/${uname}`} className="mention-link" onClick={(e) => e.stopPropagation()}>
          {part}
        </Link>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export default function PostCard({ post }) {
  const { username } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  const [toggleLike] = useMutation(TOGGLE_LIKE);
  const [addComment] = useMutation(ADD_COMMENT);
  const [deletePost] = useMutation(DELETE_POST, {
    refetchQueries: [{ query: GET_POSTS }, { query: GET_USER_PROFILE, variables: { username } }]
  });
  const [deleteComment] = useMutation(DELETE_COMMENT);

  const hasLiked = post.likes.includes(username);

  const handleLike = () => {
    toggleLike({ variables: { postId: post.id } });
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment({ variables: { postId: post.id, text: commentText } });
    setCommentText('');
  };

  const handleDeletePost = () => {
    deletePost({ variables: { postId: post.id } });
  };

  const handleDeleteComment = () => {
    if (commentToDelete) {
      deleteComment({ variables: { postId: post.id, commentId: commentToDelete } });
      setCommentToDelete(null);
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.author}`} className="post-avatar-link">
          <div className="post-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: post.authorDetails?.avatar ? 'transparent' : '#cbd5e1' }}>
            {post.authorDetails?.avatar ? (
              <img src={post.authorDetails.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={24} color="#ffffff" />
            )}
          </div>
        </Link>
        <div className="post-author-info">
          <Link to={`/profile/${post.author}`} className="post-author-link">
            <span className="post-author">{post.authorDetails?.name || post.author}</span>
          </Link>
          <span className="post-time">{timeAgo(post.createdAt)}</span>
        </div>
        {post.author === username && (
          <button onClick={() => setShowDeletePostConfirm(true)} className="delete-post-btn" title="Delete Post">
            <Trash2 size={16} />
          </button>
        )}
      </div>
      
      <div className="post-content">
        {post.text && <p>{renderTextWithMentions(post.text)}</p>}
        {post.image && <img src={post.image} alt="Post content" className="post-image" />}
      </div>

      <div className="post-stats">
        <span>{post.likes.length} Likes</span>
        <span>{post.comments.length} Comments</span>
      </div>

      <div className="post-actions">
        <button onClick={handleLike} className={`action-btn ${hasLiked ? 'liked' : ''}`}>
          <Heart size={20} fill={hasLiked ? "#e0245e" : "none"} color={hasLiked ? "#e0245e" : "currentColor"} />
          Like
        </button>
        <button onClick={() => setShowComments(!showComments)} className="action-btn">
          <MessageSquare size={20} />
          Comment {post.comments.length > 0 ? `(${post.comments.length})` : ''}
        </button>
        <button className="action-btn">
          <Share2 size={20} />
          Share
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div 
            className="comments-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <MentionInput 
                placeholder="Write a comment..." 
                value={commentText} 
                onChange={(e) => setCommentText(e.target.value)} 
              />
              <button type="submit" disabled={!commentText.trim()}>Post</button>
            </form>
            <div className="comments-list">
              {post.comments.map(c => (
                <div key={c.id} className="comment">
                  <Link to={`/profile/${c.username}`} className="comment-avatar-link" style={{ textDecoration: 'none', marginRight: '10px' }}>
                    {c.userDetails?.avatar ? (
                      <img src={c.userDetails.avatar} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} color="#ffffff" />
                      </div>
                    )}
                  </Link>
                  <div className="comment-content">
                    <strong>{c.userDetails?.name || c.username}</strong>
                    <p>{renderTextWithMentions(c.text)}</p>
                  </div>
                  {c.username === username && (
                    <button onClick={() => setCommentToDelete(c.id)} className="delete-comment-btn" title="Delete Comment">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDeletePostConfirm && (
        <ConfirmModal 
          title="Delete Post"
          message="Are you sure you want to permanently delete this post?"
          confirmText="Delete"
          onConfirm={() => {
            setShowDeletePostConfirm(false);
            handleDeletePost();
          }}
          onCancel={() => setShowDeletePostConfirm(false)}
        />
      )}

      {commentToDelete && (
        <ConfirmModal 
          title="Delete Comment"
          message="Are you sure you want to permanently delete this comment?"
          confirmText="Delete"
          onConfirm={handleDeleteComment}
          onCancel={() => setCommentToDelete(null)}
        />
      )}
    </div>
  );
}
