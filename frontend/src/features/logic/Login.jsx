import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/auth.service';
import './login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await authService.login(email, password);
      navigate('/clients');
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-center">
      <form className="auth-card" onSubmit={submit}>
        <h2>Sign in</h2>
        {error && <div className="auth-error">{error}</div>}
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Sign in</button>
        <div className="auth-footer">Don't have an account? <Link to="/register">Register</Link></div>
      </form>
    </div>
  );
};

export default Login;
