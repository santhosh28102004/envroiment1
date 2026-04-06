import React from 'react';
import { useEngagement } from '../context/EngagementContext';
import { Trophy, Star, Target, Zap, Flame, Medal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { ecoScore, impactScore, level, badges, streak, leaderboard, leaderboardLoading } = useEngagement();
  const progress = ecoScore % 100;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>My Eco Dashboard</h1>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>User Details</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div><strong>Name:</strong> {user?.name || 'Eco User'}</div>
          <div><strong>Email:</strong> {user?.email || '-'}</div>
          <div><strong>User ID:</strong> {user?.userId || '-'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'var(--primary)', padding: '1rem', borderRadius: '50%', color: 'white' }}>
            <Trophy size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '2rem' }}>{ecoScore}</h3>
            <p style={{ margin: 0, color: 'var(--text-light)' }}>Points</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'var(--secondary)', padding: '1rem', borderRadius: '50%', color: 'white' }}>
            <Target size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '2rem' }}>{impactScore}</h3>
            <p style={{ margin: 0, color: 'var(--text-light)' }}>Impact Score</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'var(--accent)', padding: '1rem', borderRadius: '50%', color: 'var(--dark)' }}>
            <Zap size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '2rem' }}>Lvl {level}</h3>
            <div style={{ width: '100px', height: '8px', background: '#e0e0e0', borderRadius: '4px', marginTop: '5px' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }}></div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'var(--accent)', padding: '1rem', borderRadius: '50%', color: 'white' }}>
            <Flame size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '2rem' }}>{streak?.current || 0} days</h3>
            <p style={{ margin: 0, color: 'var(--text-light)' }}>Current Streak</p>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Star color="var(--accent)" fill="var(--accent)" /> Badges Earned
      </h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {badges.map((badge, index) => (
          <div key={index} className="glass-panel" style={{ padding: '1rem 2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
            <span>Badge:</span> {badge}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={20} color="var(--accent)" />
            Streak Tracking
          </h3>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.6 }}>
            Complete one challenge each day to grow your streak and unlock streak badges.
          </p>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>Current:</strong> {streak?.current || 0} day(s)</div>
            <div><strong>Longest:</strong> {streak?.longest || 0} day(s)</div>
            <div><strong>Last Completed:</strong> {streak?.lastCompletedAt ? new Date(streak.lastCompletedAt).toLocaleDateString() : 'No challenges completed yet'}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Medal size={20} color="var(--accent)" />
            Leaderboard
          </h3>
          {leaderboardLoading ? (
            <p style={{ color: 'var(--text-light)' }}>Loading leaderboard...</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {leaderboard.map((entry) => (
                <div key={entry.userId} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <strong>#{entry.rank} {entry.name}</strong>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.92rem' }}>Level {entry.level}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>{entry.points} pts</strong>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.92rem' }}>Impact {entry.impactScore}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '4rem', padding: '2rem', background: 'rgba(255,255,255,0.5)', borderRadius: '16px', textAlign: 'center' }}>
        <h3>Keep going!</h3>
        <p>Complete more challenges to unlock new badges.</p>
        <Link to="/challenges" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>Find Challenges</Link>
      </div>
    </div>
  );
};

export default Dashboard;
