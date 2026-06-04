import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { REGISTER } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [registerMutation, { loading }] = useMutation(REGISTER, {
    onCompleted: (data) => {
      login(data.register.token, data.register.username);
      navigate('/');
    },
    onError: (error) => {
      setErrorMsg(error.message);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address (e.g. user@example.com)");
      return;
    }

    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username.toLowerCase())) {
      setErrorMsg("Username can only contain small letters, numbers, and underscores (no spaces or @)");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    registerMutation({ variables: { username: username.toLowerCase(), name, email, password } });
  };

  return (
    <motion.div 
      className="auth-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2>Create Account</h2>
      <p>Join the community today</p>
      {errorMsg && <div className="error-msg">{errorMsg}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <input 
          type="text" 
          placeholder="Full Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <input 
          type="text" 
          placeholder="Username (small letters only)" 
          value={username} 
          onChange={(e) => setUsername(e.target.value.toLowerCase())} 
          required 
        />
        <input 
          type="email" 
          placeholder="Email address" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Confirm Password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          required 
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Sign Up'}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </motion.div>
  );
}
