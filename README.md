# 🌍 CarbonIQ

> AI-powered carbon footprint tracker for India — track, understand, and reduce your environmental impact.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-23A65C?style=for-the-badge&logo=github)](https://ravikugupta.github.io/CarbonIQ/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

🔗 **Live:** https://ravikugupta.github.io/CarbonIQ/

---

## 🚀 Features

- **Multi-Step Carbon Calculator** — Estimate monthly emissions across Transport (km), Food & Diet, Home Energy (kWh + ₹), and Shopping (₹).
- **Interactive Dashboard** — Recharts-powered pie chart & 6-month trend. Graded vs. India's average (1,900 kg CO₂/year).
- **AI Insights Engine** — Connect Google Gemini, OpenAI, Anthropic Claude, or your local **Ollama** model for India-specific, actionable tips in km & ₹.
- **Gamified Action Tracker** — 12 eco-actions (Carpool, Meatless Monday, Metro Rail, etc.). Earn points, build streaks, track CO₂ saved.
- **Privacy First** — All data & API keys stored in `localStorage`. Nothing leaves your browser.
- **Mobile Responsive** — Dark-green glassmorphic design, fully accessible.

---

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite 6 |
| Styling | Tailwind CSS (Custom Dark-Green Theme) |
| Routing | React Router v7 |
| Charts | Recharts |
| Icons | Lucide React |
| AI | Gemini / OpenAI / Claude / Ollama (via native fetch) |
| Hosting | GitHub Pages (via GitHub Actions) |

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- npm

### Run locally
```bash
git clone https://github.com/ravikugupta/CarbonIQ.git
cd CarbonIQ
npm install
npm run dev
```
Open http://localhost:5173

### Build for production
```bash
npm run build
```

---

## 🤖 AI Providers

| Provider | Needs API Key | Notes |
|---|---|---|
| Google Gemini | ✅ Yes | Free tier available at [aistudio.google.com](https://aistudio.google.com) |
| OpenAI | ✅ Yes | Uses `gpt-4o-mini` |
| Anthropic Claude | ✅ Yes | Uses `claude-3-5-sonnet` |
| Ollama (Local) | ❌ No | Run `ollama serve` locally with `deepseek-r1:1.5b` |

For Ollama, start it first:
```bash
ollama serve
# In another terminal:
ollama run deepseek-r1:1.5b
```

---

## 📁 Project Structure

```
CarbonIQ/
├── .github/workflows/deploy.yml   # GitHub Pages CI/CD
├── public/
├── src/
│   ├── components/
│   │   ├── Calculator.jsx         # Multi-step emission calculator
│   │   ├── Dashboard.jsx          # Charts & India comparison
│   │   ├── AIInsights.jsx         # Multi-provider AI engine
│   │   ├── ActionTracker.jsx      # Gamified eco-actions
│   │   └── Navbar.jsx
│   ├── utils/
│   │   ├── carbonCalculator.js    # Emission formulas (India factors)
│   │   └── storage.js             # localStorage helpers
│   ├── App.jsx
│   └── main.jsx
├── vite.config.js
└── tailwind.config.js
```

---

## 📄 License

MIT © [Ravi Kumar Gupta](https://github.com/ravikugupta)
