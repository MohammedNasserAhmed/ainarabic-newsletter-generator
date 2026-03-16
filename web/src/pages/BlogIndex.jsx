import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './BlogIndex.css';

function BlogIndex() {
  const [indexData, setIndexData] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    fetch('/data/index.json')
      .then(res => res.json())
      .then(data => setIndexData(data))
      .catch(err => console.error("Error loading index:", err));
  }, []);

  return (
    <div className="blog-index">
      <header className="blog-index-header">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 22h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
          <span className="brand-name">aiNarabic</span>
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
