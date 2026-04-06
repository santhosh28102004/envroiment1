import React, { useEffect, useMemo, useState } from 'react';
import { useEngagement } from '../context/EngagementContext';
import { CheckCircle, Circle, Leaf, Trophy } from 'lucide-react';
import { fetchTopics } from '../api/contentApi';

const dailyChallenges = [
    {
        id: 'daily-reusable-bottle',
        title: 'Carry Reusable Bottle',
        description: 'Carry a reusable water bottle today instead of buying single-use plastic bottles.',
        topic: 'Daily Eco Challenge',
        difficulty: 'Easy',
        points: 10,
        reward: '+10 points'
    },
    {
        id: 'daily-switch-off-lights',
        title: 'Switch Off Unused Lights',
        description: 'Turn off lights, fans, and other electrical items whenever they are not needed.',
        topic: 'Daily Eco Challenge',
        difficulty: 'Easy',
        points: 10,
        reward: '+10 points'
    },
    {
        id: 'daily-cloth-bag',
        title: 'Use Cloth Bag Instead of Plastic',
        description: 'Take a cloth or reusable shopping bag when you go out instead of accepting plastic bags.',
        topic: 'Daily Eco Challenge',
        difficulty: 'Easy',
        points: 10,
        reward: '+10 points'
    },
    {
        id: 'daily-walk-or-cycle',
        title: 'Walk or Cycle for Short Distance',
        description: 'Choose walking or cycling instead of using a bike or scooter for a short trip today.',
        topic: 'Daily Eco Challenge',
        difficulty: 'Easy',
        points: 10,
        reward: '+10 points'
    },
    {
        id: 'daily-avoid-food-waste',
        title: 'Avoid Food Waste Today',
        description: 'Take only what you can finish and try to use leftovers well so no food goes to waste.',
        topic: 'Daily Eco Challenge',
        difficulty: 'Easy',
        points: 10,
        reward: '+10 points'
    }
];

const Challenges = () => {
    const { completedChallenges, completeChallenge } = useEngagement();
    const [topics, setTopics] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [activeChallengeId, setActiveChallengeId] = useState('');

    useEffect(() => {
        const loadTopics = async () => {
            try {
                const data = await fetchTopics();
                setTopics(data);
            } catch {
                setTopics([]);
            }
        };
        loadTopics();
    }, []);

    const allChallenges = useMemo(() => (
        [
            ...dailyChallenges,
            ...topics.flatMap((topic) =>
                (topic.challenges || []).map((c) => ({ ...c, topic: topic.title }))
            )
        ].filter((challenge, index, list) =>
            list.findIndex((item) => item.id === challenge.id) === index
        )
    ), [topics]);

    const handleAccept = async (id, points) => {
        setError('');
        setMessage('');
        setActiveChallengeId(id);
        try {
            await completeChallenge(id, points);
            setMessage(`Challenge completed. You earned +${points} points.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setActiveChallengeId('');
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Environmental Challenges</h1>
            {message && <p style={{ color: 'var(--primary)', textAlign: 'center', marginBottom: '1rem' }}>{message}</p>}
            {error && <p style={{ color: 'var(--accent)', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {allChallenges.length === 0 && (
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3>No challenges available yet</h3>
                        <p>Check back soon for new community challenges.</p>
                    </div>
                )}
                {allChallenges.map((challenge) => {
                    const isCompleted = completedChallenges.includes(challenge.id);
                    const isSubmitting = activeChallengeId === challenge.id;
                    return (
                        <div
                            key={challenge.id}
                            className="glass-panel"
                            style={{
                                padding: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                borderLeft: isCompleted ? '5px solid var(--primary)' : '5px solid var(--text-light)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '1px' }}>{challenge.topic}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                    <Trophy size={16} /> +{challenge.points}
                                </div>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Leaf size={18} color="var(--primary)" />
                                    <span>{challenge.title}</span>
                                </h3>
                                <p style={{ margin: '0.85rem 0 0', color: 'var(--text-light)', lineHeight: 1.6 }}>
                                    {challenge.description || 'Take this eco-friendly action and earn points.'}
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <span style={{ padding: '0.45rem 0.75rem', borderRadius: '999px', background: 'rgba(46, 125, 50, 0.12)', color: 'var(--primary)', fontWeight: 600 }}>
                                    Difficulty: {challenge.difficulty || 'Easy'}
                                </span>
                                <span style={{ padding: '0.45rem 0.75rem', borderRadius: '999px', background: 'rgba(255, 179, 0, 0.14)', color: 'var(--accent)', fontWeight: 600 }}>
                                    Points: +{challenge.points}
                                </span>
                                <span style={{ padding: '0.45rem 0.75rem', borderRadius: '999px', background: 'rgba(0, 121, 107, 0.12)', color: 'var(--secondary)', fontWeight: 600 }}>
                                    Reward: {challenge.reward || `+${challenge.points} points`}
                                </span>
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                <button
                                    onClick={() => handleAccept(challenge.id, challenge.points)}
                                    disabled={isCompleted || isSubmitting}
                                    className="btn-primary"
                                    style={{
                                        width: '100%',
                                        background: isCompleted ? 'var(--light)' : 'var(--primary)',
                                        color: isCompleted ? 'var(--text-light)' : 'white',
                                        cursor: isCompleted ? 'default' : 'pointer'
                                    }}
                                >
                                    {isCompleted ? (
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><CheckCircle size={18} /> Completed</span>
                                    ) : isSubmitting ? (
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Circle size={18} /> Saving...</span>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Circle size={18} /> Complete Challenge</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Challenges;
