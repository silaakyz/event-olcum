export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? 'Event OLCUM',
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@postgres:5432/app?schema=public',
};
