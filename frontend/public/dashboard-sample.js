const API_BASE = 'http://localhost:4000/api';
const TOKEN_KEY = 'ecoaware_jwt';

const authHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const renderUser = (user) => {
  document.getElementById('user-name').textContent = user?.name || '-';
  document.getElementById('user-email').textContent = user?.email || '-';
  document.getElementById('user-id').textContent = user?.userId || '-';
  document.getElementById('points-value').textContent = user?.points ?? 0;
  document.getElementById('impact-value').textContent = user?.impactScore ?? 0;
  document.getElementById('level-value').textContent = user?.level ?? 1;
  document.getElementById('streak-value').textContent = user?.streak?.current ?? 0;

  const badgeList = document.getElementById('badge-list');
  badgeList.innerHTML = '';
  (user?.badges || []).forEach((badge) => {
    const item = document.createElement('div');
    item.textContent = badge;
    badgeList.appendChild(item);
  });
};

const renderLeaderboard = (leaderboard) => {
  const container = document.getElementById('leaderboard');
  container.innerHTML = '';
  leaderboard.forEach((entry) => {
    const item = document.createElement('div');
    item.textContent = `#${entry.rank} ${entry.name} - ${entry.points} pts`;
    container.appendChild(item);
  });
};

const fetchUser = async () => {
  const response = await fetch(`${API_BASE}/user`, {
    headers: authHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to load user');
  }
  renderUser(data.user);
};

const fetchLeaderboard = async () => {
  const response = await fetch(`${API_BASE}/leaderboard`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to load leaderboard');
  }
  renderLeaderboard(data.leaderboard || []);
};

document.getElementById('complete-challenge').addEventListener('click', async () => {
  const response = await fetch(`${API_BASE}/complete-challenge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify({
      challengeId: 'sample-dashboard-challenge',
      points: 10
    })
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.message || 'Challenge update failed');
    return;
  }
  renderUser(data.user);
  fetchLeaderboard().catch(() => {});
});

Promise.all([fetchUser(), fetchLeaderboard()]).catch((error) => {
  console.error(error);
});
