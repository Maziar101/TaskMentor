# TaskMentor

Frontend is a React + TypeScript + Vite app. Backend lives in `server/` (Express + MongoDB).

## Backend (Express + MongoDB)

1) Copy the example env and set your Mongo connection string:
```bash
cp server/.env.example server/.env
```
Update `MONGO_URI` if you are not using the default local MongoDB port.

2) Install backend dependencies:
```bash
cd server
npm install
```

3) Run the API server (defaults to port 4000):
```bash
npm run dev   # with nodemon
# or
npm start
```

Endpoints:
- `GET /api/health` – health check
- `POST /api/auth/login` – login with `{ username, phone }` (returns `{ userId, username, subscription }`)
- `GET /api/users` – list users
- `POST /api/users` – create user `{ username, phone, age?, gender?, workField?, subscription? }`
- `GET /api/users/:id` – get user
- `PATCH /api/users/:id` – update user
- `DELETE /api/users/:id` – delete user
- `GET /api/pool?userId=...` – list backlog tasks for a user
- `POST /api/pool` – create backlog task `{ title, tag?, userId }`
- `DELETE /api/pool/:id?userId=...` – delete backlog task
- `GET /api/schedule/:day?userId=...` – list scheduled items for a day (YYYY-MM-DD) for a user
- `POST /api/schedule` – create scheduled item `{ title, day, hour, tag?, done?, userId }`
- `PATCH /api/schedule/:id` – update scheduled item (include `userId`)
- `DELETE /api/schedule/:id?userId=...` – delete scheduled item

## Frontend (React + Vite)

Install and run:
```bash
npm install
npm run dev
```
