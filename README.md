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
- `GET /api/pool` – list backlog tasks
- `POST /api/pool` – create backlog task `{ title, tag? }`
- `DELETE /api/pool/:id` – delete backlog task
- `GET /api/schedule/:day` – list scheduled items for a day (YYYY-MM-DD)
- `POST /api/schedule` – create scheduled item `{ title, day, hour, tag?, done? }`
- `PATCH /api/schedule/:id` – update scheduled item
- `DELETE /api/schedule/:id` – delete scheduled item

## Frontend (React + Vite)

Install and run:
```bash
npm install
npm run dev
```
