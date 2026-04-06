import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const AdminUsers = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const loadUsers = async () => {
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to load users');
        setUsers(data.users);
      } catch (err) {
        setError(err.message);
      }
    };

    loadUsers();
  }, [token]);

  const changeRole = async (userId, role) => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Role update failed');
      setUsers((prev) => prev.map((user) => (user.id === userId ? data.user : user)));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <section className="section">
        <div className="section-header">
          <h2>Admin Users</h2>
          <p>Manage user roles (admin or user).</p>
        </div>
        {error && <p style={{ color: 'var(--accent)' }}>{error}</p>}
        <div className="info-card">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {users.map((user) => (
              <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <strong>{user.name}</strong>
                  <p style={{ margin: '0.25rem 0 0' }}>{user.email}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-ghost"
                    type="button"
                    onClick={() => changeRole(user.id, 'user')}
                    disabled={user.role === 'user'}
                  >
                    Set User
                  </button>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => changeRole(user.id, 'admin')}
                    disabled={user.role === 'admin'}
                  >
                    Set Admin
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminUsers;
