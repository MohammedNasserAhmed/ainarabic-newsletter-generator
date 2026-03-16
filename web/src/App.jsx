import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BlogIndex from './pages/BlogIndex';
import NewsletterPage from './pages/NewsletterPage';
import ConfirmPage from './pages/ConfirmPage';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BlogIndex />} />
        <Route path="/p/:id" element={<NewsletterPage />} />
        <Route path="/confirm/:token" element={<ConfirmPage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;

