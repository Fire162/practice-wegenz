# Infinite Practice Wegenz (`mock.wegenz.in`) — Developer & AI Agent Guide

## 1. Project Overview
**Infinite Practice Wegenz** (`mock.wegenz.in`) is an educational question practice and evaluation platform by **Fire162**, built with **Flutter** and **Material 3**.

A single unified Dart codebase powers both:
1. **Web application**: deployed to `mock.wegenz.in` and `practice.wegenz.in`.
2. **Android application**: release APKs built via Flutter and Android SDK 36.

It provides practice sessions across 170,000+ JEE and NEET questions across 208 chapters, powered by a local PYQ microservice with instant local scoring (+4/-1), per-question countdown timers, math/LaTeX formula rendering via `flutter_math_fork`, and video solutions.

---

## 2. Architecture & Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    mock.wegenz.in                           │
│        (Cloudflare Edge Proxy & SSL -> Port 443)            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Nginx Virtual Host                    │
│        (/etc/nginx/sites-available/mock.wegenz.in.conf)     │
└──────────────┬──────────────────────────────┬───────────────┘
               │ (Port 5100 / Flutter Web)    │ (/api/* -> Port 8085)
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Flutter Web Client      │ │    Local PYQ Microservice  │
│   (Material 3 + Provider)    │ │ (170k+ questions, 208 chs) │
│   - Batch Track Selection    │ │ - Manifest & Categories    │
│   - Multi-Subject Chapters   │ │ - Filtered Random Sets     │
│   - Live Timer & Math Room   │ │ - Challenge Code Sharing   │
│   - Instant Scoring (+4/-1)  │ └────────────────────────────┘
└──────────────────────────────┘
```

---

## 3. Directory Structure

```
practice-wegenz/
├── .github/
│   └── workflows/
│       └── flutter-build.yml  # GitHub Actions CI/CD workflow (Web & APK builds)
├── android/                   # Android native wrapper & Gradle build configs
├── build/                     # Compiled outputs (Web & Android APK)
├── lib/
│   ├── constants/
│   │   └── constants.dart     # Batch tracks & encrypted subject tokens
│   ├── models/
│   │   └── models.dart        # Data models, question schemas, test reports
│   ├── providers/
│   │   ├── practice_provider.dart # Filters, chapter selection & question fetching
│   │   └── quiz_provider.dart     # Active test room state, timer, scoring & review
│   ├── screens/
│   │   ├── home_screen.dart           # Landing screen with batch track cards
│   │   ├── practice_setup_screen.dart # Stepper for subjects, chapters & timers
│   │   ├── test_room_screen.dart      # Live CBT test room with question palette
│   │   └── result_screen.dart         # Scorecard, accuracy, breakdown & review
│   ├── services/
│   │   └── api_service.dart   # REST client (/api/subjects, /api/random, etc.)
│   ├── theme/
│   │   └── app_theme.dart     # Material 3 Indigo (#4F46E5) theme & typography
│   ├── widgets/
│   │   └── math_formula_view.dart # Math/LaTeX rendering with flutter_math_fork
│   └── main.dart              # App entry point with MultiProvider setup
├── test/
│   └── quiz_provider_and_models_test.dart # Unit tests for models & scoring
├── web/                       # Web entry shell and manifest
├── legacy-react/              # Preserved archive of initial React prototype
├── pubspec.yaml               # Flutter package configuration & dependencies
├── AGENT.md                   # AI Agent & developer guide (this file)
└── CHANGELOG.md               # Keep a Changelog releases log
```

---

## 4. Key Features & Design System

1. **Material 3 Design System**:
   - Modern Material 3 UI with Indigo primary seed (`#4F46E5`), custom card themes, dialog themes, and Google Fonts Inter.
2. **Formula Typesetting**:
   - High-fidelity LaTeX and mathematical formula rendering powered by `flutter_math_fork` with AES proxy image fallback for encrypted tokens.
3. **Multi-Subject Chapter Picking**:
   - Stepper selection across Physics, Chemistry, and Mathematics/Biology with individual subject expansion and selection counters.
4. **Flexible Test Modes**:
   - Customizable question counts (5 to 100) and configurable question timers (No limit, 60s, 120s, 180s) with live countdown pills.
5. **CBT Scoring Engine**:
   - Standard competitive exam marking: +4 for correct, -1 for incorrect, 0 for skipped.
   - Numerical question evaluation with floating-point tolerance (±0.001).
6. **Challenge Sharing**:
   - Persistent share codes via `?test=<code>` for challenge links copied to clipboard.
7. **Cross-Platform Support**:
   - Unified codebase building responsive Web layouts and Android release APKs.

---

## 5. Development & Operations

### Analyze Code
```bash
flutter analyze
```

### Run Unit Tests
```bash
flutter test
```

### Build Flutter Web (Release)
```bash
flutter build web --release
```

### Build Android APK (Release)
```bash
export ANDROID_HOME=/usr/local/share/android-sdk
flutter build apk --release
```
Output path: `build/app/outputs/flutter-apk/app-release.apk`

### Deployment to VPS
1. Flutter Web release output is placed in `/root/practice-wegenz/dist`.
2. Fire PM manages the web preview server on port 5100:
```bash
fire restart practice-wegenz
fire info practice-wegenz
```
3. Nginx serves the traffic from `mock.wegenz.in` and `practice.wegenz.in` by proxying to port 5100.
   - Cloudflare DNS points to VPS: `<your-vps-ip>`.

---

## 6. Guidelines for AI Agents

* Always run `flutter analyze` and `flutter test` before submitting changes.
* Ensure 0 errors and 0 warnings.
* Keep `AGENT.md` and `CHANGELOG.md` up to date with any architecture changes.
* Maintain IP privacy guidelines: never hardcode or commit host IP addresses.
