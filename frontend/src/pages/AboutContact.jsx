import React, { useEffect, useState } from 'react';
import { fetchPageContent } from '../api/contentApi';

const AboutContact = () => {
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const page = await fetchPageContent('about-contact');
        setContent(page);
      } finally {
        setIsLoading(false);
      }
    };
    loadContent();
  }, []);

  const aboutCards = content?.about?.cards || [];

  return (
    <div className="container">
      <section className="section">
        <div className="section-header">
          <h2>{content?.about?.title || 'About the Platform'}</h2>
          <p>{content?.about?.description || 'This section loads only after the backend is available.'}</p>
        </div>
        {aboutCards.length === 0 ? (
          <div className="info-card">
            <h3>{isLoading ? 'Loading about content...' : 'No about content available'}</h3>
            <p>Run the backend to fetch the stored page content from MongoDB.</p>
          </div>
        ) : (
          <div className="two-col">
            {aboutCards.map((card) => (
              <article key={card.title} className="info-card">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-header">
          <h2>{content?.contact?.title || 'Contact Us'}</h2>
          <p>{content?.contact?.description || 'Contact details will appear after backend data loads.'}</p>
        </div>
        {content?.contact ? (
          <>
            <p className="lead">Email: {content.contact.email}</p>
            <form className="contact-form">
              <label>
                Full Name
                <input type="text" name="name" placeholder="Your name" />
              </label>
              <label>
                Email
                <input type="email" name="email" placeholder="you@example.com" />
              </label>
              <label>
                Message
                <textarea name="message" rows="5" placeholder="Tell us how we can help" />
              </label>
              <button className="btn-primary" type="submit">Send Message</button>
            </form>
          </>
        ) : (
          <div className="info-card">
            <h3>{isLoading ? 'Loading contact content...' : 'No contact content available'}</h3>
            <p>Start the backend to fetch the contact information from MongoDB.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AboutContact;
