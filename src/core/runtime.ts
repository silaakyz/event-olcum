export type RuntimeStatus = {
  status: 'ok';
  databaseHost: string;
  environment: string;
};

export function getRuntimeStatus(): RuntimeStatus {
  const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@postgres:5432/app?schema=public';
  const host = databaseUrl.includes('@') ? databaseUrl.split('@')[1].split(':')[0] : 'postgres';

  return {
    status: 'ok',
    databaseHost: host,
    environment: process.env.NODE_ENV ?? 'production',
  };
}
