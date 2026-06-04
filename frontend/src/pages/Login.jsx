import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { LOGIN } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginMutation, { loading }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      login(data.login.token, data.login.username);
      navigate('/');
    },
    onError: (error) => {
      setErrorMsg(error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation({ variables: { identifier: identifier.toLowerCase(), password } });
  };

  return (
    <motion.div 
      className="auth-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2>Welcome Back</h2>
      <p>Log in to your account</p>
      {errorMsg && <div className="error-msg">{errorMsg}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <input 
          type="text" 
          placeholder="Email or Username" 
          value={identifier} 
          onChange={(e) => setIdentifier(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <p className="auth-switch">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </motion.div>
  );
}
