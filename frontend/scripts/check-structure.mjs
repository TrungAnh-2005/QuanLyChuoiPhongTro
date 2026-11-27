import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const files = async dir => (await Promise.all((await readdir(dir, { withFileTypes: true })).map(entry =>
  entry.isDirectory() ? files(path.join(dir, entry.name)) : path.join(dir, entry.name)))).flat();
const sourceFiles = (await files(root)).filter(file => /\.(?:js|jsx|mjs)$/.test(file));
const issues = [];
const exists = async file => { try { return (await stat(file)).isFile(); } catch { return false; } };
const legacyRoots = ['pages', 'contexts', 'services', 'hooks', 'utils', 'layouts'];

function layerFor(parts) {
  const [directory, group] = parts;
  if (directory !== 'components') return directory;
  return ['app', 'layouts', 'shared'].includes(group) ? group : 'features';
}

for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');
  const relativePath = path.relative(root, file);
  const label = relativePath.split(path.sep).join('/');
  const parts = relativePath.split(path.sep);
  const [directory, group] = parts;
  const owner = layerFor(parts);
  if (legacyRoots.includes(directory)) {
    issues.push(`${label}: legacy src/${directory} directory remains`);
  }
  if ((directory === 'app' && group === 'components')
    || (directory === 'features' && parts[2] === 'components')
    || (directory === 'shared' && group === 'ui')) {
    issues.push(`${label}: use src/components for component modules`);
  }
  if (directory === 'components' && parts.length < 3) {
    issues.push(`${label}: place the component in its group under src/components`);
  }
  const imports = source.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g);
  for (const [, specifier] of imports) {
    if (!specifier.startsWith('.')) continue;
    const base = path.resolve(path.dirname(file), specifier);
    const candidates = [base, ...['.js', '.jsx', '.mjs', '.css', '.json'].map(extension => base + extension), path.join(base, 'index.js')];
    let target;
    for (const candidate of candidates) if (await exists(candidate)) { target = candidate; break; }
    if (!target) { issues.push(`${label}: unresolved ${specifier}`); continue; }
    const targetPath = path.relative(root, target).split(path.sep);
    const targetLayer = layerFor(targetPath);
    if (owner === 'shared' && ['app', 'features', 'layouts'].includes(targetLayer)) {
      issues.push(`${label}: shared must not depend on ${targetLayer}`);
    }
    if (owner === 'features' && ['app', 'layouts'].includes(targetLayer)) {
      issues.push(`${label}: feature must not depend on ${targetLayer}`);
    }
    if (owner === 'features' && targetPath[0] === 'features' && targetPath.includes('pages')) {
      issues.push(`${label}: import a component/rule rather than a page`);
    }
  }
}
if (issues.length) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
} else console.log(`Structure OK: ${sourceFiles.length} source modules; imports resolve and app/feature/shared boundaries hold.`);
