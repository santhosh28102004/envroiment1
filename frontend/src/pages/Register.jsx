import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <section className="section">
        <div className="section-header">
          <h2>Register</h2>
          <p>Create your account to unlock personalized engagement tracking.</p>
        </div>
        <form className="contact-form" onSubmit={onSubmit}>
          <label>
            Full Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
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
              minLength={6}
              required
            />
          </label>
          {error && <p style={{ color: 'var(--accent)', margin: 0 }}>{error}</p>}
          <button className="btn-primary" type="submit">Register</button>
          <p style={{ margin: 0 }}>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </section>
    </div>
  );
};

export default Register;
