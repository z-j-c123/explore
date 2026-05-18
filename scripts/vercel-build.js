const { execSync } = require('node:child_process');

// 未配置 DIRECT_URL 时，迁移回退使用 DATABASE_URL（Neon 直连地址）
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL is not set on Vercel.');
  process.exit(1);
}

execSync('npx prisma generate', { stdio: 'inherit' });
execSync('npx prisma migrate deploy', { stdio: 'inherit' });
execSync('npx nest build', { stdio: 'inherit' });
