import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, BookOpen, Image as ImageIcon, Compass, MessageCircle, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const navItems = [
    { name: 'Home', path: '/', icon: <Leaf size={18} /> },
    { name: 'Topics', path: '/topics', icon: <BookOpen size={18} /> },
    { name: 'Articles', path: '/articles', icon: <BookOpen size={18} /> },
    { name: 'Gallery', path: '/gallery', icon: <ImageIcon size={18} /> },
    { name: 'Tips', path: '/tips', icon: <Compass size={18} /> },
    { name: 'Quiz', path: '/quiz', icon: <Activity size={18} /> },
    { name: 'Challenges', path: '/challenges', icon: <Compass size={18} /> },
    { name: 'Dashboard', path: '/dashboard', icon: <Activity size={18} /> },
    { name: 'About', path: '/about', icon: <MessageCircle size={18} /> }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="nav-bar">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          <Leaf size={24} />
          <span>EcoAware</span>
        </Link>

        <div className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={isActive(item.path) ? 'nav-link active' : 'nav-link'}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link to="/profile" className={isActive('/profile') ? 'nav-link active' : 'nav-link'}>
                <span>{user?.name || 'Profile'}</span>
              </Link>
              <button type="button" className="nav-link" onClick={logout}>
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={isActive('/login') ? 'nav-link active' : 'nav-link'}>
                <span>Login</span>
              </Link>
              <Link to="/register" className={isActive('/register') ? 'nav-link active' : 'nav-link'}>
                <span>Signup</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
