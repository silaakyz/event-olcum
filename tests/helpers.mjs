import { spawn } from 'node:child_process';
import path from 'node:path';

const DEFAULT_PORT = 3100;
export const TEST_BASE_URL = process.env.TEST_BASE_URL ?? `http://127.0.0.1:${DEFAULT_PORT}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForServer(baseUrl = TEST_BASE_URL, timeoutMs = 120000) {
  const start = Date.now();

  const probeUrl = baseUrl.replace(/\/$/, '');

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(probeUrl, { method: 'GET' });
      if (response.status === 200) {
        return true;
      }
      // If server returns HTML or other status codes, keep polling until 200
    } catch (err) {
      // server not ready yet; continue retrying
    }

    await sleep(500);
  }

  throw new Error(`Server did not start within ${timeoutMs}ms at ${baseUrl}`);
}

export function startServer() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  // Before starting, ensure build exists by running `npm run build`.
  const build = spawn(npmCommand, ['run', 'build'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'test', PORT: String(DEFAULT_PORT) },
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let buildStdout = '';
  let buildStderr = '';
  build.stdout.on('data', (c) => (buildStdout += c.toString()));
  build.stderr.on('data', (c) => (buildStderr += c.toString()));

  // Wait for build to finish synchronously-ish
  const buildResult = new Promise((resolve, reject) => {
    build.on('exit', (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(`Build failed with exit code ${code}: ${buildStderr}`));
    });
    build.on('error', (err) => reject(err));
  });

  // Helper to check and kill existing process on port
  async function ensurePortFree(port) {
    if (process.platform === 'win32') {
      const check = spawn('netstat', ['-ano'], { shell: true });
      let out = '';
      for await (const chunk of check.stdout) out += chunk.toString();
      // find lines containing `:${port}` and LISTENING
      const lines = out.split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        if (line.includes(`:${port}`) && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          try {
            // Force kill the process
            spawn('taskkill', ['/PID', pid, '/F']);
          } catch (e) {
            // ignore
          }
        }
      }
    } else {
      // POSIX: lsof
      try {
        const lsof = spawn('lsof', ['-i', `:${port}`, '-t']);
        let out = '';
        for await (const chunk of lsof.stdout) out += chunk.toString();
        const pids = out.split(/\r?\n/).filter(Boolean);
        for (const pid of pids) {
          try {
            process.kill(Number(pid), 'SIGTERM');
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // if lsof missing, ignore
      }
    }
  }

  const start = async () => {
    await buildResult;
    await ensurePortFree(DEFAULT_PORT);

    const child = spawn(npxCommand, ['next', 'start', '-p', String(DEFAULT_PORT)], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(DEFAULT_PORT), NODE_ENV: 'test' },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (chunk) => {
      try { console.log(chunk.toString()); } catch {}
    });
    child.stderr.on('data', (chunk) => {
      try { console.error(chunk.toString()); } catch {}
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    const stop = () => new Promise((resolve) => {
      if (!child.killed && child.exitCode === null) {
        child.once('exit', resolve);
        try { child.kill('SIGTERM'); } catch (e) { }
        return;
      }
      resolve();
    });

    return { child, stop, logs: () => ({ stdout, stderr, buildStdout, buildStderr }) };
  };

  // Return an object with the ability to start the server (async start)
  // Tests call startServer() and expect immediate return; adapt by
  // returning an object with `child` not yet started but with a `start` method.
  return { start };
}

export async function withServer(testFn) {
  const serverStarter = startServer();

  // start the build + server process
  const runner = await serverStarter.start();

  try {
    await waitForServer(TEST_BASE_URL, 60000);
    await testFn();
  } finally {
    await runner.stop();
  }
}
