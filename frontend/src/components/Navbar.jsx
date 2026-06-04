import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_ME } from '../graphql/queries';
import { MARK_NOTIFICATIONS_READ, CLEAR_NOTIFICATIONS, ACCEPT_FOLLOW_REQUEST, DECLINE_FOLLOW_REQUEST } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';
import { timeAgo } from '../utils/formatTime';
import ChatModal from './ChatModal';
import ConfirmModal from './ConfirmModal';

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data, refetch } = useQuery(GET_ME, {
    skip: !token,
    pollInterval: 10000
  });

  const [markRead] = useMutation(MARK_NOTIFICATIONS_READ, {
    onCompleted: () => refetch()
  });

  const [clearNotifications] = useMutation(CLEAR_NOTIFICATIONS, {
    onCompleted: () => refetch()
  });

  const [acceptRequest] = useMutation(ACCEPT_FOLLOW_REQUEST, {
    onCompleted: () => refetch()
  });

  const [declineRequest] = useMutation(DECLINE_FOLLOW_REQUEST, {
    onCompleted: () => refetch()
  });

  const notifications = data?.getMe?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      markRead();
    }
  };

  const handleNotificationClick = (n) => {
    if (n.type === 'FOLLOW_REQUEST') {
      return; // Handled by buttons
    }
    setShowNotifications(false);
    if (n.type === 'CHAT') {
      setChatUser(n.fromUser);
    } else {
      navigate(`/profile/${n.fromUser}`);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container header-redesign">
        <Link to="/" className="nav-logo" style={{ display: 'block' }}>
          Social
        </Link>

        <div className="header-actions">

          {token ? (
            <>
              <div className="notification-container" ref={notificationRef}>
                <button onClick={handleBellClick} className="bell-btn">
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0 }}>Notifications</h4>
                      {notifications.length > 0 && (
                        <button 
                          onClick={() => clearNotifications()} 
                          style={{ background: 'none', border: 'none', color: 'var(--primary-color, #1da1f2)', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="no-notifications">No notifications yet</p>
                    ) : (
                      <div className="notification-list">
                        {notifications.slice().reverse().map(n => (
                          <div 
                            key={n.id} 
                            className={`notification-item ${!n.read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(n)}
                            style={{ cursor: n.type === 'FOLLOW_REQUEST' ? 'default' : 'pointer' }}
                          >
                            <div>
                              <strong>{n.fromUser}</strong> {n.text}
                              <span className="notification-time">{timeAgo(n.createdAt)}</span>
                            </div>
                            
                            {n.type === 'FOLLOW_REQUEST' && (
                              <div className="follow-request-actions" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); acceptRequest({ variables: { username: n.fromUser } }); }}
                                  style={{ background: '#1da1f2', color: 'white', border: 'none', borderRadius: '15px', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer' }}
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); declineRequest({ variables: { username: n.fromUser } }); }}
                                  style={{ background: '#e1e8ed', color: '#14171a', border: 'none', borderRadius: '15px', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer' }}
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log In</Link>
              <Link to="/signup" className="nav-btn">Sign Up</Link>
            </>
          )}
        </div>
      </div>
      {chatUser && <ChatModal withUser={chatUser} onClose={() => setChatUser(null)} />}
    </nav>
  );
}
