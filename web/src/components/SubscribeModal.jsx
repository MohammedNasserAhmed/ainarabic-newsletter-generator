import React, { useState, useEffect, useCallback, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import './SubscribeModal.css';

const API_URL = 'http://localhost:3001';

// Map email domains to their webmail URLs
function getInboxUrl(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  const map = {
    'gmail.com': 'https://mail.google.com',
    'googlemail.com': 'https://mail.google.com',
    'outlook.com': 'https://outlook.live.com',
    'hotmail.com': 'https://outlook.live.com',
    'live.com': 'https://outlook.live.com',
    'yahoo.com': 'https://mail.yahoo.com',
    'yahoo.co.uk': 'https://mail.yahoo.com',
    'icloud.com': 'https://www.icloud.com/mail',
    'me.com': 'https://www.icloud.com/mail',
    'protonmail.com': 'https://mail.proton.me',
    'proton.me': 'https://mail.proton.me',
  };
  return map[domain] || `https://${domain}`;
}

export default function SubscribeModal({ isOpen, onClose, onSubscribed }) {
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('en');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [closing, setClosing] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  // Fetch subscriber count
  useEffect(() => {
    if (isOpen) {
      fetch(`${API_URL}/subscribers/count`)
        .then(res => res.json())
        .then(data => setSubscriberCount(data.count || 0))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setStatus('idle');
      setErrorMsg('');
      setEmail('');
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
      onClose();
    }, 250);
  }, [onClose]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, language, captchaToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'already_subscribed') {
          setErrorMsg('This email is already subscribed! ✓');
          onSubscribed?.(email);
        } else {
          setErrorMsg(data.error || data.message || 'Something went wrong.');
        }
        setStatus('error');
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
        return;
      }

      setStatus('success');
      onSubscribed?.(email);
    } catch (e) {  // eslint-disable-line no-unused-vars
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`subscribe-modal-overlay ${closing ? 'closing' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="subscribe-modal" role="dialog" aria-modal="true">
        {status === 'success' ? (
          /* ---- Success State ---- */
          <div className="subscribe-success-state">
            <div className="success-checkmark">
              <svg viewBox="0 0 72 72" fill="none">
                <circle className="check-circle" cx="36" cy="36" r="32" stroke="#22C55E" strokeWidth="3" fill="none" />
                <polyline className="check-mark" points="22,38 32,48 50,26" stroke="#22C55E" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>Check your inbox! 📬</h3>
            <p>We've sent a confirmation email to <strong>{email}</strong>. Click the link inside to confirm your subscription.</p>
            <a
              href={getInboxUrl(email)}
              target="_blank"
              rel="noopener noreferrer"
              className="go-to-inbox-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <polyline points="22,7 12,13 2,7" />
              </svg>
              Go to Your Inbox
            </a>
          </div>
        ) : (
          /* ---- Form State ---- */
          <>
            <div className="modal-header">
              <button className="modal-close-btn" onClick={handleClose} aria-label="Close">✕</button>
              <h2>aiNarabic<span style={{ color: '#FFD700' }}>.</span></h2>
              <p className="modal-tagline">The Weekly Dose of AI</p>
            </div>
            <div className="modal-body">
              {errorMsg && <div className="modal-error">{errorMsg}</div>}

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  className="email-input"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={status === 'loading'}
                />

                <div className="language-options">
                  <div className="language-option">
                    <input
                      type="radio"
                      id="lang-en"
                      name="language"
                      value="en"
                      checked={language === 'en'}
                      onChange={() => setLanguage('en')}
                    />
                    <label htmlFor="lang-en">
                      <span className="lang-flag">🇬🇧</span> English Newsletter
                    </label>
                  </div>
                  <div className="language-option">
                    <input
                      type="radio"
                      id="lang-ar"
                      name="language"
                      value="ar"
                      checked={language === 'ar'}
                      onChange={() => setLanguage('ar')}
                    />
                    <label htmlFor="lang-ar" style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 600 }}>
                      <span className="lang-flag">🇸🇦</span> النسخة العربية
                    </label>
                  </div>
                </div>

                <div className="hcaptcha-wrapper" style={{ margin: '16px 0', display: 'flex', justifyContent: 'center' }}>
                  <HCaptcha
                    sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
                    onVerify={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                    ref={captchaRef}
                    languageOverride="en"
                  />
                </div>

                <button
                  type="submit"
                  className="subscribe-submit-btn"
                  disabled={status === 'loading' || !captchaToken}
                >
                  {status === 'loading' ? (
                    <><span className="btn-spinner"></span> Sending...</>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </form>

              <div className="social-proof">
                Join <strong>{subscriberCount > 0 ? `${subscriberCount}+` : ''}</strong> AI professionals receiving The Weekly Dose of AI.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
