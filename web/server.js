import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import process from 'process';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configure Nodemailer for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// --- User Routes ---

// Get User by Email (and optionally password for login)
app.get('/users', async (req, res) => {
  const { email, password } = req.query;
  try {
    let query = 'SELECT * FROM users WHERE email = $1';
    let values = [email];

    if (password) {
      query += ' AND password = $2';
      values.push(password);
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Register New User
app.post('/users', async (req, res) => {
  const { name, email, password, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, password, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, password, status || 'pending']
    );
    const user = result.rows[0];

    // Fire off confirmation email in the background
    const mailOptions = {
      from: `"aiNarabic" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to aiNarabic - Please Confirm Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1b;">
          <h2 style="color: #F15A24;">Welcome, ${name}!</h2>
          <p>Thank you for registering to join the discussion on aiNarabic.</p>
          <p>To start commenting, please confirm your email address by clicking the link below:</p>
          <div style="margin: 30px 0;">
            <a href="http://localhost:5173/p/2026-03-08?confirm=${user.id}" style="background-color: #F15A24; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirm My Email</a>
          </div>
          <p style="color: #6c757d; font-size: 0.9em;">If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions).catch(err => console.error("Email send failed:", err));

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    // 23505 is PostgreSQL unique violation error code
    if (err.code === '23505') {
      res.status(409).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// Update User Status (Email Confirmation)
app.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});


// --- Comment Routes ---

// Get Comments for an Issue
app.get('/comments', async (req, res) => {
  const { issueId } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM comments WHERE issue_id = $1 ORDER BY id DESC',
      [issueId]
    );
    
    // Map database snake_case columns back to frontend camelCase expectations
    const mappedRows = result.rows.map(row => ({
      id: row.id,
      issueId: row.issue_id,
      author: row.author_name,
      avatar: row.author_avatar,
      text: row.text,
      parentId: row.parent_id,
      date: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(new Date(row.created_at))
    }));

    res.json(mappedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Post a new comment
app.post('/comments', async (req, res) => {
  const { issueId, author, avatar, text, parentId } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO comments (issue_id, author_name, author_avatar, text, parent_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [issueId, author, avatar, text, parentId || null]
    );
    
    // Return the newly created row mapped to frontend shape
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      issueId: row.issue_id,
      author: row.author_name,
      avatar: row.author_avatar,
      text: row.text,
      parentId: row.parent_id,
      date: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(new Date(row.created_at))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});


// --- Subscription Rate Limiter ---
const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many subscription attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Email Template Helpers ---
const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';

function getConfirmationEmail(email, token, lang) {
  const confirmUrl = `${SITE_URL}/confirm/${token}`;
  if (lang === 'ar') {
    return {
      subject: 'أكّد اشتراكك في aiNarabic – الجرعة الأسبوعية لأهم تحديثات الذكاء الاصطناعي',
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1b; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #F15A24, #e04810); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">aiNarabic<span style="color: #FFD700;">.</span></h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">الجرعة الأسبوعية لأهم تحديثات الذكاء الاصطناعي</p>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #1a1a1b; margin: 0 0 16px;">مرحباً! 👋</h2>
            <p style="line-height: 1.7; color: #444;">شكراً لاهتمامك بالاشتراك في نشرة aiNarabic الأسبوعية.</p>
            <p style="line-height: 1.7; color: #444;">لتأكيد اشتراكك، يرجى الضغط على الزر أدناه:</p>
            <div style="margin: 32px 0; text-align: center;">
              <a href="${confirmUrl}" style="background-color: #F15A24; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">تأكيد الاشتراك</a>
            </div>
            <p style="color: #999; font-size: 13px;">ينتهي صلاحية هذا الرابط خلال 24 ساعة.</p>
            <p style="color: #999; font-size: 13px;">إذا لم تطلب هذا الاشتراك، يمكنك تجاهل هذه الرسالة.</p>
          </div>
        </div>
      `
    };
  }
  return {
    subject: 'Confirm your subscription to aiNarabic – The Weekly Dose of AI',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1b; background: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #F15A24, #e04810); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">aiNarabic<span style="color: #FFD700;">.</span></h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">The Weekly Dose of AI Updates</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #1a1a1b; margin: 0 0 16px;">Welcome! 👋</h2>
          <p style="line-height: 1.7; color: #444;">Thanks for your interest in subscribing to the aiNarabic weekly newsletter.</p>
          <p style="line-height: 1.7; color: #444;">To confirm your subscription, please click the button below:</p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${confirmUrl}" style="background-color: #F15A24; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Confirm Subscription</a>
          </div>
          <p style="color: #999; font-size: 13px;">This link will expire in 24 hours.</p>
          <p style="color: #999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `
  };
}

function getWelcomeEmail(lang) {
  if (lang === 'ar') {
    return {
      subject: '!أهلاً بك في aiNarabic',
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1b; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #F15A24, #e04810); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">aiNarabic<span style="color: #FFD700;">.</span></h1>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #1a1a1b; margin: 0 0 16px;">🎉 تم تأكيد اشتراكك!</h2>
            <p style="line-height: 1.7; color: #444;">مرحباً بك في مجتمع aiNarabic! أنت الآن ضمن قائمة المشتركين في نشرتنا الأسبوعية.</p>
            <p style="line-height: 1.7; color: #444;">ستصلك كل أسبوع أهم وأحدث تحديثات الذكاء الاصطناعي مباشرة إلى بريدك الإلكتروني، تشمل:</p>
            <ul style="line-height: 2; color: #444;">
              <li>آخر أخبار النماذج والأبحاث</li>
              <li>تحليلات السوق والتمويل</li>
              <li>إصدارات المنتجات الجديدة</li>
              <li>السياسات والتشريعات المتعلقة بالذكاء الاصطناعي</li>
            </ul>
            <div style="margin: 32px 0; text-align: center;">
              <a href="${SITE_URL}" style="background-color: #F15A24; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">تصفح أحدث الإصدارات</a>
            </div>
          </div>
        </div>
      `
    };
  }
  return {
    subject: 'Welcome to aiNarabic!',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1b; background: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #F15A24, #e04810); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">aiNarabic<span style="color: #FFD700;">.</span></h1>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #1a1a1b; margin: 0 0 16px;">🎉 You're confirmed!</h2>
          <p style="line-height: 1.7; color: #444;">Welcome to the aiNarabic community! You're now subscribed to our weekly newsletter.</p>
          <p style="line-height: 1.7; color: #444;">Every week, you'll receive the most important AI updates straight to your inbox, including:</p>
          <ul style="line-height: 2; color: #444;">
            <li>Latest model releases and research</li>
            <li>Market analysis and funding news</li>
            <li>New product launches</li>
            <li>AI policy and regulation updates</li>
          </ul>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${SITE_URL}" style="background-color: #F15A24; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Browse Latest Issues</a>
          </div>
        </div>
      </div>
    `
  };
}

// --- Subscription Routes ---

// POST /subscribe - Create pending subscription
app.post('/subscribe', subscribeLimiter, async (req, res) => {
  const { email, language, captchaToken } = req.body;
  if (!email || !language) {
    return res.status(400).json({ error: 'Email and language preference are required.' });
  }
  if (!['en', 'ar'].includes(language)) {
    return res.status(400).json({ error: 'Language must be "en" or "ar".' });
  }

  // Verify hCaptcha
  if (!captchaToken) {
    return res.status(400).json({ error: 'Please complete the captcha verification.' });
  }
  try {
    const hcaptchaRes = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `response=${captchaToken}&secret=${process.env.HCAPTCHA_SECRET}`,
    });
    const hcaptchaData = await hcaptchaRes.json();
    if (!hcaptchaData.success) {
      return res.status(400).json({ error: 'Captcha verification failed. Please try again.' });
    }
  } catch (e) {  // eslint-disable-line no-unused-vars
    return res.status(500).json({ error: 'Captcha verification error. Please try again.' });
  }

  try {
    // Check if already confirmed
    const existing = await pool.query('SELECT * FROM subscribers WHERE email = $1', [email]);
    if (existing.rows.length > 0 && existing.rows[0].confirmed) {
      return res.status(409).json({ error: 'already_subscribed', message: 'This email is already subscribed.' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();

    if (existing.rows.length > 0) {
      // Re-send confirmation for existing unconfirmed subscriber
      await pool.query(
        'UPDATE subscribers SET confirmation_token = $1, token_created_at = $2, language_preference = $3 WHERE email = $4',
        [token, now, language, email]
      );
    } else {
      // Insert new subscriber
      await pool.query(
        'INSERT INTO subscribers (email, language_preference, confirmation_token, token_created_at) VALUES ($1, $2, $3, $4)',
        [email, language, token, now]
      );
    }

    // Send confirmation email
    const emailContent = getConfirmationEmail(email, token, language);
    const mailOptions = {
      from: `"aiNarabic" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    transporter.sendMail(mailOptions).catch(err => console.error('Confirmation email failed:', err));

    res.status(200).json({ success: true, message: 'Confirmation email sent.' });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Failed to process subscription.' });
  }
});

// GET /subscribe/confirm/:token - Confirm subscription
app.get('/subscribe/confirm/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const result = await pool.query('SELECT * FROM subscribers WHERE confirmation_token = $1', [token]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'invalid_token', message: 'Invalid confirmation link.' });
    }

    const subscriber = result.rows[0];
    if (subscriber.confirmed) {
      return res.status(200).json({ success: true, message: 'Already confirmed.', alreadyConfirmed: true });
    }

    // Check if token expired (24 hours)
    const tokenAge = Date.now() - new Date(subscriber.token_created_at).getTime();
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return res.status(410).json({ error: 'token_expired', message: 'This confirmation link has expired. Please subscribe again.' });
    }

    // Confirm the subscription
    await pool.query(
      'UPDATE subscribers SET confirmed = true, subscribed_at = NOW(), confirmation_token = NULL WHERE id = $1',
      [subscriber.id]
    );

    // Send welcome email
    const welcomeContent = getWelcomeEmail(subscriber.language_preference);
    const mailOptions = {
      from: `"aiNarabic" <${process.env.EMAIL_USER}>`,
      to: subscriber.email,
      subject: welcomeContent.subject,
      html: welcomeContent.html,
    };
    transporter.sendMail(mailOptions).catch(err => console.error('Welcome email failed:', err));

    res.status(200).json({ success: true, message: 'Subscription confirmed!' });
  } catch (err) {
    console.error('Confirm error:', err);
    res.status(500).json({ error: 'Failed to confirm subscription.' });
  }
});

// GET /subscribers/check/:email - Check subscription status
app.get('/subscribers/check/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query('SELECT confirmed FROM subscribers WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ subscribed: false });
    }
    res.json({ subscribed: result.rows[0].confirmed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Check failed.' });
  }
});

// --- Admin & GitHub Automation Routes ---

// Helper to authenticate admin requests
const verifyAdmin = (req, res, next) => {
  const password = req.headers['x-admin-password'];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized. Invalid admin password.' });
  }
  next();
};

// Helper for GitHub API configurations
const getGithubConfig = () => {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const workflowId = 'generate.yml'; // Name of our workflow file
  
  if (!token || !owner || !repo) {
    throw new Error('GitHub credentials (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO) are not fully configured in .env');
  }

  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    urlBase: `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}`
  };
};

// GET /api/admin/status - Get workflow automation status
app.get('/api/admin/status', verifyAdmin, async (req, res) => {
  try {
    const config = getGithubConfig();
    const response = await axios.get(config.urlBase, { headers: config.headers });
    
    // state is usually "active" or "disabled_manually"
    const isActive = response.data.state === 'active';
    
    // Calculate next run (Next Monday at 00:00 UTC)
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setUTCDate(now.getUTCDate() + ((1 + 7 - now.getUTCDay()) % 7 || 7));
    nextRun.setUTCHours(0, 0, 0, 0);

    res.json({
      automationEnabled: isActive,
      state: response.data.state,
      nextRun: nextRun.toISOString()
    });
  } catch (err) {
    console.error('GitHub API Status Error:', err.response?.data || err.message);
    // If workflow doesn't exist yet (404), return a graceful default
    if (err.response?.status === 404) {
       return res.json({ automationEnabled: false, state: 'not_found', nextRun: null });
    }
    res.status(500).json({ error: 'Failed to fetch automation status from GitHub' });
  }
});

// POST /api/admin/toggle-automation - Enable or disable the cron schedule
app.post('/api/admin/toggle-automation', verifyAdmin, async (req, res) => {
  const { enable } = req.body;
  try {
    const config = getGithubConfig();
    const endpoint = enable ? '/enable' : '/disable';
    
    // GitHub API requires PUT to enable/disable
    await axios.put(`${config.urlBase}${endpoint}`, {}, { headers: config.headers });
    
    res.json({ success: true, automationEnabled: enable });
  } catch (err) {
    console.error('GitHub API Toggle Error:', err.response?.data || err.message);
    res.status(500).json({ error: `Failed to ${enable ? 'enable' : 'disable'} automation on GitHub` });
  }
});

// POST /api/admin/generate - Manually trigger the workflow
app.post('/api/admin/generate', verifyAdmin, async (req, res) => {
  try {
    const config = getGithubConfig();
    
    // To trigger a workflow_dispatch event
    await axios.post(`${config.urlBase}/dispatches`, {
      ref: 'main' // Branch to run against
    }, { headers: config.headers });
    
    res.json({ success: true, message: 'Newsletter generation triggered successfully! It will take a few minutes to complete.' });
  } catch (err) {
    console.error('GitHub API Dispatch Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to trigger newsletter workflow on GitHub' });
  }
});

app.get('/subscribers/count', async (_req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM subscribers WHERE confirmed = true');
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Count failed.' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Neon Server API listening on port ${PORT}`);
});
