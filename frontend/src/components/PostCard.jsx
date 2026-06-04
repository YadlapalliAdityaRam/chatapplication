import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { TOGGLE_LIKE, ADD_COMMENT, DELETE_POST, DELETE_COMMENT, TOGGLE_FOLLOW } from '../graphql/mutations';
import { GET_POSTS, GET_USER_PROFILE, GET_ME } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageSquare, Share2, Trash2, User, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo } from '../utils/formatTime';
import { Link, useNavigate } from 'react-router-dom';
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
  const { username, token } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const allImages = post.images && post.images.length > 0 ? post.images : (post.image ? [post.image] : []);

  const [toggleLike] = useMutation(TOGGLE_LIKE);
  const [addComment] = useMutation(ADD_COMMENT);
  const [deletePost] = useMutation(DELETE_POST, {
    refetchQueries: [{ query: GET_POSTS }, { query: GET_USER_PROFILE, variables: { username } }]
  });
  const [deleteComment] = useMutation(DELETE_COMMENT);
  const { data: meData } = useQuery(GET_ME, { skip: !username });
  const [localFollowState, setLocalFollowState] = useState(null); // null | 'following' | 'requested' | 'none'

  const serverIsFollowing = post.authorDetails?.followers
    ? post.authorDetails.followers.includes(username)
    : meData?.getMe?.following?.includes(post.author);
  const serverIsRequested = post.authorDetails?.followRequests?.includes(username);

  // Optimistic: use local state immediately, fall back to server state
  const isFollowing = localFollowState === null ? serverIsFollowing : localFollowState === 'following';
  const isRequested = localFollowState === null ? serverIsRequested : localFollowState === 'requested';

  const [toggleFollow] = useMutation(TOGGLE_FOLLOW, {
    refetchQueries: [{ query: GET_ME }],
    onCompleted: () => setLocalFollowState(null)
  });

  const handleFollowClick = () => {
    if (!token) { navigate('/login'); return; }
    // Optimistic update — instant UI response
    if (isFollowing) {
      setLocalFollowState('none');
    } else if (isRequested) {
      setLocalFollowState('none');
    } else {
      setLocalFollowState('requested');
    }
    toggleFollow({ variables: { username: post.author } });
  };

  const hasLiked = post.likes.includes(username);

  const handleLike = () => {
    if (!token) { navigate('/login'); return; }
    toggleLike({ variables: { postId: post.id } });
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!token) { navigate('/login'); return; }
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

  const handleShare = () => {
    // Creating a pseudo post link or copying the profile link
    const linkToCopy = `${window.location.origin}/profile/${post.author}`;
    navigator.clipboard.writeText(linkToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
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
        {post.author === username ? (
          <button onClick={() => setShowDeletePostConfirm(true)} className="delete-post-btn" title="Delete Post">
            <Trash2 size={16} />
          </button>
        ) : username && (
          <button 
            className={`follow-post-btn ${isFollowing || isRequested ? 'following' : ''}`} 
            onClick={handleFollowClick}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: (isFollowing || isRequested) ? '1px solid var(--border-color)' : 'none',
              background: (isFollowing || isRequested) ? 'transparent' : 'var(--primary-color, #1da1f2)',
              color: (isFollowing || isRequested) ? 'var(--text-main)' : 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            {isFollowing ? 'Following' : (isRequested ? 'Cancel Request' : 'Follow')}
          </button>
        )}
      </div>
      
      <div className="post-content">
        {allImages.length > 0 && (
          <div className="post-carousel-container" style={{ position: 'relative' }}>
            {allImages.length > 1 && (
              <>
                <button 
                  className="carousel-btn prev-btn" 
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1); }}
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: 'white', padding: '5px', cursor: 'pointer', zIndex: 2 }}
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  className="carousel-btn next-btn" 
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1); }}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: 'white', padding: '5px', cursor: 'pointer', zIndex: 2 }}
                >
                  <ChevronRight size={24} />
                </button>
                <div className="carousel-dots" style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px', zIndex: 2 }}>
                  {allImages.map((_, i) => (
                    <span key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === currentImageIndex ? '#1da1f2' : 'rgba(255,255,255,0.5)' }} />
                  ))}
                </div>
              </>
            )}
            
            <img 
              src={allImages[currentImageIndex]} 
              alt="Post content" 
              className="post-image" 
              onClick={() => setShowImageModal(true)}
            />
          </div>
        )}
        {post.text && <p className="post-description">{renderTextWithMentions(post.text)}</p>}
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
        <button onClick={handleShare} className="action-btn">
          <Share2 size={20} />
          {isCopied ? 'Copied!' : 'Share'}
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
            {token ? (
              <form onSubmit={handleCommentSubmit} className="comment-form">
                <MentionInput 
                  placeholder="Write a comment..." 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                />
                <button type="submit" disabled={!commentText.trim()}>Post</button>
              </form>
            ) : (
              <div className="guest-comment-prompt">
                <Link to="/login">Log in</Link> or <Link to="/signup">sign up</Link> to comment
              </div>
            )}
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

      <AnimatePresence>
        {showImageModal && (
          <motion.div 
            className="image-modal-overlay" 
            onClick={() => setShowImageModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="image-modal-close" onClick={() => setShowImageModal(false)}>
                <X size={20} color="#fff" />
              </button>
              <img src={allImages[currentImageIndex]} alt="Full post" className="image-modal-img" />
              
              {allImages.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1); }}
                    style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: 'white', padding: '10px', cursor: 'pointer', zIndex: 12, transition: 'background 0.2s' }}
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1); }}
                    style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: 'white', padding: '10px', cursor: 'pointer', zIndex: 12, transition: 'background 0.2s' }}
                  >
                    <ChevronRight size={32} />
                  </button>
                </>
              )}

              {post.text && (
                <div className="image-modal-text">
                  {renderTextWithMentions(post.text)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
