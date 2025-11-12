# target-clicker-223414-223423

This workspace contains the Click Quest frontend and a paired backend (in a sibling workspace).

- Frontend (React): target-clicker-223414-223423/click_quest_frontend
  - Dev: http://localhost:3000
  - Env: see click_quest_frontend/.env.example
- Backend: target-clicker-223414-223424/backend (see sibling workspace)
  - Dev: http://localhost:3001
  - Env: APP_CORS_ALLOWED_ORIGINS should include http://localhost:3000

Integration:
1) Start backend on 3001 and verify http://localhost:3001/api/health
2) Set REACT_APP_API_BASE=http://localhost:3001 in the frontend .env
3) Start frontend on 3000 and use the app