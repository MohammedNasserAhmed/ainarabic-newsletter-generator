import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import './BlogIndex.css';

function BlogIndex() {
  const [indexData, setIndexData] = useState([]);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetch('/data/index.json')
      .then(res => res.json())
      .then(data => setIndexData(data))
      .catch(err => console.error("Error loading index:", err));
  }, []);

  return (
    <div className="blog-index">
      <header className="blog-index-header">
        <div className="blog-index-topbar">
          <div className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 22h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            <span className="brand-name">aiNarabic</span>
          </div>
          <button className="btn-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
        </div>
        <h1>Curated AI Intelligence</h1>
        <p className="subtitle">Weekly insights tracking the bleeding edge of AI models, funding, and products.</p>
      </header>

      <main className="blog-list">
        {indexData.length === 0 ? (
          <p style={{textAlign: 'center', margin: '4rem 0', color: 'var(--text-muted)'}}>Loading or no issues found.</p>
        ) : (
          indexData.map(post => (
            <article key={post.id} className="blog-card">
              <Link to={`/p/${post.id}`} className="card-link">
                <h2>{post.title}</h2>
                <div className="meta">
                  <span className="date">{post.date}</span>
                </div>
                <p className="excerpt">
                  Read this week's highlights and research summaries across{' '}
                  {(() => {
                    const end = new Date(post.date + 'T00:00:00');
                    const start = new Date(end);
                    start.setDate(end.getDate() - 7);
                    const dd = d => String(d.getDate()).padStart(2, '0');
                    const mm = d => String(d.getMonth() + 1).padStart(2, '0');
                    return `${dd(start)}-${dd(end)}/${mm(end)}/${end.getFullYear()}`;
                  })()}.
                </p>
                <div className="read-more">
                  Read issue <span aria-hidden="true">&rarr;</span>
                </div>
              </Link>
            </article>
          ))
        )}
      </main>

      <footer className="blog-index-footer">
        <p>&copy; {new Date().getFullYear()} aiNarabic. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default BlogIndex;
