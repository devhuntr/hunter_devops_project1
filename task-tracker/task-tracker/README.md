# Daymark Task Tracker

A simple, responsive task tracker built with the **same technology stack as the supplied Node Bulletin Board**: Node.js, Express, Vue.js 1, vue-resource, and Bootstrap 3. The UI uses regular HTML and CSS; no build step is required.

## Run locally

1. Install **Node.js 18 or newer**.
2. In a terminal, open this `task-tracker` folder.
3. Run `npm install`.
4. Run `npm start`.
5. Open **http://localhost:8080** in your browser.

Set `PORT` to change the default port (for example, `PORT=3000 npm start` on macOS/Linux or `$env:PORT=3000; npm start` in PowerShell).

## Testing

Unit tests use [Jest](https://jestjs.io/) (with [supertest](https://github.com/ladjs/supertest) for the API routes) and live in `tests/`, mirroring the source layout:

- `tests/server.test.js` — Express routes, validation, error handling
- `tests/backend/tasks.test.js` — JSON file storage
- `tests/public/app.test.js` — Vue component logic (Vue is stubbed, no browser needed)

Run `npm test`. Coverage is collected on every run (report in `coverage/`) and the run fails if global coverage drops below 80%. Tests write to a temporary file via the `TASKS_FILE` environment variable, so `data/tasks.json` is never touched.

## Features

- Add a task (1–160 characters).
- Mark a task complete or incomplete.
- Delete a task.
- Filter tasks by All, Active, or Done.
- View progress and remaining task count.
- Persist tasks on the server in `data/tasks.json` across restarts.
- Mobile-friendly interface.

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create a task with `{ "title": "..." }` |
| PATCH | `/api/tasks/:id` | Update with `{ "completed": true }` or `false` |
| DELETE | `/api/tasks/:id` | Delete a task |

Data is stored in a local JSON file. This is suitable for a simple single-server demo, not a production multi-user application. No login or separate user accounts are included.

## Project layout

- `server.js` — Express server and REST API routes
- `backend/tasks.js` — JSON file task storage
- `data/tasks.json` — persisted tasks
- `public/index.html` — Vue template
- `public/app.js` — Vue 1 UI logic
- `public/site.css` — styling
- `tests/` — Jest unit tests

The original sample uses legacy Vue 1 and vue-resource; this project intentionally preserves those technologies for stack compatibility.
