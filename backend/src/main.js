import 'reflect-metadata';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (typeof process.loadEnvFile === 'function') {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(__dirname, '..', '..', '.env')
  ];
  for (const envPath of envCandidates) {
    try {
      if (fs.existsSync(envPath)) {
        process.loadEnvFile(envPath);
        break;
      }
    } catch {}
  }
}

await import('./master-server.js');

