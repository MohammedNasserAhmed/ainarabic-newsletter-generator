import React, { useState } from 'react';
import ArticleHeader from './ArticleHeader';
import SubscribeModal from './SubscribeModal';
import { useTheme } from '../hooks/useTheme';

const ArticleLayout = ({ children, articleMeta }) => {
  const [showModal, setShowModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(
    () => localStorage.getItem('aiNarabic_subscribed') === 'true'
  );
  const { theme, toggleTheme } = useTheme();

  const handleSubscribed = (email) => {
    localStorage.setItem('aiNarabic_subscribed', 'true');
    localStorage.setItem('aiNarabic_email', email);
    setIsSubscribed(true);
  };

  return (
    <div className="layout-wrapper">
      {/* Top Navigation */}
      <nav className="top-nav sans-text">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="logo-dot"></span>
            aiNarabic
          </div>
          <div className="nav-links d-none-mobile">
            <a href="#archive">Archive</a>
            <a href="#about">About</a>
          </div>
          <div className="nav-actions">
            <button className="btn-search" aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
            <button className="btn-search" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            {isSubscribed ? (
              <span className="btn-subscribed">✓ Subscribed</span>
            ) : (
              <button className="btn-subscribe-sm" onClick={() => setShowModal(true)}>Subscribe</button>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        <article className="article-container">
          <ArticleHeader meta={articleMeta} />
          
          <div className="article-body">
            {children}
          </div>
        </article>
      </main>

      <footer className="footer-container sans-text">
        <div className="footer-content">
          <div className="footer-brand">
             <div className="nav-brand">
              <span className="logo-dot"></span>
              aiNarabic
            </div>
            <p className="footer-tagline">Making sense of AI for the Arabic-speaking world.</p>
          </div>
          
          <div className="footer-links">
            <div className="footer-col">
              <h4>Read</h4>
              <a href="#">Latest Issue</a>
              <a href="#">Archive</a>
              <a href="#">Topics</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Contact</a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} aiNarabic. All rights reserved.</p>
          <div className="social-links">
            {/* Social SVGs */}
          </div>
        </div>
      </footer>

      {/* Subscribe Modal */}
      <SubscribeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubscribed={handleSubscribed}
      />
    </div>
  );
};

export default ArticleLayout;

