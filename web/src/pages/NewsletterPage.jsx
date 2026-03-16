import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ArticleLayout from '../components/ArticleLayout';
import ArticleContent from '../components/ArticleContent';
import CommentSection from '../components/CommentSection';
import { TableOfContents } from '../components/InteractiveFeatures';
import '../index.css';
import '../components/ArticleLayout.css';
import '../components/ArticleFeatures.css';

function NewsletterPage() {
  const { id } = useParams();
  const [newsData, setNewsData] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [metaData, setMetaData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');

    // Fetch the index to get meta for this ID
    fetch('/data/index.json')
      .then(res => res.json())
      .then(indexData => {
        const item = indexData.find(i => i.id === id);
        if (item) {
          setMetaData({
            title: item.title,
            author: "aiNarabic Team",
            date: item.date,
            readingTime: 6
          });
        }
      })
      .catch(err => console.error("Error loading index data:", err));

    // Fetch the actual content
    fetch(`/data/newsletter_${id}.json`)
      .then(res => {
        if (!res.ok) throw new Error("Newsletter data not found");
        return res.json();
      })
      .then(data => {
        setNewsData(data);
        const uniqueCategories = [...new Set(data.map(item => item.category))];
        const tocItems = uniqueCategories.map(cat => ({
          id: cat.toLowerCase().replace(/\s+/g, '-'),
          text: cat
        }));
        setHeadings(tocItems);
      })
      .catch(err => {
        console.error("Error loading news data:", err);
        setError(err.message);
      });
  }, [id]);

  if (error) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
        <h2>Issue Not Found</h2>
        <p>{error}</p>
        <Link to="/" style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}>&larr; Back to all issues</Link>
      </div>
    );
  }

  if (!metaData || newsData.length === 0) {
    return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>Loading Newsletter...</div>;
  }

  return (
    <ArticleLayout articleMeta={metaData}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span>&larr;</span> Back to all issues
        </Link>
      </div>
      
      <div className="content-with-sidebar">
        <div style={{width: '100%'}}>
          <p className="lead">
            Below is your weekly curated roundup of the most critical AI developments, models, and policy updates, sourced for {metaData.date}.
          </p>
          <ArticleContent contentData={newsData} />
          <CommentSection issueId={id} />
        </div>
        
        <div className="sidebar-wrapper">
          <TableOfContents headings={headings} />
        </div>
      </div>
    </ArticleLayout>
  );
}

export default NewsletterPage;
