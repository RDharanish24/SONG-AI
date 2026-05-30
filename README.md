# HeartBeat AI 💖

HeartBeat AI is a premium, Gen-Z friendly, mobile-first, dark-mode-focused AI Personalized Song Dedication Web Application. Users can generate studio-quality customized songs and animated greeting/dedication pages for their loved ones.

## 🚀 Key Features

1. **Custom Multi-Step Form Builder**: Conversational onboarding collecting names, relationships, occasions, moods, vocal vibes, and personal memory snippets.
2. **AI-Driven Song & Lyrics Generation**: Integrates with **Sonauto API** to compose personalized soundtracks, alongside **Gemini** to weave detailed emotional lyrics and title metadata.
3. **Interactive Dedication Page**: Immersive fullscreen experience featuring floating heart visualizers, scrolling timed karaoke-style lyrics, a custom HTML5 audio frequency analyzer, a retro slideshow of memories, and social share links.
4. **Cinematic Video Exporter**: Generates vertical Reels-ready MP4 visualizer videos with integrated lyrics overlay (Premium tier).
5. **Subscription & Paywalls**: Integrates **Stripe Checkout** sandboxed checkouts to unlock full-length creations and high-definition video downloads.
6. **Administrative Insights**: Panel tracking total registered accounts, platform page views, active task polling, and moderation controls to moderate content.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, Canvas Confetti.
- **Backend**: FastAPI (Python), SQLAlchemy ORM, Uvicorn, httpx, moviepy, stripe.
- **Database**: PostgreSQL (Supabase) / SQLite (Local Sandbox).

---

## 📂 Project Structure

```
/
├── backend/
│   ├── app/
│   │   ├── core/           # Database setup, App settings
│   │   ├── models/         # Pydantic validation and SQLAlchemy DB models
│   │   ├── routes/         # Auth, Songs, Payments, and Admin endpoints
│   │   ├── services/       # Sonauto, LLM (Lyrics), Pollinations cover art, Video compilation
│   │   └── main.py         # Application entry and CORS configurations
│   ├── .env                # Backend local configurations
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/            # App Router (Home, Builder, Dashboard, Admin, Songs)
│   │   ├── components/     # Canvas visualizer, Slideshow, Particle floating backdrop
│   │   ├── lib/            # Backend API connectors
│   │   └── types/          # TypeScript declarations
│   ├── .env.local          # Frontend local environment configuration
│   └── package.json        # Frontend package configuration
└── database/
    └── schema.sql          # Supabase SQL table migrations
```

---

## ⚙️ Local Setup Guide

### 1. Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install standard requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *Note: The app automatically spins up a local `heartbeat.db` SQLite database file on launch so it runs immediately without manual migration configurations.*

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the web app at `http://localhost:3000`.

---

## 💎 Third-Party Production Configurations

To connect live clouds, fill in the environment keys inside `backend/.env`:
- **`SONAUTO_API_KEY`**: Obtain from [Sonauto Developers Console](https://sonauto.ai/) to run live studio music generation.
- **`GEMINI_API_KEY`**: Obtain from [Google AI Studio](https://aistudio.google.com/) for rich AI lyrics generation.
- **`STRIPE_API_KEY`** & **`STRIPE_WEBHOOK_SECRET`**: Set up under [Stripe Developer dashboard](https://dashboard.stripe.com/).
