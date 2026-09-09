# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-09-09 16:07 IST

### Added
* Unified Flutter with Material 3 architecture supporting both Web (`mock.wegenz.in`) and Android release APK from a single Dart codebase.
* Provider-driven reactive state management for batch track selection, chapter filters, live test countdowns, scoring, and review navigation.
* Math and LaTeX formula typesetting engine powered by `flutter_math_fork` with fallback image rendering.
* Automated Android release build pipeline generating signed release APKs (`build/app/outputs/flutter-apk/app-release.apk`).
* GitHub Actions CI/CD workflow (`.github/workflows/flutter-build.yml`) automating Flutter Web and Android APK builds on push and pull requests.
* Unit test suite (`test/quiz_provider_and_models_test.dart`) covering JSON deserialization, +4/-1 scoring accuracy, numerical tolerance, and test navigation.

### Changed
* Migrated from legacy React 19/Vite web application to a unified Flutter 3.47 multiplatform client.
* Standardized scoring engine with +4 marks for correct, -1 for incorrect, and 0 for skipped questions.

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
