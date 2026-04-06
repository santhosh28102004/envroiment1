import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({ name: user?.name || '', password: '' });
  }, [user?.name]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await updateProfile(form);
      setForm((prev) => ({ ...prev, password: '' }));
      setMessage('Profile updated');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <section className="section">
        <div className="section-header">
          <h2>Profile Management</h2>
          <p>Update your account details and password.</p>
        </div>
        <form className="contact-form" onSubmit={onSubmit}>
          <label>
            Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input type="email" value={user?.email || ''} disabled />
          </label>
          <label>
            New Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              placeholder="Leave empty to keep current password"
            />
          </label>
          <p style={{ margin: 0 }}>Role: <strong>{user?.role || 'user'}</strong></p>
          {message && <p style={{ color: 'var(--moss)', margin: 0 }}>{message}</p>}
          {error && <p style={{ color: 'var(--accent)', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" type="submit">Save Profile</button>
            <button className="btn-ghost" type="button" onClick={logout}>Logout</button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Profile;
