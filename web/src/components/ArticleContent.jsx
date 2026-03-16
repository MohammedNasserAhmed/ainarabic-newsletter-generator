import React, { Component } from 'react';
import Microlink from '@microlink/react';

const FALLBACK_IMAGE = '/embed-fallback.png';

// Error boundary to prevent a single broken embed from crashing the whole page
class EmbedErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <a href={this.props.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.12)', textDecoration: 'none', border: '1px solid var(--border-color, #eaebea)' }}>
          <img src={FALLBACK_IMAGE} alt="Article preview" style={{ width: '100%', height: '250px', objectFit: 'cover', display: 'block' }} />
          <div style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {this.props.url}
          </div>
        </a>
      );
    }
    return this.props.children;
  }
}

const ArticleContent = ({ contentData }) => {
  if (!contentData || !contentData.length) return null;

  // Group by category to build the sections dynamically
  const sections = {};
  contentData.forEach((item) => {
    if (!sections[item.category]) {
      sections[item.category] = [];
    }
    sections[item.category].push(item);
  });

  return (
    <div className="article-body">
      <p>
        Welcome back to another edition of aiNarabic's weekly newsletter. This week has seen explosive growth in agentic execution models and multimodal reasoning breakthroughs. 
      </p>

      {Object.entries(sections).map(([category, items]) => {
        // Create an ID slug for the table of contents
        const slugId = category.toLowerCase().replace(/\s+/g, '-');

        return (
          <section key={category} id={slugId} className="article-section">
            <h2 className="section-category">{category}</h2>
            <div className="category-divider"></div>
            
            {items.map((item, index) => (
              <div key={index} className="news-item">
                <h3>{item.topic}</h3>
                <time className="news-date sans-text" dateTime={item.date}>
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </time>
                <p className="news-summary">{item.summary}</p>
                {item.url && (
                  <div className="embed-container">
                    <EmbedErrorBoundary url={item.url}>
                      <Microlink 
                        url={item.url} 
                        size="large"
                        media={['image', 'logo']}
                        setData={(data) => {
                          if (!data) return { image: { url: FALLBACK_IMAGE } };
                          return {
                            ...data,
                            image: data.image && data.image.url ? data.image : { url: FALLBACK_IMAGE },
                          };
                        }}
                        style={{ width: '100%', borderRadius: '12px', fontFamily: 'var(--font-sans)', overflow: 'hidden' }} 
                      />
                    </EmbedErrorBoundary>
                  </div>
                )}
              </div>
            ))}
          </section>
        )
      })}
    </div>
  );
};

export default ArticleContent;

