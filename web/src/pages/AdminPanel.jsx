import React, { useState } from 'react';
import './AdminPanel.css';

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const fetchStatus = async (authPassword) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/status', {
        headers: {
          'x-admin-password': authPassword
        }
      });
      
      if (res.status === 401) {
        setIsAuthenticated(false);
        setActionMessage({ type: 'error', text: 'Invalid password' });
        return;
      }
      
      if (!res.ok) throw new Error('Status fetch failed');
      
      const data = await res.json();
      setStatus(data);
      setIsAuthenticated(true);
      setActionMessage({ type: '', text: '' });
    } catch (err) {
      console.error(err);
      setActionMessage({ type: 'error', text: 'Failed to connect to backend' });
    } finally {
      setLoading(false);
    }
  };

  const verifyLogin = (e) => {
    if (e) e.preventDefault();
    if (!password) return;
    fetchStatus(password);
  };

  const toggleAutomation = async () => {
    if (!status) return;
    const newEnabledState = !status.automationEnabled;
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:3001/api/admin/toggle-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ enable: newEnabledState })
      });
      
      if (!res.ok) throw new Error('Toggle failed');
      
      setStatus({ ...status, automationEnabled: newEnabledState });
      setActionMessage({ type: 'success', text: `Automation successfully ${newEnabledState ? 'enabled' : 'disabled'}!` });
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const generateManually = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/generate', {
        method: 'POST',
        headers: {
          'x-admin-password': password
        }
      });
      
      if (!res.ok) throw new Error('Generation trigger failed');
      
      setActionMessage({ type: 'success', text: 'Generation started! Please check GitHub for progress. Note it will take a few minutes.' });
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <form className="admin-login-form" onSubmit={verifyLogin}>
          <h2>Admin Access</h2>
          {actionMessage.text && <p className={`message ${actionMessage.type}`}>{actionMessage.text}</p>}
          <input 
            type="password" 
            placeholder="Enter Admin Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !password}>
            {loading ? 'Verifying...' : 'Login'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <header className="admin-header">
        <h1>Control Panel</h1>
        <p>Manage weekly newsletter generation</p>
      </header>
      
      {actionMessage.text && (
        <div className={`action-banner ${actionMessage.type}`}>
          {actionMessage.text}
        </div>
      )}

      <div className="admin-cards">
        <div className="admin-card">
          <h3>GitHub Automation</h3>
          <p className="card-desc">Automatically generates the newsletter every Monday at 00:00 UTC.</p>
          
          <div className="status-indicator">
            <span className={`status-dot ${status?.automationEnabled ? 'active' : 'inactive'}`}></span>
            <strong>Status:</strong> {status?.automationEnabled ? 'Running (Enabled)' : 'Paused (Disabled)'}
          </div>
          
          {status?.automationEnabled && status?.nextRun && (
            <div className="next-run">
              <strong>Next Run:</strong> {new Date(status.nextRun).toLocaleString()}
            </div>
          )}

          <button 
            className={`admin-btn ${status?.automationEnabled ? 'btn-danger' : 'btn-success'}`}
            onClick={toggleAutomation}
            disabled={loading}
          >
            {status?.automationEnabled ? 'Pause Automation' : 'Resume Automation'}
          </button>
        </div>

        <div className="admin-card">
          <h3>Manual Generation</h3>
          <p className="card-desc">Force generation right now. This overrides the schedule and pushes a new newsletter to the repo immediately.</p>
          
          <button 
            className="admin-btn btn-primary mt-auto" 
            onClick={generateManually}
            disabled={loading || !status?.automationEnabled}
            title={!status?.automationEnabled ? "Must resume automation first to enable manual triggers" : ""}
          >
            {loading ? 'Working...' : 'Generate New Issue Now'}
          </button>
          
          <p className="small-note mt-3 text-muted">A sync and deploy will happen automatically after generation finishes.</p>
        </div>
      </div>
    </div>
  );
}
