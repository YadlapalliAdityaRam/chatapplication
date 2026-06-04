import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_USER_PROFILE, GET_POSTS } from '../graphql/queries';
import { TOGGLE_FOLLOW, UPDATE_PROFILE } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { ImagePlus, User, LogOut } from 'lucide-react';
import ChatModal from '../components/ChatModal';
import ConfirmModal from '../components/ConfirmModal';
import { ProfileSkeleton, PostSkeleton } from '../components/SkeletonLoader';
import './Profile.css';

export default function Profile() {
  const { username } = useParams();
  const { username: currentUser, login, logout } = useAuth();
  const navigate = useNavigate();
  const isOwnProfile = username === currentUser;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_USER_PROFILE, {
    variables: { username },
    fetchPolicy: 'network-only' // Always fetch latest data for profile
  });

  const { data: allPostsData } = useQuery(GET_POSTS, {
    skip: !isOwnProfile // Only fetch all posts if it's our own profile to populate tabs
  });

  const [toggleFollow] = useMutation(TOGGLE_FOLLOW, {
    onCompleted: () => refetch()
  });

  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    onCompleted: (data) => {
      setIsEditing(false);
      
      const newUsername = data.updateProfile.username;
      const newToken = data.updateProfile.token;
      
      if (newToken) {
        login(newToken, newUsername);
        navigate(`/profile/${newUsername}`, { replace: true });
      } else {
        refetch();
      }
    },
    onError: (err) => {
      alert(err.message);
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [activeTab, setActiveTab] = useState('Posts');

  if (loading) return (
    <div className="profile-page">
      <ProfileSkeleton />
      <PostSkeleton />
      <PostSkeleton />
    </div>
  );
  if (error) return <div className="error-state">User not found</div>;

  const { user, posts } = data.getUserProfile;
  const isFollowing = user.followers.includes(currentUser);

  const handleFollowToggle = () => {
    toggleFollow({ variables: { username } });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    updateProfile({ variables: { name: editName, bio: editBio, avatar: editAvatar } });
  };

  const openEdit = () => {
    setEditName(user.name || '');
    setEditUsername(user.username || '');
    setEditBio(user.bio || '');
    setEditAvatar(user.avatar || '');
    setIsEditing(true);
  };

  let displayPosts = posts;
  if (isOwnProfile && allPostsData?.getPosts) {
    if (activeTab === 'Liked') {
      displayPosts = allPostsData.getPosts.filter(p => p.likes.includes(currentUser));
    } else if (activeTab === 'Commented') {
      displayPosts = allPostsData.getPosts.filter(p => p.comments.some(c => c.username === currentUser));
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-header-card">
        <div className="profile-top">
          <div className="profile-avatar-large" style={user.avatar ? { backgroundImage: `url(${user.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#cbd5e1' }}>
            {!user.avatar && <User size={48} color="#ffffff" />}
          </div>
          
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-value">{posts.length}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat">
              <span className="stat-value">{user.followers.length}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat">
              <span className="stat-value">{user.following.length}</span>
              <span className="stat-label">Following</span>
            </div>
          </div>
        </div>

        <div className="profile-info">
          <h2 className="profile-name">{user.name || user.username}</h2>
          <span className="profile-username">@{user.username}</span>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
        </div>

        <div className="profile-actions">
          {isOwnProfile ? (
            <div className="action-buttons-row">
              <button onClick={openEdit} className="btn-secondary full-width">Edit Profile</button>
              <button onClick={() => setShowLogoutConfirm(true)} className="btn-secondary" style={{ color: '#e0245e', padding: '8px', flexShrink: 0 }} title="Logout">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="action-buttons-row">
              <button onClick={handleFollowToggle} className={`btn-primary full-width ${isFollowing ? 'following-btn' : ''}`}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button onClick={() => setShowChat(true)} className="btn-secondary full-width">Message</button>
            </div>
          )}
        </div>
      </div>

      {showChat && (
        <ChatModal withUser={username} onClose={() => setShowChat(false)} />
      )}

      {showLogoutConfirm && (
        <ConfirmModal 
          title="Log Out"
          message="Are you sure you want to log out of your account?"
          confirmText="Log Out"
          onConfirm={() => {
            setShowLogoutConfirm(false);
            logout();
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {isEditing && (
        <div className="edit-profile-modal">
          <div className="modal-content">
            <h3>Edit Profile</h3>
            <form onSubmit={handleEditSave}>
              <div className="form-group avatar-edit-group">
                <div className="profile-avatar-large" style={editAvatar ? { backgroundImage: `url(${editAvatar})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}}>
                  {!editAvatar && username.charAt(0).toUpperCase()}
                </div>
                <label className="image-upload-btn">
                  <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                  <ImagePlus size={16} /> Change Photo
                </label>
              </div>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={editUsername} disabled style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)', cursor: 'not-allowed' }} title="Usernames cannot be changed" />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>Usernames cannot be changed.</small>
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea rows="3" value={editBio} onChange={(e) => setEditBio(e.target.value)}></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isOwnProfile && (
        <div className="profile-tabs">
          <div className={`tab ${activeTab === 'Posts' ? 'active' : ''}`} onClick={() => setActiveTab('Posts')}>Posts ({posts.length})</div>
          <div className={`tab ${activeTab === 'Liked' ? 'active' : ''}`} onClick={() => setActiveTab('Liked')}>Liked</div>
          <div className={`tab ${activeTab === 'Commented' ? 'active' : ''}`} onClick={() => setActiveTab('Commented')}>Commented</div>
        </div>
      )}

      <div className="profile-posts">
        {displayPosts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        {displayPosts.length === 0 && (
          <div className="no-posts">
            <p>No posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
