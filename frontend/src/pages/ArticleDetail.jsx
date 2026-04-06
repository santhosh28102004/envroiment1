import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchArticleById, fetchArticles } from '../api/contentApi';

const topicLabels = {
  'climate-change': 'Climate Change',
  pollution: 'Pollution',
  'deforestation-biodiversity': 'Forests & Biodiversity',
  'waste-management': 'Waste Management',
  'sustainable-living': 'Sustainable Living',
  'renewable-energy': 'Renewable Energy'
};

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [allPreparedArticles, setAllPreparedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadArticle = async () => {
      setIsLoading(true);
      try {
        const [selectedArticle, allArticles] = await Promise.all([
          fetchArticleById(id),
          fetchArticles()
        ]);
        setArticle(selectedArticle);
        setAllPreparedArticles(
          allArticles
            .filter((item) => item.category !== 'news')
            .map((item) => ({
              ...item,
              description: item?.description || item?.summary || 'No description available.'
            }))
        );
      } catch {
        setArticle(null);
        setAllPreparedArticles([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadArticle();
  }, [id]);

  const derivedTopicId = article?.topicId || null;

  const relatedArticles = useMemo(() => {
    if (!article) return [];

    return allPreparedArticles
      .filter((item) => item.id !== article.id)
      .filter((item) => item.topicId && item.topicId === derivedTopicId)
      .slice(0, 3);
  }, [article, derivedTopicId]);

  if (isLoading) {
    return (
      <div className="container">
        <section className="section">
          <h2>Loading article...</h2>
        </section>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container">
        <section className="section">
          <h2>Article not found</h2>
          <Link to="/articles" className="btn-ghost">Back to Articles</Link>
        </section>
      </div>
    );
  }

  const detail = article?.detail || {
    subtitle: article?.summary,
    sections: [
      {
        heading: 'Overview',
        body: article?.summary
      }
    ]
  };

  const heroPill = derivedTopicId
    ? topicLabels[derivedTopicId] || article.category
    : article.category;

  return (
    <div className="container">
      <section className="section">
        <Link to="/articles" className="text-link">Back to Articles</Link>
        <div className="topic-hero">
          <img src={article.image} alt={article.title} />
          <div className="topic-hero-text">
            <p className="pill">{heroPill}</p>
            <h1>{article.title}</h1>
            <p className="lead">{detail.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="detail-grid">
          {detail.sections.map((section) => (
            <article key={section.heading} className="info-card">
              <h3>{section.heading}</h3>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      {relatedArticles.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2>More On This Topic</h2>
            <p>Related reads from the same environmental focus area.</p>
          </div>
          <div className="article-grid article-grid-enhanced">
            {relatedArticles.map((related) => (
              <article key={related.id} className="article-card article-card-enhanced">
                <img src={related.image} alt={related.title} />
                <div>
                  <div className="article-card-meta">
                    <p className="pill pill-category">{topicLabels[derivedTopicId] || 'Related'}</p>
                  </div>
                  <h3>{related.title}</h3>
                  <p>{related.description}</p>
                  <Link to={`/articles/${related.id}`} className="btn-ghost">Read More</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ArticleDetail;
