/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/api';

const EngagementContext = createContext();

export const useEngagement = () => useContext(EngagementContext);

export const EngagementProvider = ({ children }) => {
    const { token, user, syncUser, refreshUser, isAuthenticated, isLoading } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    useEffect(() => {
        const loadLeaderboard = async () => {
            setLeaderboardLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/leaderboard`);
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to load leaderboard');
                }
                setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
            } catch {
                setLeaderboard([]);
            } finally {
                setLeaderboardLoading(false);
            }
        };

        loadLeaderboard();
    }, [user?.points, user?.impactScore]);

    const completeChallenge = async (challengeId, points = 10) => {
        if (!token) {
            throw new Error('Please log in to complete challenges');
        }

        const response = await fetch(`${API_BASE_URL}/complete-challenge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ challengeId, points })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || 'Failed to complete challenge');
        }

        syncUser(data.user || null);
        return true;
    };

    const addScore = async (points) => {
        if (!token || !points) {
            return false;
        }

        const response = await fetch(`${API_BASE_URL}/impact-score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ points })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update impact score');
        }

        syncUser(data.user || null);
        return true;
    };

    const refreshEngagement = async () => {
        await refreshUser();
    };

    const value = useMemo(() => ({
        isLoaded: !isLoading,
        isAuthenticated,
        user,
        ecoScore: user?.points || 0,
        impactScore: user?.impactScore || 0,
        level: user?.level || 1,
        badges: user?.badges || ['Beginner'],
        streak: user?.streak || { current: 0, longest: 0, lastCompletedAt: null },
        completedChallenges: Array.isArray(user?.completedChallenges)
            ? user.completedChallenges.map((entry) => entry.challengeId)
            : [],
        challengeHistory: Array.isArray(user?.completedChallenges) ? user.completedChallenges : [],
        leaderboard,
        leaderboardLoading,
        addScore,
        completeChallenge,
        refreshEngagement
    }), [isLoading, isAuthenticated, user, leaderboard, leaderboardLoading]);

    return (
        <EngagementContext.Provider value={value}>
            {children}
        </EngagementContext.Provider>
    );
};
