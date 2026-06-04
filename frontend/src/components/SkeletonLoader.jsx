import React from 'react';
import './SkeletonLoader.css';

export function PostSkeleton() {
  return (
    <div className="skeleton-post-card">
      <div className="skeleton-header">
        <div className="skeleton skeleton-avatar"></div>
        <div>
          <div className="skeleton skeleton-text-short"></div>
          <div className="skeleton skeleton-text-medium"></div>
        </div>
      </div>
      <div className="skeleton-content">
        <div className="skeleton skeleton-text-full"></div>
        <div className="skeleton skeleton-text-full" style={{ width: '80%', marginBottom: '20px' }}></div>
        <div className="skeleton skeleton-image"></div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="skeleton-profile-header">
      <div className="skeleton skeleton-profile-avatar"></div>
      <div className="skeleton skeleton-profile-name"></div>
      <div className="skeleton skeleton-profile-bio"></div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <div className="skeleton" style={{ width: '80px', height: '40px', borderRadius: '8px' }}></div>
        <div className="skeleton" style={{ width: '80px', height: '40px', borderRadius: '8px' }}></div>
        <div className="skeleton" style={{ width: '80px', height: '40px', borderRadius: '8px' }}></div>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <>
      <div className="skeleton-chat-message theirs">
        <div className="skeleton skeleton-chat-bubble"></div>
      </div>
      <div className="skeleton-chat-message mine">
        <div className="skeleton skeleton-chat-bubble" style={{ width: '150px' }}></div>
      </div>
      <div className="skeleton-chat-message theirs">
        <div className="skeleton skeleton-chat-bubble" style={{ width: '250px' }}></div>
      </div>
    </>
  );
}
