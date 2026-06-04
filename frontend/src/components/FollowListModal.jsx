import React from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_USERS } from '../graphql/queries';
import { Link } from 'react-router-dom';
import { User, X } from 'lucide-react';
import { motion } from 'framer-motion';
import './FollowListModal.css';

export default function FollowListModal({ title, usernames, onClose }) {
  const { data, loading } = useQuery(GET_ALL_USERS);

  // Map usernames to full user objects
  const users = usernames.map(uname => {
    const found = data?.getAllUsers?.find(u => u.username === uname);
    return found || { username: uname, name: uname, avatar: null };
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="follow-list-modal"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="follow-list-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        
        <div className="follow-list-content">
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">No users found.</div>
          ) : (
            users.map(u => (
              <div key={u.username} className="follow-list-item">
                <Link to={`/profile/${u.username}`} onClick={onClose} className="follow-list-user">
                  <div className="follow-list-avatar" style={{ background: u.avatar ? 'transparent' : '#cbd5e1' }}>
                    {u.avatar ? <img src={u.avatar} alt="avatar" /> : <User size={20} color="#ffffff" />}
                  </div>
                  <div className="follow-list-info">
                    <strong>{u.name || u.username}</strong>
                    <span>@{u.username}</span>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
