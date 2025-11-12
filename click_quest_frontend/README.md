# Click Quest Frontend (React)

A lightweight, responsive browser game where players click moving targets to score as many points as possible within 30 seconds.

## Screens
- Start: Title and Play button
- Game: Top bar with score and timer, animated targets within the play area
- End: Final score, submit name to backend, leaderboard (top 10)

## Environment Variables

Create a `.env` file (or set env vars) based on `.env.example`:

- REACT_APP_API_BASE: Preferred backend base URL (e.g., http://localhost:3001)
- REACT_APP_BACKEND_URL: Fallback backend URL (used if REACT_APP_API_BASE not set)
- REACT_APP_FRONTEND_URL: Public URL of the frontend (optional)
- REACT_APP_WS_URL: Reserved for future features (not used)
- REACT_APP_NODE_ENV, REACT_APP_ENABLE_SOURCE_MAPS, REACT_APP_PORT, REACT_APP_TRUST_PROXY, REACT_APP_LOG_LEVEL, REACT_APP_HEALTHCHECK_PATH, REACT_APP_FEATURE_FLAGS, REACT_APP_EXPERIMENTS_ENABLED: Optional build/runtime flags

The frontend uses REACT_APP_API_BASE or REACT_APP_BACKEND_URL to call:
- GET /api/leaderboard?limit=10
- POST /api/scores

## Run Locally

Install dependencies and start:

```
npm install
npm start
```

- App: http://localhost:3000
- Ensure your backend is running and accessible at REACT_APP_API_BASE (default http://localhost:3001).

## Build

```
npm run build
```

Outputs production build to `build/`.

## Accessibility

- Focus management when changing screens
- ARIA labels for interactive regions
- Sufficient color contrast with Ocean Professional theme
- Respects `prefers-reduced-motion` for animations

## Code Structure

- `src/App.js`: screen orchestration and theme toggle
- `src/api.js`: REST calls (safe fetch with timeout and error handling)
- `src/components/StartScreen.js`: start screen
- `src/components/GameScreen.js`: gameplay loop and targets
- `src/components/EndScreen.js`: score submission and leaderboard
- `src/components/Target.js`: target rendering and hit animation
- `src/App.css` + `src/index.css`: theme & responsive styles

## Security Notes

- No secrets in code. Configure URLs via env vars.
- Avoid logging sensitive data; user inputs are validated client-side before submission.
