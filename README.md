# asset_management_ver3

## Setup

### Requirements
- Node.js 20+
- Bun (for the web app)
- npm & Expo CLI (for the mobile app)
- PostgreSQL database
- Redis server

### Environment Variables
Create a `.env` file in each app directory with the following keys. Use the provided `.env.example` as a starting point and update the values for your environment.

#### Web app
- `DATABASE_URL` – PostgreSQL connection string. Example:
  `postgres://user:password@localhost:5432/asset_management`
  The web server logs a detailed message and exits during startup if this variable is missing.
- `AUTH_SECRET` – session secret for authentication.
- `AUTH_URL` – base URL used by auth callbacks.
- `REDIS_URL` – Redis connection string.
- `CORS_ORIGINS` – comma separated list of allowed origins.
- `NEXT_PUBLIC_PROJECT_GROUP_ID` – project group identifier shared with clients.
- `NEXT_PUBLIC_CREATE_BASE_URL` – base URL for Create API requests.
- `NEXT_PUBLIC_CREATE_HOST` – host name forwarded to the API.

#### Mobile app
- `EXPO_PUBLIC_PROJECT_GROUP_ID` – project group identifier used by the client.
- `EXPO_PUBLIC_BASE_URL` – base API URL.
- `EXPO_PUBLIC_PROXY_BASE_URL` – proxy used for auth flow.
- `EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY` – Uploadcare public key for file uploads.
- `EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL` – base URL for uploaded content.
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` – Google Maps key for map components.
- `EXPO_PUBLIC_HOST` – host name forwarded to the API.
- `EXPO_PUBLIC_LOGS_ENDPOINT` – optional endpoint for remote logs.

## Database Setup

This project uses [Prisma](https://www.prisma.io/) for managing PostgreSQL migrations and seeding.

### Database Initialization

Run the following command to deploy migrations and seed the database during environment setup:

```
bun run db:setup
```

The seed script populates sample companies, contacts, units and service logs.

### Test Accounts

The database seed also ensures default test users exist for authentication:

| Role        | Email                | Password     |
|-------------|---------------------|--------------|
| Admin       | admin@test.com       | password123  |
| Supervisor  | supervisor@test.com  | password123  |
| Teknisi     | teknisi@test.com     | password123  |
| Sales       | sales@test.com       | password123  |

## Running the Web App

```
cd _/apps/web
bun install
bun run dev
```

Runs the Vite/React dev server on `http://localhost:3000` by default. Use `bun run build` for production builds.

## Running the Mobile App

```
cd _/apps/mobile
npm install
npx expo start
```

This launches Expo for local development. Use `expo build` or `eas build` for production releases.
