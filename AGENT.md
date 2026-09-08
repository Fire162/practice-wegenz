# Infinite Practice Wegenz (`practice.wegenz.in`) — Developer & AI Agent Guide

## 1. Project Overview
**Infinite Practice Wegenz** (`practice.wegenz.in`) is a dedicated, distraction-free educational question practice and evaluation platform by **Fire162**, built with React 19, Vite, TypeScript, Tailwind CSS v4, and KaTeX math typesetting.

It provides unlimited custom practice sessions across 170,000+ JEE and NEET questions across 208 chapters, powered by a local PYQ microservice with instant local scoring, per-question timers, LaTeX math rendering, and video solutions.

---

## 2. Architecture & Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    practice.wegenz.in                       │
│        (Cloudflare Edge Proxy & Free SSL -> Port 443)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Nginx Virtual Host                    │
│      (/etc/nginx/sites-available/practice.wegenz.in.conf)    │
└──────────────┬──────────────────────────────┬───────────────┘
               │ (Port 5100 / Static Build)   │ (/api/* -> Port 8085)
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Practice React App      │ │    Local PYQ Microservice  │
│   (Vite + React 19 + KaTeX)  │ │ (170k+ questions, 208 chs) │
│   - Hub & Track Selector     │ │ - Manifest & Categories    │
│   - Multi-Subject Chapters   │ │ - Filtered Random Sets     │
│   - Timer & KaTeX Room       │ │ - Challenge Code Sharing   │
│   - Instant Local Scoring    │ └────────────────────────────┘
└──────────────────────────────┘
```

---

## 3. Directory Structure

```
/root/practice-wegenz/
├── AGENT.md                   # AI Agent & developer guide (this file)
├── index.html                 # App shell with KaTeX stylesheets
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript strict configuration
├── vite.config.ts             # Vite configuration & /api proxy to port 8085
├── public/                    # Static assets & favicon
└── src/
    ├── main.tsx               # React root entry
    ├── App.tsx                # Wouter routing & QueryClient
    ├── index.css              # Tailwind v4 setup & KaTeX display tweaks
    ├── lib/
    │   ├── utils.ts           # Classnames & Tailwind merge utility
    │   └── apiUrl.ts          # API base URL resolution helper
    ├── hooks/
    │   ├── useInfinitePractice.ts # Subjects, chapters, random set & solution logic
    │   └── usePageMeta.ts     # Document title & SEO meta helper
    ├── components/
    │   └── ui/skeleton.tsx    # Loading skeleton component
    └── pages/
        ├── home.tsx           # Track hub (11th/12th JEE & NEET)
        └── practice.tsx       # Selection panel, question room & completion
```

---

## 4. Key Features & Design System

1. **Exact PWX Design Language**:
   - Matches the clean, modern aesthetic of PWX: slate backgrounds (`bg-slate-50`, `bg-white`), subtle borders (`border-slate-200`), indigo brand accents (`text-indigo-600`, `bg-indigo-50`), and status badges.
2. **KaTeX Mathematical Typesetting**:
   - MathML and LaTeX expressions in questions, options, and explanations are sanitized and auto-rendered via `renderMathInElement` with delimiters (`$$`, `\[`, `\(`, `$`).
3. **Multi-Subject Chapter Picking**:
   - Supports selecting chapters across multiple subjects simultaneously with isolated *Select all* and *Clear* controls.
4. **Custom Distribution & Allocation Modes**:
   - Select 5 to 100 questions per set with quick presets, slider, or number input.
   - Choose between **Equal Split** across selected subjects or **Custom Steppers** per subject.
5. **Exam Pressure Timers**:
   - Configurable per-question countdowns (No limit, 60s, 120s, 180s) with auto-advance and pacing analysis.
6. **Challenge Sharing**:
   - Generates persistent share codes (`?test=code`) allowing students to challenge peers to the exact same question set.
7. **Interactive Results & Review Experience**:
   - Full-width (`max-w-4xl`) completion canvas with motivational accuracy tier badges (Outstanding >=80%, Good Effort 50-79%, Keep Practising <50%).
   - Semantic metrics dashboard (Score, Accuracy gauge, Total Time, Avg Pace, Correct, Incorrect, Skipped).
   - Color-coded question jump palette with target card focus highlighting, auto-filter reset, and smooth scroll.
   - Interactive review filter tabs (All, Correct, Incorrect, Skipped) with celebration and encouraging empty states.
   - Solution cards displaying all 4 KaTeX-rendered options with user choice vs correct answer highlights, full comprehension passage context, numerical value comparisons, detailed step-by-step explanations, in-page YouTube video solution popup player (with backdrop blur, auto-play, and escape-key dismissal), and sticky back-to-top navigation.


---

## 5. Development & Operations

### Install Dependencies
```bash
cd /root/practice-wegenz
pnpm install
```

### Run Local Development Server (Port 5100)
```bash
pnpm run dev
```

### Typecheck
```bash
pnpm run typecheck
```

### Production Build
```bash
pnpm run build
```

### Fire PM Service Management
The application is registered as a managed system service under Fire PM:
```bash
fire start /root/practice-wegenz/start.js --name practice-wegenz
fire info practice-wegenz
fire restart practice-wegenz
fire logs practice-wegenz
```

### Fire Tunnel
To expose port 5100 publicly over an HTTPS reverse proxy tunnel:
```bash
fire tunnel open 5100
fire tunnel list
fire tunnel close 5100
```
### Production Domain & Nginx Hosting
The project is hosted on `practice.wegenz.in` and `mock.wegenz.in` via Nginx reverse proxy to port 5100:
- Practice Config: `/etc/nginx/sites-available/practice.wegenz.in.conf`
- Mock Config: `/etc/nginx/sites-available/mock.wegenz.in.conf`
- PWX Config: `/etc/nginx/sites-available/pw.wegenz.in.conf` (proxies to port 5000)
- All virtual hosts listen on Port 80 (HTTP) & Port 443 (SSL)
- Reload command: `systemctl reload nginx`
- Cloudflare DNS:
  - `practice` A record -> `<your-vps-ip>` (Proxied)
  - `mock` A record -> `<your-vps-ip>` (Proxied)
  - `pw` A record -> `<your-vps-ip>` (Proxied)

---

## 6. Guidelines for AI Agents

* Always prefer `pnpm` over `npm` or `yarn`.
* Keep `AGENT.md` up-to-date when modifying architecture or routes.
* Do not introduce heavy dependencies when standard React or browser APIs suffice.
* Always test build and typecheck before completing tasks.

