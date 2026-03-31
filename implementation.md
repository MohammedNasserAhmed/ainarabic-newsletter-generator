# 🚀 Running aiNarabic Newsletter Generator

This guide provides simple, step-by-step instructions to run both the frontend and backend locally, as well as how to use GitHub Actions for automated generation.

## 🛠 Prerequisites

Make sure you have configured your environment variables first (as mentioned in the `README.md`).
- `d:\ML_Projects\ainarabic-newsletter-generator\.env`
- `d:\ML_Projects\ainarabic-newsletter-generator\web\.env`

---

## 💻 1. Running the App Locally (Simple Commands)

To run the full stack locally, you need two terminals.

### Terminal 1: Run Web Frontend & Vite Server
This runs the React UI where you can view the newsletter and access the Admin Panel.

```bash
cd web
npm run dev
```
*(Your app will be available at http://localhost:5173)*

### Terminal 2: Run Express Backend / API
This runs the backend server for subscribing users, database connections, and triggering GitHub Actions from the admin panel.

```bash
cd web
npm run api
```
*(Your API will be running at http://localhost:5000)*

---

## 📝 2. Creating a New Newsletter (Data Generation)

If you want to manually run the python backend pipeline to scrape Exa, summarize with Groq LLM, and update the newsletter data locally, you can use these commands:

```bash
# From the root of the project (d:\ML_Projects\ainarabic-newsletter-generator)
pip install -r requirements.txt

# Run generation and save JSON to the output folder
python main.py --json --save

# Sync the newly generated JSON data with the frontend React site
cd web
npm run predev
```
*Note: Refresh your React app (`http://localhost:5173`) to see the latest newsletter data!*

---

## 🐙 3. Running via GitHub (Automation & Actions)

The newsletter is configured to run automatically on GitHub **every Monday at 00:00 UTC**. However, you can also trigger it manually or run it via GitHub.

### Option A: Manual Trigger from GitHub UI
1. Go to your repository on GitHub.
2. Click the **Actions** tab.
3. Select **Generate Newsletter** from the left sidebar.
4. Click the **Run workflow** button on the right, and confirm by clicking **Run workflow** again.
5. GitHub will spin up an environment, run the Python script, generate the data, and commit it back to your repository.
6. Once it's finished, pull the latest changes locally with `git pull`.

### Option B: Triggering from the local Admin Panel
If you have started `npm run api` and `npm run dev`:
1. Go to http://localhost:5173/admin and login.
2. Since the Express API server acts as a proxy to GitHub, you can click the "Generate" button from the **Admin Panel**.
3. It uses your `GITHUB_TOKEN` to trigger the GitHub Action flow directly.

---

## 🔧 Two-Weeks Newsletter Note
If you want to generate a newsletter that spans **two weeks (14 days)** instead of one week, open `config.py` in the root folder and change:
```python
LOOKBACK_DAYS = 14
```
And adjust the search queries in `SEARCH_QUERIES` from "this week" to "in the last two weeks".
