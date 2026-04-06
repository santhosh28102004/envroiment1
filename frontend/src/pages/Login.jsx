import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <section className="section">
        <div className="section-header">
          <h2>Login</h2>
          <p>Enter your email and password to open your personal eco dashboard.</p>
        </div>
        <form className="contact-form" onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          {error && <p style={{ color: 'var(--accent)', margin: 0 }}>{error}</p>}
          <button className="btn-primary" type="submit">Login</button>
        </form>
      </section>
    </div>
  );
};

export default Login;
