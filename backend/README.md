# Task Manager Backend (.NET)

Minimal ASP.NET Core Web API backend for the Task Manager app.

## Endpoints

- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`

Task model fields:
- `id` (string)
- `text` (string)
- `completed` (bool)
- `createdAt` (UTC datetime)

## Run

1. Ensure .NET 10 SDK is installed.
2. From `backend` folder:
   - `dotnet restore`
   - `dotnet run`
3. API base URL:
   - `http://localhost:5000`
4. Swagger UI:
   - `http://localhost:5000/swagger`

## Frontend integration

The Nx React app at `apps/web` calls `http://localhost:5000/api/tasks` by default.
If you need a different URL, set `window.TASKS_API_URL` before the frontend app loads.
