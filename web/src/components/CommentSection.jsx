import React, { useState, useEffect } from 'react';
import './CommentSection.css';

// --- Recursive Comment Component ---
const Comment = ({ comment, replies, allReplies, currentUser, onReplySubmit, level = 0 }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser) return;
    setIsSubmitting(true);
    await onReplySubmit(replyText.trim(), comment.id);
    setReplyText('');
    setShowReplyForm(false);
    setIsSubmitting(false);
  };

  const childReplies = replies.filter(r => r.parentId === comment.id);
  const isReply = level > 0;

  return (
    <div className={isReply ? 'comment-reply' : 'comment-thread'}>
      <div className="avatar-placeholder">{comment.avatar}</div>
      <div className="comment-content">
        <div className="comment-meta">
          <span className="comment-author">{comment.author}</span>
          <span className="comment-date">{comment.date}</span>
        </div>
        <p className="comment-text">{comment.text}</p>
        <div className="comment-actions">
          <button className="btn-action">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
            Like
          </button>
          {currentUser && (
            <button className="btn-action" onClick={() => setShowReplyForm(!showReplyForm)}>
              {showReplyForm ? 'Cancel' : 'Reply'}
            </button>
          )}
        </div>

        {/* Inline Reply Form */}
        {showReplyForm && currentUser && (
          <form className="reply-form" onSubmit={handleReply} style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <div className="avatar-placeholder user-avatar" style={{ width: '24px', height: '24px', fontSize: '0.65rem', flexShrink: 0 }}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea
                placeholder={`Reply to ${comment.author}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows="2"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color, #eaebea)', fontFamily: 'var(--font-sans, Inter, sans-serif)', fontSize: '0.82rem', resize: 'vertical', background: 'var(--bg-primary, #ffffff)', color: 'var(--text-main, #1a1a1b)' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isSubmitting || !replyText.trim()}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
                >
                  {isSubmitting ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Nested Replies (branches) */}
        {childReplies.length > 0 && (
          <div className="replies-list">
            {childReplies.map(reply => (
              <Comment
                key={reply.id}
                comment={reply}
                replies={allReplies}
                allReplies={allReplies}
                currentUser={currentUser}
                onReplySubmit={onReplySubmit}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main CommentSection Component ---
const CommentSection = ({ issueId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Auth state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ainarabicUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthMode, setIsAuthMode] = useState(false);
  const [isRegistering, setIsRegistering] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [pendingUser, setPendingUser] = useState(null);

  // Fetch comments specific to this issueId when the component mounts
  useEffect(() => {
    fetch(`http://localhost:3001/comments?issueId=${issueId}`)
      .then(res => res.json())
      .then(data => {
        setComments(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching comments:", err);
        setIsLoading(false);
      });
  }, [issueId]);

  // Handle email confirmation from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const confirmId = params.get('confirm');
    
    if (confirmId) {
      fetch(`http://localhost:3001/users/${confirmId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      })
      .then(res => {
        if(res.ok) {
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsAuthMode(true);
          setIsRegistering(false);
          setAuthMessage("Email confirmed successfully! Please log in to start commenting.");
          
          setTimeout(() => {
            const commentsEl = document.getElementById('comments-section');
            if (commentsEl) commentsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 500);
        }
      })
      .catch(err => console.error("Auto-confirm failed:", err));
    }
  }, []);

  // Post a top-level comment
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setIsSubmitting(true);
    
    const commentData = {
      issueId: issueId,
      author: currentUser.name,
      avatar: currentUser.name.charAt(0).toUpperCase(),
      text: newComment.trim(),
    };
    
    fetch('http://localhost:3001/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    })
    .then(res => res.json())
    .then(savedComment => {
      setComments([savedComment, ...comments]);
      setNewComment("");
      setIsSubmitting(false);
    })
    .catch(err => {
      console.error("Error posting comment:", err);
      setIsSubmitting(false);
    });
  };

  // Post a reply to a specific comment
  const handleReplySubmit = async (text, parentId) => {
    if (!currentUser) return;

    const replyData = {
      issueId: issueId,
      author: currentUser.name,
      avatar: currentUser.name.charAt(0).toUpperCase(),
      text: text,
      parentId: parentId,
    };

    try {
      const res = await fetch('http://localhost:3001/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(replyData)
      });
      const savedReply = await res.json();
      setComments(prev => [...prev, savedReply]);
    } catch (err) {
      console.error("Error posting reply:", err);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    if (!authForm.email || !authForm.password || (isRegistering && !authForm.name)) return;

    try {
      if (isRegistering) {
        const checkRes = await fetch(`http://localhost:3001/users?email=${encodeURIComponent(authForm.email)}`);
        const existingUsers = await checkRes.json();
        
        if (existingUsers.length > 0) {
          setAuthError("Email already registered. Please log in.");
          return;
        }

        const newUser = {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          status: 'pending'
        };

        const postRes = await fetch('http://localhost:3001/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        });
        const createdUser = await postRes.json();
        
        setPendingUser(createdUser);
        setAuthMessage("Registration successful! A confirmation email has been sent.");
      } else {
        const res = await fetch(`http://localhost:3001/users?email=${encodeURIComponent(authForm.email)}&password=${encodeURIComponent(authForm.password)}`);
        const users = await res.json();

        if (users.length === 0) {
          setAuthError("Invalid email or password.");
          return;
        }

        const user = users[0];
        if (user.status === 'pending') {
          setPendingUser(user);
          setAuthError("Your account is not activated. Please confirm your email.");
          return;
        }

        const sessionUser = { id: user.id, name: user.name, email: user.email };
        localStorage.setItem('ainarabicUser', JSON.stringify(sessionUser));
        setCurrentUser(sessionUser);
        setIsAuthMode(false);
        setAuthForm({ name: '', email: '', password: '' });
      }
    } catch (err) {
      console.error(err);
      setAuthError("Network error. Make sure the database API is running.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ainarabicUser');
    setCurrentUser(null);
  };

  // Build tree: top-level comments are those with no parentId
  const topLevelComments = comments.filter(c => !c.parentId);

  return (
    <section id="comments-section" className="comments-container">
      <div className="comments-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>Discussion ({comments.length})</h3>
          <p>Share your thoughts on this week's updates.</p>
        </div>
        {currentUser && (
          <button onClick={handleLogout} className="btn-action" style={{ fontSize: '0.85rem' }}>Log out</button>
        )}
      </div>

      {!currentUser ? (
        <div className="auth-prompt-overlay" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '3rem' }}>
          {!isAuthMode ? (
            <>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>Join the conversation</h4>
              <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>You must be registered to post a comment.</p>
              <button className="btn-submit" onClick={() => setIsAuthMode(true)}>Login / Register</button>
            </>
          ) : (
            <form className="auth-form" onSubmit={handleAuthSubmit} style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{isRegistering ? 'Create Account' : 'Welcome Back'}</h4>
                <button type="button" onClick={() => { setIsAuthMode(false); setPendingUser(null); setAuthError(""); setAuthMessage(""); }} className="btn-action">Cancel</button>
              </div>

              {authError && <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.9rem' }}>{authError}</div>}
              {authMessage && <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#15803d', borderRadius: '8px', fontSize: '0.9rem' }}>{authMessage}</div>}

              {pendingUser ? (
                <div style={{ padding: '1.5rem', border: '1px dashed var(--brand-primary)', borderRadius: '8px', textAlign: 'center', background: 'rgba(241, 90, 36, 0.05)' }}>
                  <p style={{ margin: '0' }}>We've sent a confirmation link to <strong>{pendingUser.email}</strong>.</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Please check your inbox and click the link to verify your account.</p>
                </div>
              ) : (
                <>
                  {isRegistering && (
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      value={authForm.name}
                      onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                      required
                      style={{ padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%' }}
                    />
                  )}
                  
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={authForm.email}
                    onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                    required
                    style={{ padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%' }}
                  />
                  
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    required
                    style={{ padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%' }}
                  />

                  <button type="submit" className="btn-submit" style={{ width: '100%', marginTop: '0.5rem' }}>
                    {isRegistering ? 'Register & Continue' : 'Log In'}
                  </button>
                  
                  <p style={{ textAlign: 'center', margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {isRegistering ? 'Already have an account? ' : 'Need an account? '}
                    <button type="button" onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); setAuthMessage(""); }} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
                      {isRegistering ? 'Log in' : 'Register'}
                    </button>
                  </p>
                </>
              )}
            </form>
          )}
        </div>
      ) : (
        <form className="comment-form" onSubmit={handleSubmit}>
          <div className="comment-input-wrapper">
            <div className="avatar-placeholder user-avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
            <div className="input-group">
              <textarea
                placeholder="What are your thoughts?"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows="3"
              />
              <div className="form-actions">
                <button 
                  type="submit" 
                  className={`btn-submit ${isSubmitting ? 'submitting' : ''}`}
                  disabled={isSubmitting || !newComment.trim()}
                >
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="comments-list">
        {isLoading ? (
          <p style={{color: 'var(--text-muted)'}}>Loading discussion...</p>
        ) : topLevelComments.length === 0 ? (
          <p style={{color: 'var(--text-muted)'}}>No comments yet. Be the first to start the discussion!</p>
        ) : (
          topLevelComments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              replies={comments}
              allReplies={comments}
              currentUser={currentUser}
              onReplySubmit={handleReplySubmit}
              level={0}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default CommentSection;
