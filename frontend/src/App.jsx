import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EngagementProvider } from './context/EngagementContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import TopicsOverview from './pages/TopicsOverview';
import TopicDetail from './pages/TopicDetail';
import Challenges from './pages/Challenges';
import Quiz from './pages/Quiz';
import Dashboard from './pages/Dashboard';
import Gallery from './pages/Gallery';
import AwarenessTips from './pages/AwarenessTips';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import AboutContact from './pages/AboutContact';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';

function App() {
  return (
    <AuthProvider>
      <EngagementProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/topics" element={<TopicsOverview />} />
              <Route path="/topics/:id" element={<TopicDetail />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:id" element={<ArticleDetail />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/tips" element={<AwarenessTips />} />
              <Route path="/about" element={<AboutContact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/quiz/:topicId" element={<Quiz />} />
              <Route
                path="/challenges"
                element={(
                  <ProtectedRoute>
                    <Challenges />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/dashboard"
                element={(
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/profile"
                element={(
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/users"
                element={(
                  <ProtectedRoute adminOnly>
                    <AdminUsers />
                  </ProtectedRoute>
                )}
              />
            </Routes>
          </div>
        </Router>
      </EngagementProvider>
    </AuthProvider>
  );
}

export default App;
