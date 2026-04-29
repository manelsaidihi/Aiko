# Aiko Project - Deployment Guide

This guide explains how to deploy the Aiko project to [Railway](https://railway.app).

## Deployment Steps

1. **Create a Railway Project**:
   - Go to [Railway.app](https://railway.app) and create a new project.
   - Connect your GitHub repository.

2. **Add a PostgreSQL Database**:
   - In your Railway project, click "Add Service" and select "Database" -> "PostgreSQL".
   - Railway will automatically provide a `DATABASE_URL`.

3. **Configure Environment Variables**:
   - Go to the "Variables" tab of your web service in Railway.
   - Add the following variables:
     - `DATABASE_URL`: (Automatically provided if you added PostgreSQL).
     - `JWT_SECRET`: A random string (32+ characters recommended).
     - `GEMINI_API_KEY`: Your Google Gemini API key.
     - `NODE_ENV`: `production`
     - `ALLOWED_ORIGINS`: `https://your-app-name.up.railway.app` (Replace with your actual Railway URL).

4. **Deploy**:
   - Railway will detect the `railway.json` and `Procfile` and start the build process.
   - The build process runs `npm run build:full`, which includes generating the Prisma client and building both the frontend and backend.

## Database Management after Deployment

Once the app is deployed, you need to run migrations to set up your database schema. You can do this via the Railway CLI or by adding a temporary post-install script.

**Using Railway CLI:**
```bash
railway run npx prisma migrate deploy
```

## Health Check

You can verify that the server is running correctly by visiting:
`https://your-app-name.up.railway.app/api/health`

It should return:
```json
{ "status": "ok", "service": "Aiko" }
```

## Environment Variables Reference

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `GEMINI_API_KEY` | API key for AI services |
| `NODE_ENV` | Set to `production` for optimized builds |
| `PORT` | The port the server listens on (handled by Railway) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |
