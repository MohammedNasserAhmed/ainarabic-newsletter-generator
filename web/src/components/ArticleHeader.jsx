import React from 'react';

const ArticleHeader = ({ meta }) => {
  if (!meta) return null;
  const { title, author, date, readingTime } = meta;

  return (
    <header className="article-header">
      <h1 className="article-title">{title}</h1>
      
      <div className="article-meta sans-text">
        <div className="meta-author">
          <div className="author-avatar">{author.charAt(0)}</div>
          <div className="author-info">
            <span className="author-name">{author}</span>
            <div className="meta-details">
              <time dateTime={date}>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
              <span className="meta-separator">·</span>
              <span>{readingTime} min read</span>
            </div>
          </div>
        </div>
        
        <div className="share-actions">
          <button className="btn-icon" aria-label="Share on Twitter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
          </button>
          <button className="btn-icon" aria-label="Share on LinkedIn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
          </button>
          <button className="btn-icon" aria-label="Copy link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default ArticleHeader;
