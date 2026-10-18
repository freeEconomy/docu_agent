import { cpSync, existsSync } from 'node:fs';
import path from 'node:path';
const root = process.cwd();
cpSync(path.join(root, '.next/static'), path.join(root, '.next/standalone/.next/static'), {
  recursive: true,
});
if (existsSync(path.join(root, 'public')))
  cpSync(path.join(root, 'public'), path.join(root, '.next/standalone/public'), {
    recursive: true,
  });
