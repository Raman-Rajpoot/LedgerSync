import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/auth.service';
import './login.css';

const Register = () => {
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await authService.register(organizationName, email, password, fullName);
      navigate('/clients');
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-center">
      <form className="auth-card" onSubmit={submit}>
        <h2>Create account</h2>
        {error && <div className="auth-error">{error}</div>}
        <input placeholder="Organization name" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
        <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" onClick={submit}>Register</button>
        <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
      </form>
    </div>
  );
};

export default Register;
