import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchArticles } from '../api/contentApi';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'climate', label: 'Climate' },
  { id: 'pollution', label: 'Pollution' },
  { id: 'water', label: 'Water' },
  { id: 'global-warming', label: 'Global Warming' }
];

const categoryMeta = {
  climate: { label: 'Climate', className: 'category-climate' },
  forest: { label: 'Climate', className: 'category-climate' },
  pollution: { label: 'Pollution', className: 'category-pollution' },
  air: { label: 'Pollution', className: 'category-pollution' },
  water: { label: 'Water', className: 'category-water' },
  'global-warming': { label: 'Global Warming', className: 'category-global-warming' },
  energy: { label: 'Global Warming', className: 'category-global-warming' }
};

const getArticleCategoryMeta = (category) => categoryMeta[category] || {
  label: category || 'General',
  className: 'category-default'
};

const normalizeArticle = (article) => ({
  ...article,
  description: article.description || article.summary || 'No description available.'
});

const getCategoryKey = (category) => {
  const meta = getArticleCategoryMeta(category);
  return meta.label.toLowerCase().replace(/\s+/g, '-');
};

const Articles = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [preparedArticles, setPreparedArticles] = useState([]);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const data = await fetchArticles();
        setPreparedArticles(
          data
            .filter((article) => article.category !== 'news')
            .map(normalizeArticle)
        );
      } catch {
        setPreparedArticles([]);
      }
    };
    loadArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    return preparedArticles.filter((article) => {
      const matchesCategory = activeCategory === 'all'
        ? true
        : getCategoryKey(article.category) === activeCategory
          || article.category === activeCategory;

      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch = !normalizedSearch
        || article.title?.toLowerCase().includes(normalizedSearch)
        || article.description?.toLowerCase().includes(normalizedSearch)
        || getArticleCategoryMeta(article.category).label.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, preparedArticles, searchTerm]);

  const groupedArticles = useMemo(() => {
    if (activeCategory !== 'all') return [];

    return categories
      .filter((category) => category.id !== 'all')
      .map((category) => ({
        ...category,
        articles: filteredArticles.filter((article) => getCategoryKey(article.category) === category.id)
      }))
      .filter((group) => group.articles.length > 0);
  }, [activeCategory, filteredArticles]);

  const renderArticleCard = (article) => {
    const meta = getArticleCategoryMeta(article.category);

    return (
      <article key={article.id} className="article-card article-card-enhanced">
        <img src={article.image} alt={article.title} />
        <div>
          <div className="article-card-meta">
            <p className={`pill pill-category ${meta.className}`}>{meta.label}</p>
          </div>
          <h3>{article.title}</h3>
          <p>{article.description}</p>
          <Link to={`/articles/${article.id}`} className="btn-ghost">
            Read More
          </Link>
        </div>
      </article>
    );
  };

  return (
    <div className="container">
      <section className="section">
        <div className="section-header">
          <h2>Articles</h2>
          <p>Explore environmental explainers and practical reads across climate, pollution, water, and global warming.</p>
        </div>

        <div className="articles-toolbar glass-panel">
          <div className="articles-toolbar-copy">
            <p className="eyebrow">Article Library</p>
            <h3>Browse by topic</h3>
            <p>Find quick reads focused on core environmental issues and everyday solutions.</p>
          </div>
          <label className="articles-search">
            <span>Search articles</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by title, topic, or description"
            />
          </label>
        </div>

        <div className="filter-bar">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={activeCategory === category.id ? 'filter-pill active' : 'filter-pill'}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="articles-status">
          <p>{`${filteredArticles.length} article${filteredArticles.length === 1 ? '' : 's'} available`}</p>
          <p>Browse the collection using category filters or search.</p>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="articles-empty glass-panel">
            <h3>No articles available</h3>
            <p>
              {preparedArticles.length === 0
                ? 'Start the backend to fetch article data from MongoDB.'
                : 'Try another category or search term.'}
            </p>
          </div>
        ) : activeCategory === 'all' ? (
          <div>
            {groupedArticles.map((group) => (
              <section key={group.id} className="section">
                <div className="section-header">
                  <h3>{group.label}</h3>
                  <p>{`${group.articles.length} article${group.articles.length === 1 ? '' : 's'} available`}</p>
                </div>
                <div className="article-grid article-grid-enhanced">
                  {group.articles.map(renderArticleCard)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="article-grid article-grid-enhanced">
            {filteredArticles.map(renderArticleCard)}
          </div>
        )}
      </section>
    </div>
  );
};

export default Articles;
