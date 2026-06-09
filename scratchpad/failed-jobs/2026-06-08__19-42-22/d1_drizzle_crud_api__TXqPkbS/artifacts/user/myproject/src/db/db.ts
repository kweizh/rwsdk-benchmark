import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import { env } from 'cloudflare:workers';

export function getDb() {
  return drizzle((env as any).DB, { schema });
}
