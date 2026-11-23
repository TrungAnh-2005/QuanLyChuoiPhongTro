import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const root = fileURLToPath(new URL('../', import.meta.url));
const composeFile = path.join(root, 'docker-compose.infra.yml');
const services = [
  // Preserve the existing standalone database and its volume when present.
  { service: 'mysql', port: '3306/tcp', names: ['rental_property_management', 'rental-mysql'], image: /(?:^|\/)mysql(?::|@|$)/, probe: ['mysqladmin', 'ping', '-h', '127.0.0.1', '--silent'] },
  { service: 'rabbitmq', port: '5672/tcp', names: ['rental-rabbitmq'], image: /(?:^|\/)rabbitmq(?::|@|$)/, probe: ['rabbitmq-diagnostics', '-q', 'ping'] },
];

function configuredEndpoints() {
  let text = '';
  try { text = readFileSync(path.join(root, '.env'), 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const value = (key, fallback) => {
    if (process.env[key]) return process.env[key];
    const raw = text.match(new RegExp(`^(?:export\\s+)?${key}\\s*=\\s*(.*?)\\s*$`, 'm'))?.[1];
    if (!raw) return fallback;
    return raw.startsWith('"') || raw.startsWith("'") ? raw.slice(1, raw.indexOf(raw[0], 1)) : raw.split('#')[0].trim();
  };
  return {
    mysql: { host: value('MYSQL_HOST', 'localhost'), port: Number(value('MYSQL_PORT', '3306')) },
    rabbitmq: { host: value('RABBITMQ_HOST', 'localhost'), port: Number(value('RABBITMQ_PORT', '5672')) },
  };
}

function matchesEndpoint(container, config, endpoint) {
  return (container.ports?.[config.port] || []).some(binding => Number(binding.HostPort) === endpoint.port
    && ['', '0.0.0.0', '::', '127.0.0.1', '::1'].includes(binding.HostIp || ''));
}

function runDocker(args, { output = false } = {}) {
  const result = spawnSync('docker', args, {
    cwd: root, encoding: 'utf8', stdio: output ? 'inherit' : 'pipe',
    timeout: output ? 300000 : 15000,
  });
  return { status: result.status ?? 1, stdout: result.stdout || '', stderr: result.stderr || result.error?.message || '' };
}

export async function ensureInfrastructure({
  docker = runDocker, log = console.log,
  now = Date.now, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  timeoutMs = 180000, pollMs = 2000,
  endpoints = configuredEndpoints(),
} = {}) {
  for (const config of services) {
    const endpoint = endpoints[config.service];
    if (!endpoint || !['localhost', '127.0.0.1', '::1'].includes(endpoint.host)
      || !Number.isInteger(endpoint.port) || endpoint.port < 1 || endpoint.port > 65535) {
      throw new Error(`Cau hinh ${config.service} phai dung host local va cong hop le de khoi dong bang Docker tren may nay.`);
    }
  }
  const info = docker(['info', '--format', '{{.ServerVersion}}']);
  if (info.status !== 0) {
    throw new Error('Khong ket noi duoc Docker. Hay mo Docker Desktop / Docker Engine truoc khi chay npm run be.\n' + (info.stderr || ''));
  }

  const inspect = name => {
    const result = docker(['inspect', '--type', 'container', '--format', '{"image":{{json .Config.Image}},"state":{{json .State}},"ports":{{json .HostConfig.PortBindings}}}', name]);
    if (result.status !== 0) {
      if (/no such (?:object|container)/i.test(result.stderr || '')) return null;
      throw new Error(`Khong kiem tra duoc container ${name}. ${result.stderr || ''}`);
    }
    return JSON.parse(result.stdout);
  };
  const selected = [];
  for (const config of services) {
    let name;
    let container;
    let existing = false;
    for (const candidate of config.names) {
      const found = inspect(candidate);
      if (found) {
        existing = true;
        if (matchesEndpoint(found, config, endpoints[config.service])) { name = candidate; container = found; break; }
      }
    }
    if (!container && existing) throw new Error(`Container ${config.service} hien co khong map dung cong ${endpoints[config.service].port} cua backend. Kiem tra MYSQL_PORT/RABBITMQ_PORT trong .env; khong tu tao lai database.`);
    if (!container) {
      log(`==> Tao va bat ${config.service} bang Docker Compose...`);
      const result = docker(['compose', '-f', composeFile, 'up', '-d', '--no-deps', '--no-recreate', config.service], { output: true });
      if (result.status !== 0) throw new Error(`Khong khoi dong duoc ${config.service}. Kiem tra Docker va xung dot cong. ${result.stderr || ''}`);
      name = config.names.at(-1);
      container = inspect(name);
    }
    if (!container || !config.image.test(container.image)) {
      throw new Error(`Container ${name} khong phai ${config.service}; dung khoi dong de tranh dung nham du lieu.`);
    }
    if (!matchesEndpoint(container, config, endpoints[config.service])) {
      throw new Error(`Container ${name} khong map dung cong ${endpoints[config.service].port} cua backend.`);
    }
    if (container.state.Status !== 'running') {
      log(`==> Bat lai container ${name}...`);
      const result = docker(['start', name], { output: true });
      if (result.status !== 0) throw new Error(`Khong bat duoc ${config.service} (${name}). ${result.stderr || ''}`);
    } else {
      log(`==> Dung container dang chay: ${name}`);
    }
    selected.push({ ...config, name });
  }

  log('==> Cho MySQL va RabbitMQ san sang...');
  const deadline = now() + timeoutMs;
  let pending = [...selected];
  while (pending.length && now() < deadline) {
    pending = selected.filter(config => {
      const container = inspect(config.name);
      if (!container || ['exited', 'dead'].includes(container.state.Status)) {
        throw new Error(`${config.service} (${config.name}) da dung. Xem: docker logs ${config.name}`);
      }
      if (container.state.Status !== 'running') return true;
      if (container.state.Health && container.state.Health.Status !== 'healthy') return true;
      return docker(['exec', config.name, ...config.probe]).status !== 0;
    });
    if (pending.length) await sleep(pollMs);
  }
  if (pending.length) throw new Error(`Chua san sang: ${pending.map(config => config.name).join(', ')}. Kiem tra bang docker logs <ten-container>.`);
  log('==> MySQL va RabbitMQ da san sang. Tiep tuc khoi dong backend.');
  return Object.fromEntries(selected.map(config => [config.service, config.name]));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  ensureInfrastructure().catch(error => { console.error(error.message); process.exitCode = 1; });
}
