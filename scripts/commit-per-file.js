const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' });
}

function safeRun(cmd) {
  try {
    return run(cmd);
  } catch (e) {
    return '';
  }
}

function getStatus() {
  return safeRun('git --no-pager status --porcelain');
}

function parseStatus(status) {
  const lines = status.split('\n').filter(Boolean);
  const newFiles = [];
  const modifiedFiles = [];
  for (const line of lines) {
    const code = line.slice(0, 2);
    let file = line.slice(3).trim();
    file = file.replace(/\\/g, '/');
    if (code.startsWith('D') || code.endsWith('D') || code.startsWith('R') || code.endsWith('R')) continue;
    if (code === '??') newFiles.push(file);
    else modifiedFiles.push(file);
  }
  return { newFiles, modifiedFiles };
}

function shouldSkip(file) {
  const base = path.basename(file).toLowerCase();
  if (base === '.env' || base === '.env.local' || base.endsWith('.env') || base.endsWith('.env.local')) return true;
  if (file.startsWith('node_modules/')) return true;
  if (base === '.ds_store') return true;
  return false;
}

function describeFile(file) {
  const base = path.basename(file);
  if (file.startsWith('assets/')) return `static asset: ${base}`;
  if (file.startsWith('supabase/migrations/')) return `database migration: ${base}`;
  if (file.startsWith('supabase/')) return `Supabase configuration: ${base}`;
  if (file.startsWith('src/components/ui/')) return `UI component: ${base}`;
  if (file.startsWith('src/components/forms/')) return `form component: ${base}`;
  if (file.startsWith('src/components/cards/')) return `card component: ${base}`;
  if (file.startsWith('src/components/charts/')) return `chart component: ${base}`;
  if (file.startsWith('src/app/')) {
    if (file.startsWith('src/app/(tabs)/')) return `tabs screen component: ${base}`;
    if (file.startsWith('src/app/(auth)/')) return `auth screen component: ${base}`;
    return `app route component: ${base}`;
  }
  if (file.startsWith('src/hooks/')) return `React hook: ${base}`;
  if (file.startsWith('src/lib/')) return `application library utility: ${base}`;
  if (file.startsWith('src/store/')) return `state store: ${base}`;
  if (file.startsWith('src/types/')) return `type definitions: ${base}`;
  if (base === 'README.md') return 'project documentation';
  if (base === 'package.json') return 'package manifest';
  if (base === 'tsconfig.json') return 'TypeScript configuration';
  if (base === 'babel.config.js') return 'Babel configuration';
  if (base === 'metro.config.js') return 'Metro bundler configuration';
  if (base === 'app.json') return 'Expo app configuration';
  if (base.endsWith('.md')) return `documentation: ${base}`;
  if (base.endsWith('.sql')) return `database script: ${base}`;
  if (base === '.env' || base === '.env.local' || base.endsWith('.env') || base.endsWith('.env.local')) return `environment variables: ${base}`;
  return base;
}

function prefixForModified(file) {
  const base = path.basename(file);
  if (base === 'README.md' || base.endsWith('.md')) return 'docs';
  if (base === 'package.json' || base === 'tsconfig.json' || base === 'babel.config.js' || base === 'metro.config.js' || base === 'app.json' || file.startsWith('supabase/')) return 'chore';
  if (file.startsWith('src/')) return 'refactor';
  return 'chore';
}

function loadIntentMap() {
  const p = path.join(process.cwd(), 'scripts', 'commit-intent.json');
  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
  } catch (_) {}
  return {};
}

function commitFile(file, kind) {
  const intentMap = loadIntentMap();
  const intent = intentMap[file];
  const defaultDesc = describeFile(file);
  const desc = intent && intent.description ? intent.description : defaultDesc;
  const defaultPrefix = kind === 'new' ? 'feat: add' : `${prefixForModified(file)}: update`;
  const prefix = intent && intent.prefix ? intent.prefix : defaultPrefix;
  const msg = `${prefix} ${desc}`;
  run(`git add -- "${file}"`);
  run(`git commit -m "${msg.replace(/"/g, '\\"')}" -- "${file}"`);
  process.stdout.write(`Committed: ${file} -> ${msg}\n`);
}

function main() {
  const status = getStatus();
  if (!status.trim()) {
    console.log('No changes to commit.');
    return;
  }
  const { newFiles, modifiedFiles } = parseStatus(status);
  for (const f of newFiles) {
    if (shouldSkip(f)) { console.log(`Skipping ${f}`); continue; }
    commitFile(f, 'new');
  }
  for (const f of modifiedFiles) {
    if (shouldSkip(f)) { console.log(`Skipping ${f}`); continue; }
    commitFile(f, 'modified');
  }
  console.log('Done committing files individually.');
}

main();
