import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_ME } from '../graphql/queries';
import { MARK_NOTIFICATIONS_READ } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Bell, Sun, Moon } from 'lucide-react';
import { timeAgo } from '../utils/formatTime';
import ChatModal from './ChatModal';
import ConfirmModal from './ConfirmModal';

export default function Navbar() {
  const { token, username, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  const notifications = data?.getMe?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      markRead();
    }
  };

  const handleNotificationClick = (n) => {
    setShowNotifications(false);
    if (n.type === 'CHAT') {
      setChatUser(n.fromUser);
    } else {
      navigate(`/profile/${n.fromUser}`);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Social
        </Link>
        <div className="nav-links">

          {token ? (
            <>
              <div className="notification-container" ref={notificationRef}>
                <button onClick={handleBellClick} className="bell-btn">
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <h4>Notifications</h4>
                    {notifications.length === 0 ? (
                      <p className="no-notifications">No notifications yet</p>
                    ) : (
                      <div className="notification-list">
                        {notifications.slice().reverse().map(n => (
                          <div 
                            key={n.id} 
                            className={`notification-item ${!n.read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(n)}
                            style={{ cursor: 'pointer' }}
                          >
                            <strong>{n.fromUser}</strong> {n.text}
                            <span className="notification-time">{timeAgo(n.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Link to={`/profile/${username}`} className="nav-user">
                <User size={18}/> {username}
              </Link>
              <button onClick={() => setShowLogoutConfirm(true)} className="logout-btn"><LogOut size={18}/> Logout</button>
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
    </nav>
  );
}
