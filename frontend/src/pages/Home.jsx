import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPageContent } from '../api/contentApi';

const Home = () => {
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const page = await fetchPageContent('home');
        setContent(page);
      } finally {
        setIsLoading(false);
      }
    };
    loadContent();
  }, []);

  const heroImages = content?.heroImages || [];
  const focusSections = content?.focusSections || [];
  const hasContent = Boolean(content);

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">{hasContent ? content.eyebrow : 'Environmental Awareness Engagement Platform'}</p>
          <h1>{hasContent ? content.title : 'Environmental Awareness Engagement Platform'}</h1>
          <p className="tagline">{hasContent ? content.tagline : 'Protect Our Planet'}</p>
          <p className="lead">
            {hasContent
              ? content.lead
              : 'Start the backend to load the full homepage content from MongoDB.'}
          </p>
          <div className="hero-actions">
            <Link to="/topics" className="btn-primary">Explore Topics</Link>
            <Link to="/articles" className="btn-ghost">Read Articles</Link>
          </div>
        </div>
        <div className="hero-media">
          {heroImages.length > 0 ? (
            <div className="contrast-grid">
              {heroImages.map((image) => (
                <div key={image.src} className="contrast-card">
                  <img src={image.src} alt={image.alt} />
                  <span>{image.caption}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3>{isLoading ? 'Loading homepage...' : 'Backend content not loaded'}</h3>
              <p>
                {isLoading
                  ? 'Trying to reach the backend.'
                  : 'Run the backend server to fetch hero images and homepage sections.'}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>{content?.focusSectionIntro?.title || 'Key Focus Areas'}</h2>
          <p>
            {content?.focusSectionIntro?.description
              || 'These sections will appear after the backend provides the stored content.'}
          </p>
        </div>
        {focusSections.length === 0 ? (
          <div className="info-card">
            <h3>No homepage sections yet</h3>
            <p>Start the backend to fetch this content from MongoDB.</p>
          </div>
        ) : (
          <div className="card-grid">
            {focusSections.map((section) => (
              <article key={section.title} className="info-card">
                <h3>{section.title}</h3>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
