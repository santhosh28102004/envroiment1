import React, { useState, useEffect } from 'react';
import { useEngagement } from '../context/EngagementContext';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchTopicById, fetchTopics } from '../api/contentApi';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
const INITIAL_QUIZ_STATE = {
  currentQuestion: 0,
  score: 0,
  showScore: false,
  userAnswers: []
};

const Quiz = () => {
  const { topicId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(INITIAL_QUIZ_STATE.currentQuestion);
  const [score, setScore] = useState(INITIAL_QUIZ_STATE.score);
  const [showScore, setShowScore] = useState(INITIAL_QUIZ_STATE.showScore);
  const [userAnswers, setUserAnswers] = useState(INITIAL_QUIZ_STATE.userAnswers);
  const [quizTitle, setQuizTitle] = useState('General Quiz');
  const { addScore } = useEngagement();
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuiz = async () => {
      setCurrentQuestion(INITIAL_QUIZ_STATE.currentQuestion);
      setScore(INITIAL_QUIZ_STATE.score);
      setShowScore(INITIAL_QUIZ_STATE.showScore);
      setUserAnswers(INITIAL_QUIZ_STATE.userAnswers);

      try {
        if (topicId) {
          const topic = await fetchTopicById(topicId);
          setQuizTitle(topic?.title || 'Topic Quiz');
          setQuestions(Array.isArray(topic?.questions) ? topic.questions : []);
          return;
        }

        setQuizTitle('General Quiz');
        const topics = await fetchTopics();
        const allQuestions = topics.flatMap((t) => t.questions || []);
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        setQuestions(shuffled.slice(0, 10));
      } catch {
        setQuestions([]);
      }
    };

    loadQuiz();
  }, [topicId]);

  const handleAnswerOptionClick = (index) => {
    const isCorrect = index === questions[currentQuestion].correct;
    setUserAnswers([...userAnswers, { questionIndex: currentQuestion, selectedOption: index, isCorrect }]);

    if (isCorrect) {
      setScore(score + 1);
    }

    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      const finalScore = isCorrect ? score + 1 : score;
      const pointsEarned = finalScore * 10;
      addScore(pointsEarned).catch(() => {});
      if (token) {
        fetch(`${API_BASE_URL}/quiz/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ correct: finalScore, total: questions.length })
        }).catch(() => {});
      }
      setShowScore(true);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="container">
        <section className="section">
          <div className="info-card" style={{ textAlign: 'center' }}>
            <h2>No quiz data available</h2>
            <p>Start the backend to fetch quiz questions from MongoDB.</p>
            <button onClick={() => navigate('/topics')} className="btn-primary">Browse Topics</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container">
      <section className="section">
        <div className="quiz-card">
          {showScore ? (
            <div className="quiz-results">
              <h2>You scored {score} out of {questions.length}</h2>
              <p>Points earned: +{score * 10}</p>

              <div className="answer-review">
                <h3>Review Answers</h3>
                {questions.map((q, qIndex) => {
                  const userAnswer = userAnswers[qIndex];
                  const isUserCorrect = userAnswer?.isCorrect;

                  return (
                    <div key={qIndex} className="answer-card">
                      <p className="answer-question">{qIndex + 1}. {q.question}</p>
                      <div className="answer-options">
                        {q.options.map((opt, optIndex) => {
                          const isSelected = userAnswer?.selectedOption === optIndex;
                          const isCorrectOption = q.correct === optIndex;

                          let className = 'answer-option';
                          if (isCorrectOption) className += ' correct';
                          if (isSelected && !isUserCorrect) className += ' incorrect';

                          return (
                            <div key={optIndex} className={className}>
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cta-row">
                <button onClick={() => navigate('/dashboard')} className="btn-primary">View Dashboard</button>
                <button onClick={() => navigate('/topics')} className="btn-ghost">Back to Topics</button>
              </div>
            </div>
          ) : (
            <>
              <div className="quiz-header">
                <span>Question {currentQuestion + 1}/{questions.length}</span>
                <span>{quizTitle}</span>
              </div>
              <h2>{questions[currentQuestion].question}</h2>
              <div className="quiz-options">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerOptionClick(index)}
                    className="quiz-option"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Quiz;
