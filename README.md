# Event OLCUM

Survey Intelligence platform built with Next.js App Router. Survey data is stored locally in the browser; no database or required environment variables are needed for the application to start.

## Docker

Build the production image:

```bash
docker build -t event-olcum .
```

Run it locally:

```bash
docker run --rm -p 3000:3000 event-olcum
```

Open `http://localhost:3000/dashboard`.

## Render Deployment

1. Create a new Render Web Service and connect `silaakyz/event-olcum`.
2. Select the Docker runtime; Render detects the root `Dockerfile`.
3. Deploy with the default branch. Render supplies the `PORT` environment variable; the container defaults to `3000` for local use.

No database, authentication, or additional environment variables are required. The Docker runtime uses Next.js standalone output (`node server.js`); the local production script remains `npm start`.

## Verification

```bash
npm run build
docker build -t event-olcum .
docker run --rm -p 3000:3000 event-olcum
```