# Marginalia — AI Research Companion

Marginalia is an intelligent AI research assistant designed to help you dive deep into scientific literature. It searches arXiv, synthesizes information from papers, cites sources inline, and remembers your entire research journey.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2F%3Cyour-username%3E%2Fmarginalia)

## ✨ Key Features

- 🚀 **arXiv Deep Search** — Automatically searches arXiv for the most relevant papers.
- 🧠 **Intelligent Synthesis** — Uses state-of-the-art LLMs to answer questions using *only* the provided sources.
- 📑 **Inline Citations** — Every claim is backed by a `[1]` style citation that links directly to the source.
- 🔍 **Semantic Reranking** — Advanced token-overlap reranking to ensure the most relevant papers are always prioritized.
- 🌐 **Web Search Fallback** — Automatically switches to web search if arXiv lacks specific coverage.
- 💾 **Session Memory** — Your research threads are persisted, allowing you to pick up where you left off.
- 🛠️ **Power User Tools**
  - **Branching** — Explore different research directions from a single thread.
  - **Bookmarking** — Save your favorite papers to a personal library.
  - **Export** — Download your entire research conversation as a clean Markdown file.
- 🔌 **Multi-Provider** — Bring your own API key from any supported provider:
  - **Groq** (default) — Ultra-fast inference, auto-selects the best available model
  - **OpenAI** — GPT-4o, GPT-4 Turbo
  - **Anthropic** — Claude 3.5 Sonnet, Claude 3 Opus
  - **Google Gemini** — Gemini 2.0 Flash, Gemini 2.0 Pro
  - **DeepSeek** — DeepSeek V3, DeepSeek R1
  - **Mistral AI** — Mistral Large, Mistral Nemo
  - **OpenRouter** — 100+ models from all providers
  - **Omniroute** — Unified routing across providers
- 🌓 **Refined UI** — Elegant light and dark modes with smooth transitions, glassmorphism, and rendered markdown responses.

## 🚀 Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framermotion.com/)
- **Database:** [Prisma](https://www.prisma.io/) + [SQLite](https://www.sqlite.org/) (Local)
- **Auth:** [NextAuth.js](https://next-auth.js.org/)
- **AI:** Multi-provider support (Groq, OpenAI, Anthropic, Gemini, DeepSeek, Mistral, OpenRouter, Omniroute)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- An API key from any supported provider (e.g. [Groq](https://console.groq.com/keys), [OpenAI](https://platform.openai.com/api-keys), etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/marginalia.git
   cd marginalia
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Generate a random secret for NextAuth
   openssl rand -base64 32
   ```
   Ensure your `.env` contains:
   - `DATABASE_URL` (defaults to local SQLite)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL=http://localhost:3000`

4. **Database Setup**
   ```bash
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000`. Register an account, paste your API key in the sidebar, select a provider, and start researching!

## 🛠️ Deployment (Vercel)

1. **Database:** SQLite is ephemeral on Vercel. For production, swap to a hosted Postgres (e.g., [Neon](https://neon.tech/) or [Supabase](https://supabase.com/)).
   - Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`.
   - Update `DATABASE_URL` in your Vercel environment variables.
2. **Environment Variables:** Add the following to your Vercel project settings:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your production URL)
   - `SERPER_API_KEY` (optional, for web search)
3. **Deploy:** Push your code to GitHub and connect the repository to Vercel.

## 🛡️ License

MIT
