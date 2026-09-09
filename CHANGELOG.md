# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
