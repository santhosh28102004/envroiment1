import React, { useEffect, useState } from 'react';
import { fetchAwarenessTips } from '../api/contentApi';

const AwarenessTips = () => {
  const [awarenessTips, setAwarenessTips] = useState({
    dos: [],
    donts: [],
    water: [],
    plastic: [],
    energy: []
  });

  useEffect(() => {
    const loadTips = async () => {
      try {
        const data = await fetchAwarenessTips();
        if (data) setAwarenessTips(data);
      } catch {
        setAwarenessTips({
          dos: [],
          donts: [],
          water: [],
          plastic: [],
          energy: []
        });
      }
    };
    loadTips();
  }, []);

  return (
    <div className="container">
      <section className="section">
        <div className="section-header">
          <h2>Awareness Tips</h2>
          <p>Simple actions that make a measurable difference every day.</p>
        </div>
        <div className="tips-grid">
          <article className="info-card">
            <h3>Do's</h3>
            <ul>
              {awarenessTips.dos.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="info-card">
            <h3>Don'ts</h3>
            <ul>
              {awarenessTips.donts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Daily Conservation</h2>
          <p>Practical ideas for water, plastic, and energy conservation.</p>
        </div>
        <div className="tips-grid">
          <article className="info-card">
            <h3>Water Saving Tips</h3>
            <ul>
              {awarenessTips.water.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="info-card">
            <h3>Plastic Reduction Tips</h3>
            <ul>
              {awarenessTips.plastic.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="info-card">
            <h3>Energy Conservation Tips</h3>
            <ul>
              {awarenessTips.energy.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
};

export default AwarenessTips;
