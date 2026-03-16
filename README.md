<div align="center">
  
# 🌐 aiNarabic Newsletter Generator

[![GitHub Actions Status](https://img.shields.io/github/actions/workflow/status/yourusername/ainarabic-newsletter-generator/generate.yml?branch=main&style=for-the-badge&logo=github&color=4CAF50)](https://github.com/yourusername/ainarabic-newsletter-generator/actions)
[![React](https://img.shields.io/badge/React-19.X-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.X-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.X-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Groq API](https://img.shields.io/badge/LLM-Groq_Llama_3-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com)
[![Exa Search](https://img.shields.io/badge/Search-Exa_Deep_Search-1A1A1A?style=for-the-badge&logo=exa&logoColor=white)](https://exa.ai)

An autonomous, end-to-end platform that leverages state-of-the-art deep search (Exa) and large language models (Groq Llama 3) to curate, summarize, deduplicate, and publish weekly intelligence reports on the global AI ecosystem.

[Explore the Live App](#) • [Documentation](#architecture) • [Report a Bug](#)

</div>

<br />

## ✨ Transformative Features

- **🧠 Autonomous Curation**: Scours the web using Exa deep search for the latest AI models, frameworks, research, and funding announcements.
- **⚡ Neural Summarization**: Utilizes Groq's high-speed inference to distill complex articles into concise, highly readable ~50-word summaries.
- **🛡️ Two-Tier Deduplication**: Prevents content fatigue by aggressively deduplicating overlapping stories at both the raw article level (content similarity) and semantic summary level (topic clustering).
- **🚀 Zero-Touch Publishing**: Fully automated GitHub Actions pipeline `(Mondays @ 00:00 UTC)` that generates the JSON report, syncs it to the frontend, and deploys.
- **🎛️ Command Center UI**: Built-in React Admin Panel to manually trigger generations, monitor workflow status, and pause/resume automations without touching a terminal.

---

## 🏗️ System Architecture

The repository operates as a decoupled monolith, seamlessly blending a Python data pipeline with a modern React SPA and Express backend.

```mermaid
graph TD
    subgraph DataPipeline [Python Generation Layer]
        A[config.py] --> B[Exa Deep Search]
        B --> C{Deduplication Layer 1}
        C --> D[Groq LLM Summarization]
        D --> E{Deduplication Layer 2}
        E --> F((Output JSON))
    end

    subgraph Automation [GitHub Actions]
        G[generate.yml Cron] -->|Executes| DataPipeline
        G -->|Syncs| H(React public/data)
    end

    subgraph WebApp [Node.js + React]
        I[Express Server] -->|Toggle / Trigger API| G
        I --> J[(PostgreSQL Subscribers)]
        H --> K[React Frontend SPA]
        K -->|Admin Auth| I
    end
```

---

## 📂 Project Structure

A clean, domain-driven directory layout optimized for modern DX.

```text
ainarabic-newsletter-generator/
├── 🐍 Data Pipeline
│   ├── main.py                  # Pipeline execution entry point
│   ├── newsletter_generator.py  # Core search & LLM orchestration
│   ├── config.py                # Hyperparameters & search taxonomy
│   ├── requirements.txt         # Pip dependencies
│   └── output/                  # Raw JSON staging area
│
├── 🌐 Web Application (./web)
│   ├── server.js                # Express API (Auth, Subs, GitHub integrations)
│   ├── sync.js                  # Pre-build script mapping output/ to data/
│   ├── package.json             # NPM dependencies & scripts
│   ├── public/data/             # Frontend JSON consumption endpoint
│   └── src/                     # React 19 Frontend
│       ├── App.jsx              # Routing & Layout
│       └── pages/               # BlogIndex, AdminPanel, NewsletterPage
│
└── 🤖 DevOps
    └── .github/workflows/
        └── generate.yml         # CI/CD automation matrix
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL (for subscriber database)

### 1. Environment Configuration

Clone the repository and set up your secure environments.

```bash
# Clone the repository
git clone https://github.com/yourusername/ainarabic-newsletter-generator.git
cd ainarabic-newsletter-generator

# Setup Python Backend Env
cp .env.example .env

# Setup Node.js Web Env
cd web
cp .env.example .env
```

**Populate your `web/.env` with crucial keys for full functionality:**
```env
# Database & Web
DATABASE_URL=postgres://user:pass@localhost:5432/ainarabic
SITE_URL=http://localhost:5173

# Admin Security & GitHub Control
ADMIN_PASSWORD=your_super_secret_password
GITHUB_TOKEN=ghp_your_classic_pat_token
GITHUB_OWNER=yourusername
GITHUB_REPO=ainarabic-newsletter-generator

# Email SMTP (For subscribers)
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
```

*(Note: `EXA_API_KEY` and `GROQ_API_KEY` must be added to your GitHub Repository Secrets for the pipeline automation to function).*

### 2. Local Development

Spin up the entire stack locally.

```bash
# 1. Install & Run React Frontend + Vite Server (In terminal 1)
cd web
npm install
npm run dev

# 2. Start Express API Backend (In terminal 2)
cd web
npm run api
```

### 3. Manual Data Generation (CLI)

If you prefer operating the pipeline outside the Admin UI:

```bash
# Return to root directory
cd ..
pip install -r requirements.txt

# Run full pipeline and save new week's JSON
python main.py --json --save

# Sync new data to frontend
cd web && npm run predev
```

---

## 🎛️ The Admin Control Panel

Manage your autonomous agent directly from the UI. 

1. Navigate to `http://localhost:5173/admin`
2. Authenticate using your `ADMIN_PASSWORD`.
3. **Features Available:**
   - **Status Monitoring**: See exactly when the next cron job is scheduled to run.
   - **Pause / Resume Automation**: Send safe PUT requests to GitHub to disable or re-enable the Monday schedule.
   - **Generate Now**: Trigger a `workflow_dispatch` event to bypass the schedule and immediately draft a new newsletter.

><img src="https://via.placeholder.com/800x400/1a1a1a/F55036?text=Admin+Panel+Preview" width="100%" alt="Admin Panel UI" style="border-radius:8px"/>

---

## 🤝 Contributing

We welcome contributions to push the boundaries of autonomous journalism! 

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<div align="center">
  <b>Built for the future of AI news curation.</b><br>
  <i>Designed meticulously in 2026.</i>
</div>
