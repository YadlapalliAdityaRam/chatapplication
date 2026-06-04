import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_POSTS } from '../graphql/queries';
import { motion } from 'framer-motion';
import { Search, Sun, Moon, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import CreatePostBox from '../components/CreatePostBox';
import { useAuth } from '../context/AuthContext';
import './Feed.css';

export default function Feed() {
  const { username } = useAuth();
  const { data, loading, error } = useQuery(GET_POSTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Posts');
  const searchInputRef = useRef(null);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const filters = ['All Posts', 'Recent', 'Most Liked', 'Most Commented'];

  const filteredPosts = useMemo(() => {
    if (!data?.getPosts) return [];
    
    let posts = [...data.getPosts];

    // Search filter
    if (searchTerm) {
      posts = posts.filter(post => 
        post.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort filter
    if (activeFilter === 'Most Liked') {
      posts.sort((a, b) => b.likes.length - a.likes.length);
    } else if (activeFilter === 'Most Commented') {
      posts.sort((a, b) => b.comments.length - a.comments.length);
    } else if (activeFilter === 'Recent') {
      posts.sort((a, b) => new Date(Number(b.createdAt)) - new Date(Number(a.createdAt)));
    }
    // 'All Posts' just uses the default order from backend (Recent)

    return posts;
  }, [data, searchTerm, activeFilter]);

  return (
    <motion.div 
      className="feed-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="feed-header-row">
        <div className="search-bar">
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search posts or users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="feed-header-actions">
          <button onClick={() => searchInputRef.current?.focus()} className="theme-toggle-btn" title="Search">
            <Search size={20} color="#666" />
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle-btn" title="Toggle Theme">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link to={`/profile/${username}`} className="feed-profile-icon">
            <User size={20} />
          </Link>
        </div>
      </div>

      <CreatePostBox />

      <div className="feed-controls">
        
        <div className="filter-bubbles-container">
          {filters.map(filter => (
            <button 
              key={filter} 
              className={`filter-bubble ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="posts-list">
        {loading && <div className="loading">Loading posts...</div>}
        {error && <div className="error">Error loading posts.</div>}
        {filteredPosts.map((post, i) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <PostCard post={post} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
