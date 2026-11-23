import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const files = async dir => (await Promise.all((await readdir(dir, { withFileTypes: true })).map(entry =>
  entry.isDirectory() ? files(path.join(dir, entry.name)) : path.join(dir, entry.name)))).flat();
const sourceFiles = (await files(root)).filter(file => /\.(?:js|jsx|mjs)$/.test(file));
const issues = [];
const exists = async file => { try { return (await stat(file)).isFile(); } catch { return false; } };

for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');
  const owner = path.relative(root, file).split(path.sep)[0];
  const imports = source.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g);
  for (const [, specifier] of imports) {
    if (!specifier.startsWith('.')) continue;
    const base = path.resolve(path.dirname(file), specifier);
    const candidates = [base, ...['.js', '.jsx', '.mjs', '.css', '.json'].map(extension => base + extension), path.join(base, 'index.js')];
    let target;
    for (const candidate of candidates) if (await exists(candidate)) { target = candidate; break; }
    const label = path.relative(root, file).replaceAll('\\', '/');
    if (!target) { issues.push(`${label}: unresolved ${specifier}`); continue; }
    const targetPath = path.relative(root, target).split(path.sep);
    if (owner === 'shared' && ['app', 'features', 'layouts'].includes(targetPath[0])) {
      issues.push(`${label}: shared must not depend on ${targetPath[0]}`);
    }
    if (owner === 'features' && ['app', 'layouts'].includes(targetPath[0])) {
      issues.push(`${label}: feature must not depend on ${targetPath[0]}`);
    }
    if (owner === 'features' && targetPath[0] === 'features' && targetPath.includes('pages')) {
      issues.push(`${label}: import a component/rule rather than a page`);
    }
  }
}
for (const legacy of ['pages', 'components', 'contexts', 'services', 'hooks', 'utils']) {
  if (sourceFiles.some(file => path.relative(root, file).startsWith(legacy + path.sep))) issues.push(`Legacy src/${legacy} directory remains`);
}
if (issues.length) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
} else console.log(`Structure OK: ${sourceFiles.length} source modules; imports resolve and app/feature/shared boundaries hold.`);
