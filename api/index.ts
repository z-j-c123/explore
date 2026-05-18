import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../dist/create-app';

let app: Awaited<ReturnType<typeof createApp>> | undefined;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await createApp();
  }
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
}
