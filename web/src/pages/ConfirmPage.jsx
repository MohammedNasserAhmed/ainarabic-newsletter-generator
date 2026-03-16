import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_URL = 'http://localhost:3001';

export default function ConfirmPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');

    // Guard against React StrictMode double-execution
    if (calledRef.current) return;
    calledRef.current = true;
    
    async function confirmSubscription() {
      try {
        const res = await fetch(`${API_URL}/subscribe/confirm/${token}`);
        const data = await res.json();

        if (res.ok) {
          if (data.alreadyConfirmed) {
            setStatus('already');
            setMessage('Your subscription was already confirmed.');
          } else {
            setStatus('success');
            setMessage('Your subscription is confirmed!');
          }
          localStorage.setItem('aiNarabic_subscribed', 'true');
        } else if (res.status === 410) {
          setStatus('expired');
          setMessage(data.message || 'This link has expired.');
        } else if (res.status === 404) {
          setStatus('invalid');
          setMessage(data.message || 'Invalid confirmation link.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Something went wrong.');
        }
      } catch (e) {  // eslint-disable-line no-unused-vars
        setStatus('error');
        setMessage('Network error. Please try again later.');
      }
    }

    confirmSubscription();
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans, "Inter", sans-serif)',
      background: '#fafafa',
      padding: '1rem',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
        maxWidth: '480px',
        width: '100%',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #F15A24, #e04810)',
          padding: '28px 24px',
        }}>
          <h1 style={{ color: '#fff', margin: 0, fontSize: '1.75rem' }}>
            aiNarabic<span style={{ color: '#FFD700' }}>.</span>
          </h1>
        </div>

        {/* Content */}
        <div style={{ padding: '40px 32px' }}>
          {status === 'loading' && (
            <>
              <div style={{
                width: '40px', height: '40px', margin: '0 auto 20px',
                border: '3px solid #eee', borderTopColor: '#F15A24',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }} />
              <p style={{ color: '#666' }}>Confirming your subscription...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ color: '#1a1a1b', margin: '0 0 12px' }}>{message}</h2>
              <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '24px' }}>
                Welcome to the aiNarabic community! You'll receive your first newsletter soon.
              </p>
              <Link to="/" style={{
                display: 'inline-block',
                background: '#F15A24', color: '#fff',
                padding: '12px 28px', borderRadius: '10px',
                textDecoration: 'none', fontWeight: 600,
              }}>
                Browse Latest Issues
              </Link>
            </>
          )}

          {status === 'already' && (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
              <h2 style={{ color: '#1a1a1b', margin: '0 0 12px' }}>{message}</h2>
              <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '24px' }}>
                You're all set! No further action is needed.
              </p>
              <Link to="/" style={{
                display: 'inline-block',
                background: '#F15A24', color: '#fff',
                padding: '12px 28px', borderRadius: '10px',
                textDecoration: 'none', fontWeight: 600,
              }}>
                Go to Homepage
              </Link>
            </>
          )}

          {status === 'expired' && (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏰</div>
              <h2 style={{ color: '#1a1a1b', margin: '0 0 12px' }}>Link Expired</h2>
              <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '24px' }}>{message}</p>
              <Link to="/" style={{
                display: 'inline-block',
                background: '#F15A24', color: '#fff',
                padding: '12px 28px', borderRadius: '10px',
                textDecoration: 'none', fontWeight: 600,
              }}>
                Subscribe Again
              </Link>
            </>
          )}

          {(status === 'invalid' || status === 'error') && (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
              <h2 style={{ color: '#1a1a1b', margin: '0 0 12px' }}>Oops!</h2>
              <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '24px' }}>{message}</p>
              <Link to="/" style={{
                display: 'inline-block',
                background: '#F15A24', color: '#fff',
                padding: '12px 28px', borderRadius: '10px',
                textDecoration: 'none', fontWeight: 600,
              }}>
                Go to Homepage
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
