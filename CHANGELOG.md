# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
* Schema.org `FAQPage` JSON-LD structured data in `index.html` for Google search rich snippet eligibility.
* Crawlable semantic `<noscript>` fallback HTML inside `#root` featuring structured headings and direct internal links to all JEE and NEET practice tracks.
* Dedicated semantic FAQ knowledge base on `home.tsx` targeting student search queries for chapterwise JEE and NEET practice.

### Changed
* Refined product positioning across `index.html` and `src/pages/home.tsx` to focus on **Sample Questions, Infinite Practice Drills, Challenge Codes, and Timed CBT Mock Tests** (distinct from the dedicated PYQ archive on `pyqs.wegenz.in`).
* Optimized page titles, `<h1>` headings, and meta descriptions across `index.html`, `home.tsx`, and `practice.tsx` to align with high-intent search queries (`JEE PYQs`, `JEE Practice Engine`, `Sample Questions`, `Chapterwise PYQs`).
* Updated `public/sitemap.xml` timestamps to `2026-09-17`.
* Statically imported `Home` component in `App.tsx` to eliminate initial loading spinner waterfall on root path.
* Replaced Dash video player with a lightweight stream link fallback in `practice.tsx`.
* Removed redundant KaTeX CSS preload link from `index.html`.
* Targeted modern `es2022` JavaScript in `vite.config.ts`.

### Fixed
* Removed static root canonical tag (`<link rel="canonical" href="https://wegenz.in/" />`) from `index.html` to prevent crawlers from misattributing `/practice/*` subpages prior to client hydration.
* Initiated Google Search Console validation for queued practice routes (`11th_JEE`, `12th_JEE`, `12th_NEET`).
* Resolved empty solution evaluation and zero-score fallback when submitting tests started from saved bookmarks or shared test codes ([#3](https://github.com/Fire162/practice-wegenz/pull/3)).

### Removed
* Uninstalled `dashjs` video player dependency, removing 860 KiB of unused player code.

### Added
* Route-level code-splitting with `React.lazy()` and `Suspense`, dropping initial landing page bundle size from ~814 kB to ~241 kB total (~9.2 kB homepage chunk, ~70% reduction) ([#10](https://github.com/Fire162/practice-wegenz/pull/10)).
* Progressive Web App (PWA) manifest (`manifest.webmanifest`) enabling standalone homescreen installation on mobile and desktop ([#10](https://github.com/Fire162/practice-wegenz/pull/10)).
* Offline-resilient service worker (`sw.js`) with app shell caching, cache-first for hashed Vite assets/fonts, and network-first with graceful offline fallback for API requests ([#10](https://github.com/Fire162/practice-wegenz/pull/10)).
* Full-featured Dark Mode theme with localStorage persistence (`wegenz_theme_v1`), anti-flash inline boot script, and system preference (`prefers-color-scheme`) synchronization ([#8](https://github.com/Fire162/practice-wegenz/pull/8)).
* Accessible `ThemeToggle` button in the header across the homepage and infinite practice test rooms.
* High-contrast dark styling for KaTeX mathematical and chemical expressions, code blocks, question canvases, jump palettes, and completion dashboards.
* Animated live 'All Systems Operational' status badge in the header with pulsing radar-ring indicator ([#6](https://github.com/Fire162/practice-wegenz/pull/6), [#7](https://github.com/Fire162/practice-wegenz/pull/7)).
* Saved Bookmarks Vault modal with subject filtering, search, step-by-step KaTeX explanations, and direct practice session launcher.
* Dual practice modes: Exam Mode (standard flow) and Quiz Mode (instant KaTeX explanations, inline video popups, and +4/-1 answer feedback).
* Smart keyboard navigation (`ArrowLeft`/`ArrowRight`, `ArrowUp`/`ArrowDown`, `1, 2, 3, 4`, and `B` for bookmark) with active input protection.
* Exam vs. Quiz mode selector directly inside the Saved Bookmarks Hub.

## [1.1.0] - 2026-09-09 17:40 IST

### Added
* Continuous integration GitHub Actions workflow (`.github/workflows/ci.yml`) automating build verification and artifact generation.

### Security
* Hardened subject icon proxy using opaque AES-256 encrypted tokens (`/api/img/:token`) to obscure internal asset origin URLs.
* Configured 50MB payload limits across Nginx and microservice body parsers to prevent HTTP 413 errors on large practice sets.

## [1.0.0] - 2026-09-08 23:06 IST

### Added
* Standalone Infinite Practice web application built with React 19, Vite, and Tailwind CSS v4.
* Comprehensive question dataset integration supporting 170,000+ past year questions for JEE and NEET across Class 11 and 12 tracks.
* KaTeX auto-rendering engine with math and chemical formula delimiters for questions, answer options, and step-by-step solutions.
* Multi-subject chapter selector supporting simultaneous selection across Physics, Chemistry, and Mathematics/Biology.
* Configurable test generation with flexible sizes (5 to 100 questions) and equal or custom per-subject allocation steppers.
* CBT exam countdown timers (60s, 120s, 180s, unlimited) with pacing analytics and auto-submit.
* Redesigned completion dashboard featuring motivational accuracy tier badges, detailed scoring (+4 / -1 / 0), and an interactive question jump palette with target focus animations.
* Filter tabs for post-test error review (`All`, `Correct`, `Incorrect`, `Skipped`) with encouraging empty states.
* In-page video solution popup modal supporting YouTube embeds (`youtube-nocookie.com`) and MPEG-DASH streams (`dashjs`) with CloudFront signed token diagnostics.
* Challenge sharing with persistent test codes via URL query parameters (`?test=<code>`).
* Production deployment support for Fire PM service management and Nginx virtual host reverse proxy on `practice.wegenz.in` and `mock.wegenz.in`.
